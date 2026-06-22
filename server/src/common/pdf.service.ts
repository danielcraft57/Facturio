const PDFDocument = require('pdfkit');
import { Injectable, Logger } from '@nestjs/common';
import { PdfDocumentBuilder, resolveCompanyInfo } from './pdf/pdf-document.builder';
import { EngagementContractPdfBuilder } from './pdf/engagement-contract-pdf.builder';
import { parseTagsJson } from './document-folder.util';
import {
	buildDepositPaymentNote,
	buildDepositCommitmentParagraph,
	buildRemainderCommitmentParagraph,
	parseQuoteIdFromSplitTags,
} from '../invoices/invoice-deposit.util';
import { resolveEngagementBreakdownForInvoice } from '../invoices/invoice-engagement-breakdown.util';
import { PrismaService } from '../prisma/prisma.service';
import {
	buildProductQuoteLineDisplay,
	productHasEnrichableContent,
} from '../products/product-quote-description.util';
import { getSaasPlanLimits } from '../billing/saas-plan.limits';
import { resolveEffectiveSaasPlan } from '../billing/saas-plan.util';

const FREE_PLAN_PDF_WATERMARK = 'Essai gratuit PrestaFacture — prestafacture.com';

/**
 * Génération PDF factures et devis — template corporate (bleu marine / rouge).
 */
@Injectable()
export class PdfService {
	private readonly logger = new Logger(PdfService.name);
	private readonly builder = new PdfDocumentBuilder({
		warn: (msg, err) => this.logger.warn(msg, err)
	});
	private readonly engagementContractBuilder = new EngagementContractPdfBuilder();

	constructor(private readonly prisma: PrismaService) {}

	private async resolvePdfWatermark(
		organization?: { id?: number; organizationId?: number; saasPlan?: string; saasPlanExpiresAt?: Date | string | null } | null,
	): Promise<string | null> {
		const orgId = organization?.id ?? organization?.organizationId;
		if (orgId == null) return null;

		let saasPlan = organization?.saasPlan;
		let saasPlanExpiresAt = organization?.saasPlanExpiresAt ?? null;
		if (!saasPlan) {
			const row = await this.prisma.organization.findUnique({
				where: { id: orgId },
				select: { saasPlan: true, saasPlanExpiresAt: true },
			});
			if (!row) return null;
			saasPlan = row.saasPlan;
			saasPlanExpiresAt = row.saasPlanExpiresAt;
		}

		const plan = resolveEffectiveSaasPlan({
			saasPlan: saasPlan as never,
			saasPlanExpiresAt: saasPlanExpiresAt ? new Date(saasPlanExpiresAt) : null,
		});
		return getSaasPlanLimits(plan).pdfWatermark ? FREE_PLAN_PDF_WATERMARK : null;
	}

	private async resolveEngagementBreakdown(invoice: {
		id: string;
		sourceQuoteId: string | null;
		organizationId: number | null;
		tags: string | null;
		total?: unknown;
	}) {
		return resolveEngagementBreakdownForInvoice(this.prisma, invoice);
	}

	/**
	 * Charge l'échéancier de la facture ECH liée au devis (acompte seul n'a pas de lignes InvoiceInstallment).
	 */
	private async resolveLinkedInstallmentSchedule(
		invoice: {
			id?: string;
			sourceQuoteId?: string | null;
			organizationId?: number | null;
			tags?: string | null;
		},
		existingSchedule: { sequence: number; amount: number; dueDate: Date; status: string }[],
	): Promise<{ sequence: number; amount: number; dueDate: Date; status: string }[]> {
		if (existingSchedule.length > 0) return existingSchedule;

		const tags = parseTagsJson(invoice?.tags ?? null);
		if (!tags.includes('ACOMPTE_10')) return existingSchedule;

		const quoteId = invoice.sourceQuoteId ?? parseQuoteIdFromSplitTags(tags);
		const orgId = invoice.organizationId;
		if (!quoteId || orgId == null) return existingSchedule;

		const installmentTag = `ECHEANCIER_OF:${quoteId}`;
		const linked = await this.prisma.invoice.findFirst({
			where: {
				organizationId: orgId,
				status: { not: 'CANCELLED' },
				tags: { contains: `"${installmentTag}"` },
				...(invoice.id ? { id: { not: invoice.id } } : {}),
			},
			select: { id: true },
			orderBy: { createdAt: 'desc' },
		});
		if (!linked) return existingSchedule;

		const rows = await this.prisma.invoiceInstallment.findMany({
			where: { invoiceId: linked.id },
			orderBy: { sequence: 'asc' },
		});
		return rows.map((r) => ({
			sequence: r.sequence,
			amount: Number(r.amount),
			dueDate: r.dueDate,
			status: r.status,
		}));
	}

	async generateInvoicePdf(invoice: any, organization?: any): Promise<Buffer> {
		const tags = parseTagsJson(invoice?.tags ?? null);
		const dueDateFr = invoice?.dueDate ? new Date(invoice.dueDate).toLocaleDateString('fr-FR') : null;
		const isDeposit = tags.includes('ACOMPTE_10');
		const isRemainder = tags.includes('SOLDE_APRES_ACOMPTE');
		const isInstallment = tags.includes('ECHEANCIER');
		const engagementBreakdown = await this.resolveEngagementBreakdown(invoice);

		let sourceQuoteNumber: string | null = null;
		const quoteIdForRef = invoice.sourceQuoteId ?? parseQuoteIdFromSplitTags(tags);
		if (quoteIdForRef) {
			const quoteRow = await this.prisma.quote.findUnique({
				where: { id: quoteIdForRef },
				select: { number: true },
			});
			sourceQuoteNumber = quoteRow?.number ?? null;
		}

		let installmentSchedule: { sequence: number; amount: number; dueDate: Date; status: string }[] =
			[];
		if (invoice.id) {
			const rows = await this.prisma.invoiceInstallment.findMany({
				where: { invoiceId: invoice.id },
				orderBy: { sequence: 'asc' },
			});
			installmentSchedule = rows.map((r) => ({
				sequence: r.sequence,
				amount: Number(r.amount),
				dueDate: r.dueDate,
				status: r.status,
			}));
		} else if (Array.isArray(invoice.installments)) {
			installmentSchedule = invoice.installments.map((r: any) => ({
				sequence: r.sequence,
				amount: Number(r.amount),
				dueDate: new Date(r.dueDate),
				status: String(r.status ?? 'PENDING'),
			}));
		}

		installmentSchedule = await this.resolveLinkedInstallmentSchedule(invoice, installmentSchedule);

		let paymentNote: string | null = null;
		if (isDeposit) {
			paymentNote =
				invoice?.status === 'PAID'
					? 'Paiement acompte reçu — merci pour votre règlement.'
					: buildDepositPaymentNote(dueDateFr);
		} else if (isRemainder) {
			paymentNote =
				invoice?.status === 'PAID'
					? 'Solde reçu — merci, votre devis est entièrement réglé.'
					: dueDateFr
						? `Solde du devis — à régler avant le ${dueDateFr} (paiement en ligne par carte bancaire).`
						: `Solde du devis (paiement en ligne par carte bancaire).`;
		} else if (isInstallment && installmentSchedule.length > 0) {
			const pending = installmentSchedule.find((r) => r.status === 'PENDING');
			const totalCount = installmentSchedule.length;
			if (pending) {
				const dueFr = new Date(pending.dueDate).toLocaleDateString('fr-FR');
				const amountFr = new Intl.NumberFormat('fr-FR', {
					style: 'currency',
					currency: 'EUR',
					maximumFractionDigits: 0,
				}).format(pending.amount);
				paymentNote =
					`Réglez la mensualité ${pending.sequence}/${totalCount} (${amountFr}) ` +
					`avant le ${dueFr} — carte bancaire en ligne ou virement.`;
			} else {
				paymentNote =
					'Facture échelonnée — le tableau ci-dessus détaille chaque mensualité et son statut.';
			}
		}

		const commitmentParagraph = isDeposit
			? buildDepositCommitmentParagraph(dueDateFr)
			: isRemainder
				? buildRemainderCommitmentParagraph(dueDateFr)
				: null;

		const appliedCreditTotal = Array.isArray(invoice?.appliedAvoirs)
			? invoice.appliedAvoirs.reduce((sum: number, a: any) => sum + Number(a.amount ?? 0), 0)
			: 0;
		const grossTotal = Number(invoice.total ?? 0);
		const netDue = Math.max(0, Number((grossTotal - appliedCreditTotal).toFixed(2)));
		const linesForPdf = invoice.lines || [];

		const document = {
			...invoice,
			...(paymentNote ? { paymentNote } : {}),
			...(commitmentParagraph && !invoice.legalMention ? { legalMention: commitmentParagraph } : {}),
			...(engagementBreakdown ? { engagementBreakdown } : {}),
			...(sourceQuoteNumber ? { sourceQuoteNumber } : {}),
			...(installmentSchedule.length > 0 ? { installmentSchedule } : {}),
		};

		const pdfTitle = isDeposit
			? `Facture d'acompte ${invoice.number}`
			: isRemainder
				? `Facture de solde ${invoice.number}`
				: isInstallment
					? `Facture échéancier ${invoice.number}`
					: `Facture ${invoice.number}`;

		const watermarkText = await this.resolvePdfWatermark(organization ?? { organizationId: invoice.organizationId });

		return this.generatePdf({
			kind: 'facture',
			number: invoice.number,
			date: invoice.date || invoice.createdAt,
			document,
			client: invoice.client,
			lines: linesForPdf,
			totals: {
				subtotal: invoice.subtotal || 0,
				tax: invoice.tax || 0,
				total: invoice.total || 0,
				...(appliedCreditTotal > 0.01
					? { creditApplied: appliedCreditTotal, netDue }
					: {}),
			},
			organization,
			pdfTitle,
			watermarkText,
		});
	}

	async generateEngagementContractPdf(invoice: any, organization?: any): Promise<Buffer> {
		const tags = parseTagsJson(invoice?.tags ?? null);
		const quoteId =
			invoice?.sourceQuoteId ??
			(() => {
				for (const tag of tags) {
					if (tag.startsWith('ACOMPTE_10_OF:')) return tag.slice('ACOMPTE_10_OF:'.length);
					if (tag.startsWith('SOLDE_APRES_ACOMPTE_OF:')) return tag.slice('SOLDE_APRES_ACOMPTE_OF:'.length);
				}
				return null;
			})();
		if (!quoteId || !invoice?.organizationId) {
			throw new Error("Impossible de générer le contrat d'engagement (devis source introuvable).");
		}
		const [quote, breakdown] = await Promise.all([
			this.prisma.quote.findUnique({
				where: { id: quoteId },
				include: { lines: true, client: true },
			}),
			this.resolveEngagementBreakdown(invoice),
		]);
		if (!quote) {
			throw new Error("Impossible de générer le contrat d'engagement (devis introuvable).");
		}
		if (!breakdown) {
			throw new Error("Impossible de générer le contrat d'engagement (répartition acompte/solde introuvable).");
		}
		const dueDateFr = invoice?.dueDate ? new Date(invoice.dueDate).toLocaleDateString('fr-FR') : null;
		const org = organization ?? invoice?.organization ?? null;

		return new Promise((resolve, reject) => {
			try {
				const doc = new PDFDocument({
					size: 'A4',
					margins: { top: 50, bottom: 50, left: 50, right: 50 },
					info: {
						Title: `Contrat d'engagement ${quote.number}`,
						Author: 'PrestaFacture',
						Subject: `Contrat d'engagement — devis ${quote.number}`,
					},
				});
				const chunks: Buffer[] = [];
				doc.on('data', (c: Buffer) => chunks.push(c));
				doc.on('end', () => resolve(Buffer.concat(chunks)));
				doc.on('error', reject);

				this.engagementContractBuilder.build(doc, {
					quote,
					client: quote.client,
					organization: org,
					breakdown,
					dueDateFr,
				});
				doc.end();
			} catch (err) {
				reject(err);
			}
		});
	}

	/** Facture d'abonnement PrestaFacture (émetteur = variables .env plateforme). */
	generateSubscriptionInvoicePdf(payload: {
		number: string;
		date: Date | string;
		client: any;
		lines: any[];
		totals: { subtotal: number; tax: number; total: number };
		organization?: any;
		document?: any;
	}): Promise<Buffer> {
		return this.generatePdf({
			kind: 'facture',
			number: payload.number,
			date: payload.date,
			signatureDate: payload.date,
			document: payload.document,
			client: payload.client,
			lines: payload.lines,
			totals: payload.totals,
			organization: payload.organization,
			signature: payload.organization?.signature ?? null,
			pdfTitle: `Facture ${payload.number}`,
		});
	}

	async generateQuotePdf(quote: any, organization?: any): Promise<Buffer> {
		const lines = await this.enrichQuoteLinesForPdf(quote.lines || []);
		const watermarkText = await this.resolvePdfWatermark(organization ?? { organizationId: quote.organizationId });
		return this.generatePdf({
			kind: 'devis',
			number: quote.number,
			date: quote.createdAt,
			document: quote,
			client: quote.client,
			lines,
			totals: {
				subtotal: quote.subtotal || 0,
				tax: quote.tax || 0,
				total: quote.total || 0
			},
			organization,
			expiryDate: quote.expiryDate,
			pdfTitle: `Devis ${quote.number}`,
			watermarkText,
		});
	}

	private async enrichQuoteLinesForPdf(lines: any[]): Promise<any[]> {
		const productIds = [
			...new Set(
				lines
					.map((l) => l.productId as number | null | undefined)
					.filter((id): id is number => id != null),
			),
		];
		if (!productIds.length) return lines;

		const products = await this.prisma.product.findMany({
			where: { id: { in: productIds } },
			select: {
				id: true,
				name: true,
				description: true,
				details: true,
				techStack: true,
				languages: true,
			},
		});
		const byId = new Map(products.map((p) => [p.id, p]));

		return lines.map((line) => {
			const productId = line.productId as number | null | undefined;
			if (!productId) return line;
			const product = byId.get(productId);
			if (!product || !productHasEnrichableContent(product)) return line;
			const quoteLineDisplay = buildProductQuoteLineDisplay(product);
			return {
				...line,
				description: line.description || product.name,
				quoteLineDisplay,
			};
		});
	}

	private generatePdf(params: {
		kind: 'facture' | 'devis';
		number: string;
		date?: Date | string;
		document: any;
		client: any;
		lines: any[];
		totals: { subtotal: number; tax: number; total: number };
		organization?: any;
		expiryDate?: Date | string;
		signature?: string | null;
		signatureDate?: Date | string;
		pdfTitle: string;
		watermarkText?: string | null;
	}): Promise<Buffer> {
		return new Promise((resolve, reject) => {
			try {
				const doc = new PDFDocument({
					size: 'A4',
					margins: { top: 0, bottom: 50, left: 0, right: 0 },
					info: {
						Title: params.pdfTitle,
						Author: 'PrestaFacture',
						Subject: params.pdfTitle
					}
				});
				const chunks: Buffer[] = [];
				doc.on('data', (c: Buffer) => chunks.push(c));
				doc.on('end', () => resolve(Buffer.concat(chunks)));
				doc.on('error', (err: Error) => {
					this.logger.error('Erreur génération PDF', err);
					reject(err);
				});

				this.builder.build(doc, {
					kind: params.kind,
					number: params.number,
					date: params.date,
					company: resolveCompanyInfo(params.organization),
					client: params.client,
					lines: params.lines,
					totals: params.totals,
					organization: params.organization,
					document: params.document,
					expiryDate: params.expiryDate,
					signature: (params as { signature?: string | null }).signature,
					signatureDate: (params as { signatureDate?: Date | string }).signatureDate,
					watermarkText: params.watermarkText ?? null,
				});

				doc.end();
			} catch (error) {
				this.logger.error('Erreur lors de la création du PDF', error);
				reject(error);
			}
		});
	}
}
