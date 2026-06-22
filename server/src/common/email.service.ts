import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import {
	emailAmountHighlight,
	emailBanner,
	emailButton,
	emailButtonRow,
	emailParagraph,
	renderFacturioEmailLayout,
	renderSimpleFacturioEmail,
} from './email-layout';
import { prepareBrandedEmailForDelivery } from './email-inline-assets';
import { getPlatformBrandName } from './email-brand';
import {
	buildEmailLegalFooter,
	buildPlatformEmailLegalFooter,
	resolveEmailIssuerDisplayName,
} from './email-legal-footer';
import {
	buildPayableDebtEmailLegalHtml,
	buildPayableDebtEmailLegalPlain,
} from './payable-debt-legal.util';

/** Profil organisation (fiche entreprise) pour pied de page et objet des emails. */
export type EmailOrganizationProfile = Record<string, unknown> | null | undefined;

/**
 * Service d'envoi d'emails avec templates
 * 
 * Supporte :
 * - Configuration SMTP flexible
 * - Templates HTML pour factures, devis, relances
 * - Pièces jointes (PDF)
 * - Mode test avec jsonTransport
 */
@Injectable()
export class EmailService {
	private readonly logger = new Logger(EmailService.name);
	private transporter: Transporter;
	private readonly fromEmail: string;
	private readonly fromName: string;
	/** Adresse no-reply dédiée (pour confirmations, reset, etc.). */
	private readonly noReplyEmail: string;

	private readonly platformBrand: string;

	constructor() {
		this.platformBrand = getPlatformBrandName();
		this.fromEmail = process.env.MAIL_FROM || 'no-reply@example.com';
		this.fromName = process.env.MAIL_FROM_NAME || this.platformBrand;
		this.noReplyEmail = process.env.MAIL_FROM_NO_REPLY || this.fromEmail || 'no-reply@example.com';

		if (process.env.NODE_ENV === 'test') {
			this.transporter = nodemailer.createTransport({ jsonTransport: true }) as Transporter;
		} else {
			this.transporter = nodemailer.createTransport({
				host: process.env.SMTP_HOST || 'localhost',
				port: Number(process.env.SMTP_PORT || 1025),
				secure: process.env.SMTP_SECURE === 'true',
				auth: process.env.SMTP_USER 
					? { 
						user: process.env.SMTP_USER, 
						pass: process.env.SMTP_PASS || '' 
					} 
					: undefined,
				tls: process.env.SMTP_REJECT_UNAUTHORIZED === 'false' 
					? { rejectUnauthorized: false } 
					: undefined
			}) as Transporter;
		}
	}

	/** Adresse d'envoi des factures (compte dédié). */
	private get invoiceFrom(): string {
		const addr = process.env.MAIL_FROM_INVOICE || 'facture@danielcraft.fr';
		const name = process.env.MAIL_FROM_INVOICE_NAME || `${this.platformBrand} Factures`;
		return `${name} <${addr}>`;
	}

	/** Adresse d'envoi des devis (compte dédié). */
	private get quoteFrom(): string {
		const addr = process.env.MAIL_FROM_QUOTE || 'devis@danielcraft.fr';
		const name = process.env.MAIL_FROM_QUOTE_NAME || `${this.platformBrand} Devis`;
		return `${name} <${addr}>`;
	}

	/** Factures d'abonnement PrestaFacture (Stripe plateforme) — défaut : MAIL_FROM_INVOICE ou abonnement@. */
	private get subscriptionFrom(): string {
		const addr =
			process.env.MAIL_FROM_SUBSCRIPTION ||
			process.env.MAIL_FROM_INVOICE ||
			'abonnement@danielcraft.fr';
		const name =
			process.env.MAIL_FROM_SUBSCRIPTION_NAME ||
			process.env.MAIL_FROM_INVOICE_NAME ||
			`${this.platformBrand} Abonnements`;
		return `${name} <${addr}>`;
	}

	/** Adresse d'envoi des emails transactionnels "no-reply". */
	private get verifyFrom(): string {
		const addr = this.noReplyEmail || 'no-reply@example.com';
		const name = this.fromName || `${this.platformBrand}`;
		return `${name} <${addr}>`;
	}

	/**
	 * Envoie un email générique.
	 * @param options.from - Optionnel : expéditeur (sinon fromEmail/fromName par défaut)
	 */
	async send(options: {
		to: string;
		subject: string;
		html?: string;
		text?: string;
		attachments?: {
			filename: string;
			content: Buffer;
			contentType?: string;
			cid?: string;
		}[];
		from?: string;
		replyTo?: string;
	}): Promise<void> {
		try {
			const from = options.from ?? `${this.fromName} <${this.fromEmail}>`;
			const { from: _omit, replyTo, html: rawHtml, attachments: rawAttachments, ...rest } = options;
			let html = rawHtml;
			let attachments = rawAttachments;
			if (rawHtml) {
				const prepared = prepareBrandedEmailForDelivery(rawHtml);
				html = prepared.html;
				if (prepared.attachments.length > 0) {
					attachments = [...prepared.attachments, ...(rawAttachments ?? [])];
					this.logger.debug(
						`Images email inline (CID): ${prepared.attachments.map((a) => a.filename).join(', ')}`,
					);
				}
			}
			const reply =
				replyTo ||
				process.env.COMPANY_EMAIL ||
				process.env.MAIL_FROM_INVOICE ||
				this.fromEmail;
			await this.transporter.sendMail({
				from,
				replyTo: reply,
				...rest,
				html,
				attachments,
				headers: {
					'Auto-Submitted': 'auto-generated',
					'X-Auto-Response-Suppress': 'All',
					...(rest as { headers?: Record<string, string> }).headers
				}
			});
			this.logger.log(`Email envoyé à ${options.to}: ${options.subject}`);
		} catch (error) {
			this.logger.error(`Erreur envoi email à ${options.to}`, error);
			throw error;
		}
	}

	/**
	 * Envoie un email de facture avec PDF en pièce jointe, pixel de tracking et style V6.
	 */
	async sendInvoice(options: {
		to: string;
		invoiceNumber: string;
		invoiceDate: Date | string;
		clientName: string;
		total: number;
		/** Contexte échéancier ECH : montant à régler maintenant (pas le total facture). */
		installmentContext?: {
			sequence: number;
			totalCount: number;
			amountDue: number;
			balanceRemaining: number;
			dueDate: Date | string;
			contractTotal?: number;
		};
		pdfBuffer: Buffer;
		extraAttachments?: { filename: string; content: Buffer; contentType?: string }[];
		trackOpenUrl?: string;
		paymentUrl?: string;
		/** Facture déjà réglée : pas de bouton payer, message adapté */
		alreadyPaid?: boolean;
		invoiceViewUrl?: string;
		/** Copie prestataire / tiers : PDF joint, sans lien de paiement ni suivi d’ouverture */
		informativeCopy?: boolean;
		organization?: EmailOrganizationProfile;
	}): Promise<void> {
		const company = resolveEmailIssuerDisplayName(options.organization);
		const legalFooter = buildEmailLegalFooter(options.organization);
		const copy = options.informativeCopy === true;
		const subject = copy
			? `[Copie] Facture ${options.invoiceNumber} — ${options.clientName} — ${company}`
			: options.alreadyPaid
				? `Facture ${options.invoiceNumber} (réglée) — ${company}`
				: `Facture ${options.invoiceNumber} — ${company}`;
		const html = this.getInvoiceTemplate({
			invoiceNumber: options.invoiceNumber,
			invoiceDate: options.invoiceDate,
			clientName: options.clientName,
			total: options.total,
			installmentContext: options.installmentContext,
			trackOpenUrl: copy ? undefined : options.trackOpenUrl,
			paymentUrl: copy ? undefined : options.paymentUrl,
			alreadyPaid: copy ? undefined : options.alreadyPaid,
			invoiceViewUrl: copy ? undefined : options.invoiceViewUrl,
			informativeCopy: copy,
			legalFooter,
		});

		const paymentLine =
			copy || options.alreadyPaid
				? options.alreadyPaid && !copy && options.invoiceViewUrl
					? `\n\nConsulter la facture en ligne :\n${options.invoiceViewUrl}\n`
					: ''
				: options.paymentUrl
					? `\n\nConsulter et payer en ligne :\n${options.paymentUrl}\n`
					: options.invoiceViewUrl
						? `\n\nConsulter la facture en ligne :\n${options.invoiceViewUrl}\n(Règlement par carte non disponible.)\n`
						: '';

		const paidNote =
			!copy && options.alreadyPaid
				? '\n\nCette facture a déjà été réglée. Vous trouverez le justificatif en pièce jointe.\n'
				: '';
		const copyNote = copy
			? '\n\nCopie à titre informatif (document envoyé au client). Aucun lien de paiement en ligne dans ce message.\n'
			: '';

		const amountLabel = options.installmentContext
			? `Échéance ${options.installmentContext.sequence}/${options.installmentContext.totalCount} : ${this.formatCurrency(options.installmentContext.amountDue)}`
			: `d'un montant de ${this.formatCurrency(options.total)}`;

		await this.send({
			from: this.invoiceFrom,
			to: options.to,
			subject,
			html,
			text:
				(copy ? 'Bonjour,\n\n' : `Bonjour ${options.clientName},\n\n`) +
				(copy
					? `Copie de la facture ${options.invoiceNumber} `
					: `Veuillez trouver ci-joint la facture ${options.invoiceNumber} `) +
				`du ${new Date(options.invoiceDate).toLocaleDateString('fr-FR')} ${amountLabel}.${copyNote}${paidNote}${paymentLine}\n` +
				(options.installmentContext
					? `Solde restant sur cette facture : ${this.formatCurrency(options.installmentContext.balanceRemaining)}.\n`
					: '') +
				`Cordialement,\n${company}`,
			attachments: [
				{
					filename: `facture-${options.invoiceNumber}.pdf`,
					content: options.pdfBuffer,
					contentType: 'application/pdf'
				},
				...(options.extraAttachments ?? []),
			]
		});
	}

	/**
	 * Envoie un email de devis avec PDF, pixel de tracking, boutons Accepter/Refuser et style V6.
	 */
	async sendQuote(options: {
		to: string;
		quoteNumber: string;
		quoteDate: Date | string;
		clientName: string;
		total: number;
		expiryDate?: Date | string;
		pdfBuffer: Buffer;
		trackOpenUrl?: string;
		acceptUrl?: string;
		rejectUrl?: string;
		/** Copie prestataire / tiers : PDF joint, sans accepter/refuser ni suivi */
		informativeCopy?: boolean;
		organization?: EmailOrganizationProfile;
	}): Promise<void> {
		const company = resolveEmailIssuerDisplayName(options.organization);
		const legalFooter = buildEmailLegalFooter(options.organization);
		const copy = options.informativeCopy === true;
		const subject = copy
			? `[Copie] Devis ${options.quoteNumber} — ${options.clientName} — ${company}`
			: `Devis ${options.quoteNumber}`;
		const html = this.getQuoteTemplate({
			quoteNumber: options.quoteNumber,
			quoteDate: options.quoteDate,
			clientName: options.clientName,
			total: options.total,
			expiryDate: options.expiryDate,
			trackOpenUrl: copy ? undefined : options.trackOpenUrl,
			acceptUrl: copy ? undefined : options.acceptUrl,
			rejectUrl: copy ? undefined : options.rejectUrl,
			informativeCopy: copy,
			legalFooter,
		});

		const copyNote = copy
			? '\n\nCopie à titre informatif (document envoyé au client). Aucun lien d’acceptation ou de paiement dans ce message.\n'
			: '';

		await this.send({
			from: this.quoteFrom,
			to: options.to,
			subject,
			html,
			text:
				`Bonjour,\n\n` +
				(copy
					? `Copie du devis ${options.quoteNumber} `
					: `Veuillez trouver ci-joint le devis ${options.quoteNumber} `) +
				`d'un montant de ${this.formatCurrency(options.total)}.${copyNote}\n\nCordialement`,
			attachments: [{
				filename: `devis-${options.quoteNumber}.pdf`,
				content: options.pdfBuffer,
				contentType: 'application/pdf'
			}]
		});
	}

	/**
	 * Envoie un email de relance
	 */
	async sendReminder(options: {
		to: string;
		invoiceNumber: string;
		invoiceDate: Date | string;
		clientName: string;
		amount: number;
		daysOverdue?: number;
		paymentUrl?: string;
		trackOpenUrl?: string;
		pdfBuffer?: Buffer;
		organization?: EmailOrganizationProfile;
	}): Promise<void> {
		const legalFooter = buildEmailLegalFooter(options.organization);
		const subject = options.daysOverdue
			? `Relance - Facture ${options.invoiceNumber} (${options.daysOverdue} jour(s) de retard)`
			: `Relance - Facture ${options.invoiceNumber}`;
		const html = this.getReminderTemplate({
			invoiceNumber: options.invoiceNumber,
			invoiceDate: options.invoiceDate,
			clientName: options.clientName,
			amount: options.amount,
			daysOverdue: options.daysOverdue,
			paymentUrl: options.paymentUrl,
			trackOpenUrl: options.trackOpenUrl,
			legalFooter,
		});
		const payLine = options.paymentUrl
			? `\n\nConsulter ou régler en ligne : ${options.paymentUrl}`
			: '';
		const text = `Bonjour ${options.clientName},\n\nNous vous rappelons que la facture ${options.invoiceNumber} d'un montant de ${this.formatCurrency(options.amount)} est toujours en attente de paiement.${payLine}\n\nCordialement`;

		await this.send({
			from: this.invoiceFrom,
			to: options.to,
			subject,
			html,
			text,
			attachments: options.pdfBuffer
				? [{ filename: `facture-${options.invoiceNumber}.pdf`, content: options.pdfBuffer, contentType: 'application/pdf' }]
				: undefined
		});
	}

	/**
	 * Relance liée à une échéance du plan de paiement métier.
	 */
	async sendInstallmentReminder(options: {
		to: string;
		clientName: string;
		invoiceNumber: string;
		invoiceDate: Date | string;
		installmentSequence: number;
		installmentAmount: number;
		installmentDueDate: Date | string;
		invoiceBalance: number;
		daysUntilDue: number;
		daysOverdue?: number;
		kind: 'issue' | 'upcoming' | 'overdue' | 'manual';
		paymentUrl?: string;
		trackOpenUrl?: string;
		pdfBuffer?: Buffer;
		organization?: EmailOrganizationProfile;
	}): Promise<void> {
		const legalFooter = buildEmailLegalFooter(options.organization);
		const dueFr = new Date(options.installmentDueDate).toLocaleDateString('fr-FR');
		const subject =
			options.kind === 'issue'
				? `Mensualité n°${options.installmentSequence} à régler — Facture ${options.invoiceNumber}`
				: options.kind === 'overdue' || (options.daysOverdue ?? 0) > 0
					? `Échéance en retard — Facture ${options.invoiceNumber} (n°${options.installmentSequence})`
					: `Rappel échéance — Facture ${options.invoiceNumber} (n°${options.installmentSequence})`;
		const intro =
			options.kind === 'issue'
				? `Votre mensualité n°${options.installmentSequence} sur la facture <strong>${options.invoiceNumber}</strong> est maintenant à régler.`
				: options.kind === 'overdue' || (options.daysOverdue ?? 0) > 0
					? `L'échéance n°${options.installmentSequence} de votre facture <strong>${options.invoiceNumber}</strong> est en retard de ${options.daysOverdue ?? Math.abs(options.daysUntilDue)} jour(s).`
					: options.daysUntilDue === 0
						? `L'échéance n°${options.installmentSequence} de votre facture <strong>${options.invoiceNumber}</strong> arrive aujourd'hui.`
						: `Nous vous rappelons l'échéance n°${options.installmentSequence} de votre facture <strong>${options.invoiceNumber}</strong> (dans ${options.daysUntilDue} jour(s)).`;

		const payBtn = options.paymentUrl
			? `<p style="margin:24px 0;"><a href="${options.paymentUrl}" style="background:#16a34a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Régler cette échéance en ligne</a></p>`
			: '';

		const html = `
			<p>Bonjour ${options.clientName},</p>
			<p>${intro}</p>
			<ul>
				<li><strong>Montant de l'échéance :</strong> ${this.formatCurrency(options.installmentAmount)}</li>
				<li><strong>Date prévue :</strong> ${dueFr}</li>
				<li><strong>Solde restant sur la facture :</strong> ${this.formatCurrency(options.invoiceBalance)}</li>
			</ul>
			${payBtn}
			<p>Merci de procéder au règlement selon les modalités convenues.</p>
			${legalFooter}
			${options.trackOpenUrl ? `<img src="${options.trackOpenUrl}" alt="" width="1" height="1" style="display:none" />` : ''}
		`;

		const payLine = options.paymentUrl ? `\n\nRégler en ligne : ${options.paymentUrl}` : '';
		const text = `Bonjour ${options.clientName},\n\nÉchéance n°${options.installmentSequence} — facture ${options.invoiceNumber} : ${this.formatCurrency(options.installmentAmount)} à régler avant le ${dueFr}. Solde facture : ${this.formatCurrency(options.invoiceBalance)}.${payLine}\n\nCordialement`;

		await this.send({
			from: this.invoiceFrom,
			to: options.to,
			subject,
			html,
			text,
			attachments: options.pdfBuffer
				? [
						{
							filename: `facture-${options.invoiceNumber}.pdf`,
							content: options.pdfBuffer,
							contentType: 'application/pdf',
						},
					]
				: undefined,
		});
	}

	/** Confirmation de paiement intégral — envoyé au client de la facture. */
	async sendInvoicePaidToClient(options: {
		to: string;
		clientName: string;
		invoiceNumber: string;
		invoiceDate: Date | string;
		total: number;
		lastPaymentAmount: number;
		paymentMethodLabel: string;
		issuerName: string;
		invoiceViewUrl?: string;
		replyTo?: string;
		attachments?: { filename: string; content: Buffer; contentType?: string }[];
		paidContext?: {
			kind: 'deposit' | 'remainder' | 'installment' | 'standard';
			contractTotal?: number;
			remainderAmount?: number;
		};
		organization?: EmailOrganizationProfile;
	}): Promise<void> {
		const legalFooter = buildEmailLegalFooter(options.organization);
		const html = this.getInvoicePaidClientTemplate({ ...options, legalFooter });
		const viewLine = options.invoiceViewUrl
			? `\n\nConsulter la facture : ${options.invoiceViewUrl}`
			: '';
		const attachmentLine =
			(options.attachments?.length ?? 0) > 0
				? '\n\nVous trouverez en pièce jointe votre facture PDF' +
					(options.attachments!.length > 1 ? ' et le contrat de prestation.' : '.')
				: '';

		let statusLine: string;
		if (options.paidContext?.kind === 'deposit') {
			const solde =
				options.paidContext.remainderAmount != null
					? this.formatCurrency(options.paidContext.remainderAmount)
					: null;
			statusLine =
				`Montant de cette facture d'acompte : ${this.formatCurrency(options.total)} — réglée.` +
				(solde ? `\nSolde restant sur le devis : ${solde} (facturé ultérieurement).` : '');
		} else if (options.paidContext?.kind === 'remainder') {
			statusLine = `Montant total de la facture de solde : ${this.formatCurrency(options.total)} — réglée. Votre devis est entièrement payé.`;
		} else {
			statusLine = `Montant total de la facture : ${this.formatCurrency(options.total)} — facture réglée.`;
		}

		const text =
			`Bonjour ${options.clientName},\n\n` +
			`Nous confirmons la réception de votre paiement pour la facture ${options.invoiceNumber} ` +
			`(${this.formatCurrency(options.lastPaymentAmount)} — ${options.paymentMethodLabel}).\n\n` +
			`${statusLine}${attachmentLine}${viewLine}\n\n` +
			`Cordialement,\n${options.issuerName}`;

		await this.send({
			from: this.invoiceFrom,
			to: options.to,
			replyTo: options.replyTo,
			subject: `Paiement reçu — Facture ${options.invoiceNumber}`,
			html,
			text,
			attachments: options.attachments,
		});
	}

	/** Notification de paiement intégral — envoyé au prestataire (organisation). */
	async sendInvoicePaidToProvider(options: {
		to: string;
		issuerName: string;
		clientName: string;
		invoiceNumber: string;
		total: number;
		lastPaymentAmount: number;
		paymentMethodLabel: string;
		appInvoiceUrl: string;
		organization?: EmailOrganizationProfile;
	}): Promise<void> {
		const legalFooter = buildEmailLegalFooter(options.organization);
		const html = this.getInvoicePaidProviderTemplate({ ...options, legalFooter });
		const text =
			`La facture ${options.invoiceNumber} a été intégralement payée par ${options.clientName}.\n` +
			`Montant encaissé : ${this.formatCurrency(options.lastPaymentAmount)} (${options.paymentMethodLabel}).\n` +
			`Total facture : ${this.formatCurrency(options.total)}.\n\n` +
			`Voir la facture : ${options.appInvoiceUrl}`;

		await this.send({
			from: this.invoiceFrom,
			to: options.to,
			subject: `Facture ${options.invoiceNumber} payée — ${options.clientName}`,
			html,
			text,
		});
	}

	/**
	 * Notification de remboursement — envoyée au client de la facture.
	 * (Simple message transactionnel ; pas de template dédiée pour l'instant.)
	 */
	async sendInvoiceRefundedToClient(options: {
		to: string;
		clientName: string;
		invoiceNumber: string;
		invoiceDate: Date | string;
		refundedAmount: number;
		refundReason?: string | null;
		issuerName: string;
		organization?: EmailOrganizationProfile;
	}): Promise<void> {
		const legalFooter = buildEmailLegalFooter(options.organization);
		const subject = `Remboursement effectué — Facture ${options.invoiceNumber}`;
		const reasonBlock = options.refundReason?.trim()
			? emailParagraph(`<strong>Motif :</strong> ${options.refundReason}`)
			: '';
		const html = renderSimpleFacturioEmail({
			title: subject,
			headline: 'Remboursement effectué',
			headerVariant: 'danger',
			footerHtml: `<p>${legalFooter}</p>`,
			bodyHtml:
				emailParagraph(`Bonjour ${options.clientName},`) +
				emailParagraph(
					`Nous vous confirmons que <strong>${this.formatCurrency(options.refundedAmount)}</strong> a été remboursé(e) pour la facture <strong>${options.invoiceNumber}</strong> (du ${new Date(options.invoiceDate).toLocaleDateString('fr-FR')}).`,
				) +
				reasonBlock +
				emailParagraph(`Cordialement,<br><strong>${options.issuerName}</strong>`),
		});

		const text =
			`Bonjour ${options.clientName},\n\n` +
			`Nous vous confirmons que ${this.formatCurrency(options.refundedAmount)} a été remboursé(e) pour la facture ` +
			`${options.invoiceNumber}.\n` +
			(options.refundReason?.trim() ? `Motif : ${options.refundReason.trim()}\n` : '') +
			`\nCordialement,\n${options.issuerName}`;

		await this.send({
			from: this.invoiceFrom,
			to: options.to,
			subject,
			html,
			text,
		});
	}

	/** Notification “crédit client” (avoir émis, à déduire d’une prochaine facture). */
	async sendInvoiceCreditedToClient(options: {
		to: string;
		clientName: string;
		invoiceNumber: string;
		creditedAmount: number;
		reason?: string | null;
		issuerName: string;
		organization?: EmailOrganizationProfile;
	}): Promise<void> {
		const legalFooter = buildEmailLegalFooter(options.organization);
		const subject = `Crédit émis — Facture ${options.invoiceNumber}`;
		const reasonBlock = options.reason?.trim()
			? emailParagraph(`<strong>Motif :</strong> ${options.reason}`)
			: '';
		const html = renderSimpleFacturioEmail({
			title: subject,
			headline: 'Crédit client',
			headerVariant: 'default',
			footerHtml: `<p>${legalFooter}</p>`,
			bodyHtml:
				emailParagraph(`Bonjour ${options.clientName},`) +
				emailParagraph(
					`Un crédit de <strong>${this.formatCurrency(options.creditedAmount)}</strong> a été émis pour la facture <strong>${options.invoiceNumber}</strong>.`,
				) +
				emailParagraph(
					'Ce crédit sera déduit d’une prochaine facture (il n’y a pas de remboursement bancaire pour cette opération).',
				) +
				reasonBlock +
				emailParagraph(`Cordialement,<br><strong>${options.issuerName}</strong>`),
		});

		const text =
			`Bonjour ${options.clientName},\n\n` +
			`Un crédit de ${this.formatCurrency(options.creditedAmount)} a été émis pour la facture ${options.invoiceNumber}.\n` +
			`Ce crédit sera déduit d’une prochaine facture (pas de remboursement bancaire).\n` +
			(options.reason?.trim() ? `Motif : ${options.reason.trim()}\n` : '') +
			`\nCordialement,\n${options.issuerName}`;

		await this.send({
			from: this.invoiceFrom,
			to: options.to,
			subject,
			html,
			text,
		});
	}

	/** Notification au créancier : reconnaissance d’une dette à régler. */
	async sendPayableDebt(options: {
		to: string;
		creditorName: string;
		label: string;
		totalAmount: number;
		balance: number;
		dueDate?: Date | string | null;
		notes?: string | null;
		issuerName: string;
		trackOpenUrl?: string;
		viewUrl?: string;
		organization?: EmailOrganizationProfile;
	}): Promise<void> {
		const legalFooter = buildEmailLegalFooter(options.organization);
		const subject = 'Reconnaissance de dette';
		const dueLine = options.dueDate
			? emailParagraph(
					`<strong>Échéance convenue :</strong> ${new Date(options.dueDate).toLocaleDateString('fr-FR')}`,
				)
			: emailParagraph(
					'<em>Aucune date d’échéance indiquée sur ce document.</em>',
				);
		const notesBlock = options.notes?.trim()
			? emailParagraph(`<strong>Précisions :</strong> ${options.notes.trim()}`)
			: '';
		const viewBtn = options.viewUrl
			? emailButton(options.viewUrl, 'Voir le détail', 'primary')
			: '';
		const legalBlock = buildPayableDebtEmailLegalHtml(options.organization);
		const html = renderSimpleFacturioEmail({
			title: subject,
			headline: 'Reconnaissance de dette',
			headerVariant: 'default',
			footerHtml: `<p style="margin:0 0 8px;">${legalFooter}</p>`,
			trackPixel: options.trackOpenUrl,
			bodyHtml:
				emailParagraph(`Bonjour ${options.creditorName},`) +
				emailParagraph(
					`<strong>${options.issuerName}</strong> vous informe reconnaître une dette de <strong>${this.formatCurrency(options.totalAmount)}</strong> au titre de : <strong>${options.label}</strong>.`,
				) +
				emailParagraph(
					`Solde restant dû à ce jour : <strong>${this.formatCurrency(options.balance)}</strong>.`,
				) +
				dueLine +
				notesBlock +
				viewBtn +
				legalBlock +
				emailParagraph(`Cordialement,<br><strong>${options.issuerName}</strong>`),
		});

		const dueText = options.dueDate
			? `Échéance convenue : ${new Date(options.dueDate).toLocaleDateString('fr-FR')}\n`
			: '';
		const text =
			`Bonjour ${options.creditorName},\n\n` +
			`${options.issuerName} reconnaît une dette de ${this.formatCurrency(options.totalAmount)} ` +
			`(${options.label}). Solde restant : ${this.formatCurrency(options.balance)}.\n` +
			dueText +
			(options.notes?.trim() ? `Précisions : ${options.notes.trim()}\n` : '') +
			`\n${buildPayableDebtEmailLegalPlain(options.organization)}` +
			`\nCordialement,\n${options.issuerName}`;

		await this.send({
			from: this.invoiceFrom,
			to: options.to,
			subject,
			html,
			text,
		});
	}

	/** Notification au créancier après enregistrement d’un remboursement. */
	async sendPayableDebtPayment(options: {
		to: string;
		creditorName: string;
		label: string;
		paymentAmount: number;
		totalAmount: number;
		totalPaid: number;
		balance: number;
		fullyPaid: boolean;
		issuerName: string;
		trackOpenUrl?: string;
		viewUrl?: string;
		organization?: EmailOrganizationProfile;
	}): Promise<void> {
		const legalFooter = buildEmailLegalFooter(options.organization);
		const subject = options.fullyPaid
			? 'Remboursement de la dette'
			: 'Remboursement partiel de la dette';
		const balanceLine = options.fullyPaid
			? emailParagraph(
					'<strong>Cette dette est désormais entièrement soldée.</strong>',
				)
			: emailParagraph(
					`Solde restant dû : <strong>${this.formatCurrency(options.balance)}</strong>.`,
				);
		const viewBtn = options.viewUrl
			? emailButton(options.viewUrl, 'Voir le détail', 'primary')
			: '';
		const legalBlock = buildPayableDebtEmailLegalHtml(options.organization);
		const html = renderSimpleFacturioEmail({
			title: subject,
			headline: subject,
			headerVariant: 'default',
			footerHtml: `<p style="margin:0 0 8px;">${legalFooter}</p>`,
			trackPixel: options.trackOpenUrl,
			bodyHtml:
				emailParagraph(`Bonjour ${options.creditorName},`) +
				emailParagraph(
					`<strong>${options.issuerName}</strong> vous informe avoir enregistré un remboursement de <strong>${this.formatCurrency(options.paymentAmount)}</strong> au titre de la dette : <strong>${options.label}</strong>.`,
				) +
				emailParagraph(
					`Montant initial : <strong>${this.formatCurrency(options.totalAmount)}</strong> — Total déjà remboursé : <strong>${this.formatCurrency(options.totalPaid)}</strong>.`,
				) +
				balanceLine +
				viewBtn +
				legalBlock +
				emailParagraph(`Cordialement,<br><strong>${options.issuerName}</strong>`),
		});

		const balanceText = options.fullyPaid
			? 'Cette dette est désormais entièrement soldée.\n'
			: `Solde restant : ${this.formatCurrency(options.balance)}.\n`;
		const text =
			`Bonjour ${options.creditorName},\n\n` +
			`${options.issuerName} a enregistré un remboursement de ${this.formatCurrency(options.paymentAmount)} ` +
			`(${options.label}). Montant initial : ${this.formatCurrency(options.totalAmount)}, ` +
			`total remboursé : ${this.formatCurrency(options.totalPaid)}.\n` +
			balanceText +
			`\n${buildPayableDebtEmailLegalPlain(options.organization)}` +
			`\nCordialement,\n${options.issuerName}`;

		await this.send({
			from: this.invoiceFrom,
			to: options.to,
			subject,
			html,
			text,
		});
	}

	/**
	 * Template HTML pour facture (style DanielCraftFr, pixel tracking, mentions légales).
	 */
	private getInvoiceTemplate(data: {
		invoiceNumber: string;
		invoiceDate: Date | string;
		clientName: string;
		total: number;
		installmentContext?: {
			sequence: number;
			totalCount: number;
			amountDue: number;
			balanceRemaining: number;
			dueDate: Date | string;
			contractTotal?: number;
		};
		trackOpenUrl?: string;
		paymentUrl?: string;
		alreadyPaid?: boolean;
		invoiceViewUrl?: string;
		informativeCopy?: boolean;
		legalFooter: string;
	}): string {
		const dateStr = new Date(data.invoiceDate).toLocaleDateString('fr-FR');
		const copyBanner = data.informativeCopy
			? emailBanner(
					'<strong>Copie à titre informatif</strong> — document envoyé au client. Ce message ne contient pas de lien de paiement en ligne.',
					'warning',
				)
			: '';

		let statusBlock = '';
		if (!data.informativeCopy) {
			statusBlock = data.alreadyPaid
				? emailBanner(
						`Cette facture a déjà été réglée. Vous trouverez le justificatif en pièce jointe${data.invoiceViewUrl ? ' ; vous pouvez aussi la consulter en ligne.' : '.'}`,
						'success',
					)
				: emailParagraph('Merci de régler cette facture dans les délais convenus.');
		}

		let actions = '';
		if (!data.informativeCopy) {
			if (data.alreadyPaid && data.invoiceViewUrl) {
				actions =
					emailButton(data.invoiceViewUrl, 'Voir la facture en ligne', 'secondary') +
					emailParagraph(
						'<span style="font-size:12px;color:#64748b;">Consultation en ligne du justificatif.</span>',
					);
			} else if (data.paymentUrl) {
				actions =
					emailButton(data.paymentUrl, 'Voir la facture et payer en ligne', 'success') +
					emailParagraph(
						'<span style="font-size:12px;color:#64748b;">Paiement sécurisé par carte bancaire.</span>',
					);
			} else if (data.invoiceViewUrl) {
				actions =
					emailButton(data.invoiceViewUrl, 'Voir la facture en ligne', 'secondary') +
					emailParagraph(
						'<span style="font-size:12px;color:#64748b;">Le règlement en ligne par carte n’est pas disponible pour cette facture.</span>',
					);
			}
		}

		const greeting = data.informativeCopy ? 'Bonjour,' : `Bonjour ${data.clientName},`;
		const intro = data.informativeCopy
			? `Copie de la facture <strong>${data.invoiceNumber}</strong> du ${dateStr} (client : ${data.clientName}).`
			: data.installmentContext
				? `Veuillez trouver ci-joint la facture <strong>${data.invoiceNumber}</strong> du ${dateStr}. Réglez la mensualité ci-dessous.`
				: `Veuillez trouver ci-joint la facture <strong>${data.invoiceNumber}</strong> du ${dateStr}.`;

		const inst = data.installmentContext;
		const dueFr = inst ? new Date(inst.dueDate).toLocaleDateString('fr-FR') : '';
		const amountBlock = inst
			? emailAmountHighlight(
					`Échéance ${inst.sequence}/${inst.totalCount} — ${this.formatCurrency(inst.amountDue)} à régler`,
				) +
				emailParagraph(
					`<strong>Date prévue :</strong> ${dueFr}<br>` +
						`<strong>Solde restant sur cette facture :</strong> ${this.formatCurrency(inst.balanceRemaining)}` +
						(inst.contractTotal != null
							? `<br><span style="color:#64748b;font-size:13px;">Montant total du contrat : ${this.formatCurrency(inst.contractTotal)}</span>`
							: ''),
				)
			: emailAmountHighlight(`Montant total : ${this.formatCurrency(data.total)}`);

		return renderFacturioEmailLayout({
			title: `Facture ${data.invoiceNumber}`,
			headline: `Facture ${data.invoiceNumber}`,
			headerVariant: 'default',
			trackPixel: data.trackOpenUrl,
			contentHtml:
				copyBanner +
				emailParagraph(greeting) +
				emailParagraph(intro) +
				amountBlock +
				statusBlock +
				actions,
			footerHtml: `<p>${data.legalFooter}</p>`,
		});
	}

	private getInvoicePaidClientTemplate(data: {
		clientName: string;
		invoiceNumber: string;
		invoiceDate: Date | string;
		total: number;
		lastPaymentAmount: number;
		paymentMethodLabel: string;
		issuerName: string;
		invoiceViewUrl?: string;
		attachments?: { filename: string; content: Buffer; contentType?: string }[];
		paidContext?: {
			kind: 'deposit' | 'remainder' | 'installment' | 'standard';
			contractTotal?: number;
			remainderAmount?: number;
		};
		legalFooter: string;
	}): string {
		const viewBtn = data.invoiceViewUrl
			? emailButton(data.invoiceViewUrl, 'Voir la facture', 'success')
			: '';

		const kind = data.paidContext?.kind ?? 'standard';
		const intro =
			kind === 'deposit'
				? `Votre <strong>paiement acompte</strong> pour la facture <strong>${data.invoiceNumber}</strong> du ${new Date(data.invoiceDate).toLocaleDateString('fr-FR')} a bien été enregistré.`
				: kind === 'remainder'
					? `Votre paiement du <strong>solde</strong> pour la facture <strong>${data.invoiceNumber}</strong> du ${new Date(data.invoiceDate).toLocaleDateString('fr-FR')} a bien été enregistré.`
					: `Nous confirmons la réception de votre paiement pour la facture <strong>${data.invoiceNumber}</strong> du ${new Date(data.invoiceDate).toLocaleDateString('fr-FR')}.`;

		let statusHtml: string;
		if (kind === 'deposit') {
			const solde =
				data.paidContext?.remainderAmount != null
					? this.formatCurrency(data.paidContext.remainderAmount)
					: null;
			const totalDevis =
				data.paidContext?.contractTotal != null
					? this.formatCurrency(data.paidContext.contractTotal)
					: null;
			statusHtml =
				emailParagraph(
					`Cette facture d&apos;acompte (<strong>${this.formatCurrency(data.total)}</strong>) est réglée.`,
				) +
				(totalDevis && solde
					? emailBanner(
							`<strong>Devis ${totalDevis}</strong> — solde restant : <strong>${solde}</strong><br>` +
								`<span style="color:#475569;">Le solde vous sera facturé séparément après réalisation / livraison.</span>`,
							'info',
						)
					: '');
		} else if (kind === 'remainder') {
			statusHtml = emailParagraph(
				`Facture de solde (<strong>${this.formatCurrency(data.total)}</strong>) réglée — votre devis est entièrement payé. Merci !`,
			);
		} else {
			statusHtml = emailParagraph(
				`Montant total de la facture : ${this.formatCurrency(data.total)} — <strong>facture réglée</strong>.`,
			);
		}

		const attachmentNote =
			(data.attachments?.length ?? 0) > 0
				? emailParagraph(
						`Pièces jointes : facture PDF${data.attachments!.length > 1 ? ' et contrat de prestation.' : '.'}`,
					)
				: '';

		return renderFacturioEmailLayout({
			title: `Paiement reçu — ${data.invoiceNumber}`,
			headline: 'Paiement reçu',
			headerVariant: 'success',
			contentHtml:
				emailParagraph(`Bonjour ${data.clientName},`) +
				emailParagraph(intro) +
				emailAmountHighlight(
					`Montant encaissé : ${this.formatCurrency(data.lastPaymentAmount)} (${data.paymentMethodLabel})`,
					'success',
				) +
				statusHtml +
				attachmentNote +
				viewBtn +
				emailParagraph(`Cordialement,<br><strong>${data.issuerName}</strong>`),
			footerHtml: `<p>${data.legalFooter}</p>`,
		});
	}

	private getInvoicePaidProviderTemplate(data: {
		clientName: string;
		invoiceNumber: string;
		total: number;
		lastPaymentAmount: number;
		paymentMethodLabel: string;
		appInvoiceUrl: string;
		legalFooter: string;
	}): string {
		return renderFacturioEmailLayout({
			title: `Facture payée — ${data.invoiceNumber}`,
			headline: 'Facture payée',
			headerVariant: 'success',
			contentHtml:
				emailParagraph('Bonjour,') +
				emailParagraph(
					`La facture <strong>${data.invoiceNumber}</strong> a été intégralement réglée par <strong>${data.clientName}</strong>.`,
				) +
				emailParagraph(
					`Encaissement : <strong>${this.formatCurrency(data.lastPaymentAmount)}</strong> (${data.paymentMethodLabel})`,
				) +
				emailParagraph(`Total facture : ${this.formatCurrency(data.total)}`) +
				emailButton(data.appInvoiceUrl, `Ouvrir la facture dans ${this.platformBrand}`, 'secondary'),
			footerHtml: `<p>${data.legalFooter}</p><p>Notification automatique ${this.platformBrand}.</p>`,
		});
	}

	/**
	 * Template HTML pour devis (style DanielCraftFr, pixel, boutons Accepter/Refuser, mentions légales).
	 */
	private getQuoteTemplate(data: {
		quoteNumber: string;
		quoteDate: Date | string;
		clientName: string;
		total: number;
		expiryDate?: Date | string;
		trackOpenUrl?: string;
		acceptUrl?: string;
		rejectUrl?: string;
		informativeCopy?: boolean;
		legalFooter: string;
	}): string {
		const dateStr = new Date(data.quoteDate).toLocaleDateString('fr-FR');
		const copyBanner = data.informativeCopy
			? emailBanner(
					'<strong>Copie à titre informatif</strong> — document envoyé au client. Aucun lien d’acceptation ou de paiement dans ce message.',
					'warning',
				)
			: '';
		const expiryText =
			!data.informativeCopy && data.expiryDate
				? emailBanner(
						`<strong>Valable jusqu'au ${new Date(data.expiryDate).toLocaleDateString('fr-FR')}</strong>`,
						'warning',
					)
				: '';

		const buttonRow =
			!data.informativeCopy && (data.acceptUrl || data.rejectUrl)
				? emailButtonRow([
						...(data.acceptUrl
							? [{ href: data.acceptUrl, label: 'Accepter le devis', variant: 'success' as const }]
							: []),
						...(data.rejectUrl
							? [{ href: data.rejectUrl, label: 'Refuser', variant: 'ghost' as const }]
							: []),
					])
				: '';

		const greeting = data.informativeCopy ? 'Bonjour,' : `Bonjour ${data.clientName},`;
		const intro = data.informativeCopy
			? `Copie du devis <strong>${data.quoteNumber}</strong> du ${dateStr} (client : ${data.clientName}).`
			: `Veuillez trouver ci-joint le devis <strong>${data.quoteNumber}</strong> du ${dateStr}.`;

		return renderFacturioEmailLayout({
			title: `Devis ${data.quoteNumber}`,
			headline: `Devis ${data.quoteNumber}`,
			headerVariant: 'quote',
			trackPixel: data.trackOpenUrl,
			contentHtml:
				copyBanner +
				emailParagraph(greeting) +
				emailParagraph(intro) +
				expiryText +
				emailAmountHighlight(`Montant total : ${this.formatCurrency(data.total)}`) +
				(data.informativeCopy ? '' : emailParagraph('Nous restons à votre disposition pour toute question.')) +
				buttonRow,
			footerHtml: `<p>${data.legalFooter}</p>`,
		});
	}

	/**
	 * Template HTML pour relance
	 */
	private getReminderTemplate(data: {
		invoiceNumber: string;
		invoiceDate: Date | string;
		clientName: string;
		amount: number;
		daysOverdue?: number;
		paymentUrl?: string;
		trackOpenUrl?: string;
		legalFooter: string;
	}): string {
		const overdueBanner = data.daysOverdue
			? emailBanner(
					`<strong>Cette facture est en retard de ${data.daysOverdue} jour(s).</strong>`,
					'warning',
				)
			: emailBanner('<strong>Cette facture est en attente de paiement.</strong>', 'info');
		const payBtn = data.paymentUrl
			? emailButton(data.paymentUrl, 'Voir la facture et payer en ligne', 'primary')
			: '';

		return renderFacturioEmailLayout({
			title: `Rappel — Facture ${data.invoiceNumber}`,
			headline: `Rappel — Facture ${data.invoiceNumber}`,
			headerVariant: 'warning',
			trackPixel: data.trackOpenUrl,
			contentHtml:
				emailParagraph(`Bonjour ${data.clientName},`) +
				emailParagraph(
					`Nous vous rappelons que la facture <strong>${data.invoiceNumber}</strong> du ${new Date(data.invoiceDate).toLocaleDateString('fr-FR')} est toujours en attente de paiement.`,
				) +
				overdueBanner +
				emailAmountHighlight(`Montant à régler : ${this.formatCurrency(data.amount)}`, 'teal') +
				emailParagraph('Merci de procéder au règlement dans les plus brefs délais.') +
				payBtn,
			footerHtml: `<p>${data.legalFooter}</p>`,
		});
	}

	/**
	 * Envoie l'email de vérification d'adresse (inscription).
	 * Utilise le template PrestaFacture avec lien de confirmation.
	 */
	/**
	 * Connexion depuis un nouvel appareil ou en parallèle — confirmation par email.
	 */
	async sendDeviceLoginEmail(options: {
		to: string;
		firstName?: string | null;
		verifyUrl: string;
		userAgent?: string | null;
	}): Promise<void> {
		const subject = `Confirmez cette connexion - ${this.platformBrand}`;
		const deviceHint = options.userAgent
			? emailParagraph(
					`<span style="font-size:13px;color:#64748b;">Appareil détecté : ${options.userAgent.slice(0, 120)}</span>`,
				)
			: '';
		const html = this.getBaseLayout({
			title: subject,
			headline: 'Confirmez cette connexion',
			content: `
				${emailParagraph(`Bonjour${options.firstName ? ` ${options.firstName}` : ''},`)}
				${emailParagraph(`Une connexion à votre compte ${this.platformBrand} a été détectée depuis un <strong>nouvel appareil</strong> ou pendant une session déjà active ailleurs.`)}
				${deviceHint}
				${emailParagraph('Si c\'était vous, confirmez cette connexion :')}
				${emailButton(options.verifyUrl, 'Confirmer cette connexion', 'primary')}
				${emailParagraph('<span style="font-size:13px;color:#64748b;">Ce lien expire dans 1 heure. Sinon, ignorez cet email et changez votre mot de passe si vous suspectez une intrusion.</span>')}
			`,
		});
		const text = `Bonjour${options.firstName ? ` ${options.firstName}` : ``},\n\nConfirmez cette connexion : ${options.verifyUrl}\n\nLien valide 1 heure.\n\nL'équipe ${this.platformBrand}`;
		await this.send({
			from: this.verifyFrom,
			to: options.to,
			subject,
			html,
			text,
		});
	}

	async sendVerifyEmail(options: {
		to: string;
		firstName?: string | null;
		verifyUrl: string;
		betaTester?: {
			planLabel: string;
			durationDays: number;
			expiresAt: string;
		} | null;
	}): Promise<void> {
		const subject = `Bienvenue sur ${this.platformBrand} — confirmez votre email`;
		const html = this.getSignupConfirmationTemplate({
			firstName: options.firstName,
			method: 'email',
			verifyUrl: options.verifyUrl,
			betaTester: options.betaTester,
		});
		const text = this.getSignupConfirmationText({
			firstName: options.firstName,
			method: 'email',
			verifyUrl: options.verifyUrl,
			betaTester: options.betaTester,
		});
		await this.send({
			from: this.verifyFrom,
			to: options.to,
			subject,
			html,
			text,
		});
	}

	/**
	 * Confirmation d'inscription via Google (email déjà vérifié côté Google).
	 */
	async sendGoogleSignupWelcome(options: {
		to: string;
		firstName?: string | null;
		installUrl: string;
		dashboardUrl: string;
		betaTester?: {
			planLabel: string;
			durationDays: number;
			expiresAt: string;
			inviteCode?: string | null;
		} | null;
	}): Promise<void> {
		const subject = options.betaTester
			? `Bienvenue sur ${this.platformBrand} — compte créé et beta activée`
			: `Bienvenue sur ${this.platformBrand} — votre compte est prêt`;
		const html = this.getSignupConfirmationTemplate({
			firstName: options.firstName,
			method: 'google',
			installUrl: options.installUrl,
			dashboardUrl: options.dashboardUrl,
			betaTester: options.betaTester,
		});
		const text = this.getSignupConfirmationText({
			firstName: options.firstName,
			method: 'google',
			installUrl: options.installUrl,
			dashboardUrl: options.dashboardUrl,
			betaTester: options.betaTester,
		});
		await this.send({
			from: this.verifyFrom,
			to: options.to,
			subject,
			html,
			text,
		});
	}

	/**
	 * Récapitulatif marketing après l'assistant d'installation (catalogue).
	 */
	async sendOnboardingRecap(options: {
		to: string;
		firstName?: string | null;
		productCount: number;
		productNames: string[];
		techLabels: string[];
		devProfileLabel?: string | null;
		productsUrl: string;
		createInvoiceUrl: string;
		dashboardUrl: string;
	}): Promise<void> {
		const subject = `Votre catalogue ${this.platformBrand} est prêt (${options.productCount} prestation${options.productCount > 1 ? `s` : ''})`;
		const html = this.getOnboardingRecapTemplate(options);
		const text = this.getOnboardingRecapText(options);
		await this.send({
			from: this.verifyFrom,
			to: options.to,
			subject,
			html,
			text,
		});
	}

	/**
	 * Envoie l'email de réinitialisation de mot de passe avec template soigné.
	 */
	async sendPasswordReset(options: {
		to: string;
		firstName?: string | null;
		resetUrl: string;
	}): Promise<void> {
		const subject = `Réinitialisation de votre mot de passe - ${this.platformBrand}`;
		const html = this.getPasswordResetTemplate({
			firstName: options.firstName,
			resetUrl: options.resetUrl,
		});
		const text = `Bonjour${options.firstName ? ` ${options.firstName}` : ``},\n\nVous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien ci-dessous (valide 1 heure) :\n${options.resetUrl}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet email.\n\nL'équipe ${this.platformBrand}`;
		await this.send({
			to: options.to,
			subject,
			html,
			text,
		});
	}

	/**
	 * Layout HTML commun (PrestaFacture) pour emails transactionnels.
	 */
	private getBaseLayout(data: {
		title: string;
		headline?: string;
		content: string;
		legalFooter?: string;
	}): string {
		return renderFacturioEmailLayout({
			title: data.title,
			headline: data.headline ?? data.title,
			headerVariant: 'default',
			contentHtml: data.content,
			footerHtml: `<p>${data.legalFooter ?? buildPlatformEmailLegalFooter()}</p>`,
		});
	}

	/**
	 * Template HTML inscription (email classique ou Google).
	 */
	private getSignupConfirmationTemplate(data: {
		firstName?: string | null;
		method: 'email' | 'google';
		verifyUrl?: string;
		installUrl?: string;
		dashboardUrl?: string;
		betaTester?: {
			planLabel: string;
			durationDays: number;
			expiresAt: string;
			inviteCode?: string | null;
		} | null;
	}): string {
		const greeting = data.firstName ? `Bonjour ${data.firstName},` : 'Bonjour,';
		const expiresFr = data.betaTester
			? new Date(data.betaTester.expiresAt).toLocaleDateString('fr-FR')
			: null;

		const betaBlock = data.betaTester
			? emailBanner(
					`<strong>Programme beta activé</strong> — ${data.betaTester.planLabel} pendant ${data.betaTester.durationDays} jours, jusqu'au <strong>${expiresFr}</strong>.` +
						(data.betaTester.inviteCode?.trim()
							? `<br>Code : <strong>${data.betaTester.inviteCode.trim()}</strong>`
							: ''),
					'success',
				)
			: '';

		const emailStep =
			data.method === 'email' && data.verifyUrl
				? emailParagraph(
						'<strong>Dernière étape :</strong> confirmez votre adresse email pour débloquer le tableau de bord.',
					) +
					emailButton(data.verifyUrl, 'Confirmer mon email', 'primary') +
					emailParagraph('Ce lien est valide <strong>24 heures</strong>.')
				: emailParagraph(
						`Votre adresse email est déjà validée via Google — vous pouvez utiliser ${this.platformBrand} tout de suite.`,
					);

		const nextSteps =
			emailParagraph(
				'<strong>Ensuite, en 3 minutes :</strong><br>' +
					'1. Installez votre catalogue de prestations (assistant développeur).<br>' +
					'2. Complétez votre profil émetteur (SIRET, coordonnées).<br>' +
					'3. Créez un devis test, puis votre première facture.',
			) +
			emailButtonRow([
				{
					href: data.installUrl ?? data.dashboardUrl ?? 'https://prestafacture.com/installation',
					label: 'Lancer l\'assistant',
					variant: 'success',
				},
				{
					href: data.dashboardUrl ?? 'https://prestafacture.com/dashboard',
					label: 'Tableau de bord',
					variant: 'secondary',
				},
			]);

		const betaEfactureNote = data.betaTester
			? emailParagraph(
					'<em>En beta : score conformité et export Factur-X (XML) disponibles — connecteur Plateforme Agréée pas encore activé dans l\'app.</em>',
				)
			: '';

		const content =
			emailParagraph(greeting) +
			emailParagraph(
				`Bienvenue sur <strong>${this.platformBrand}</strong> — devis, factures et pré-compta pensés pour les freelances dev et les micro-agences web.`,
			) +
			betaBlock +
			betaEfactureNote +
			emailStep +
			nextSteps +
			emailParagraph(
				'Besoin d\'aide ? Répondez à cet email ou consultez la doc depuis l\'app. On est une petite équipe, on lit vraiment les retours.',
			) +
			emailParagraph(`À très vite,<br><strong>L'équipe ${this.platformBrand}</strong>`);

		return this.getBaseLayout({
			title: `Bienvenue sur ${this.platformBrand}`,
			headline: data.method === 'google' ? 'Compte créé avec Google' : 'Confirmez votre inscription',
			content,
		});
	}

	private getSignupConfirmationText(data: {
		firstName?: string | null;
		method: 'email' | 'google';
		verifyUrl?: string;
		installUrl?: string;
		dashboardUrl?: string;
		betaTester?: {
			planLabel: string;
			durationDays: number;
			expiresAt: string;
			inviteCode?: string | null;
		} | null;
	}): string {
		const greeting = data.firstName ? `Bonjour ${data.firstName},` : 'Bonjour,';
		const lines = [
			greeting,
			'',
			`Bienvenue sur ${this.platformBrand} — devis, factures et pré-compta pour freelances dev.`,
		];
		if (data.betaTester) {
			const expiresFr = new Date(data.betaTester.expiresAt).toLocaleDateString('fr-FR');
			lines.push(
				'',
				`Beta activée : ${data.betaTester.planLabel} — ${data.betaTester.durationDays} jours jusqu'au ${expiresFr}.`,
				'Score conformité et export Factur-X (XML) disponibles — connecteur PA pas encore activé.',
			);
			if (data.betaTester.inviteCode?.trim()) {
				lines.push(`Code : ${data.betaTester.inviteCode.trim()}`);
			}
		}
		if (data.method === 'email' && data.verifyUrl) {
			lines.push('', `Confirmez votre email : ${data.verifyUrl}`, '(valide 24 h)');
		} else {
			lines.push('', 'Email validé via Google.');
		}
		if (data.installUrl) lines.push(`Assistant installation : ${data.installUrl}`);
		if (data.dashboardUrl) lines.push(`Tableau de bord : ${data.dashboardUrl}`);
		lines.push('', `L'équipe ${this.platformBrand}`);
		return lines.join('\n');
	}

	private getOnboardingRecapTemplate(data: {
		firstName?: string | null;
		productCount: number;
		productNames: string[];
		techLabels: string[];
		devProfileLabel?: string | null;
		productsUrl: string;
		createInvoiceUrl: string;
		dashboardUrl: string;
	}): string {
		const greeting = data.firstName ? `Bonjour ${data.firstName},` : 'Bonjour,';
		const profileLine = data.devProfileLabel
			? emailParagraph(`Profil : <strong>${data.devProfileLabel}</strong>`)
			: '';
		const techLine =
			data.techLabels.length > 0
				? emailParagraph(
						`Stack sélectionnée : <strong>${data.techLabels.slice(0, 8).join(', ')}</strong>${data.techLabels.length > 8 ? '…' : ''}`,
					)
				: '';

		const listItems = data.productNames
			.slice(0, 10)
			.map((name) => `<li style="margin:0 0 6px">${name}</li>`)
			.join('');
		const more =
			data.productNames.length > 10
				? emailParagraph(
						`<em>… et ${data.productNames.length - 10} autre(s) prestation(s) dans votre catalogue.</em>`,
					)
				: '';

		const content =
			emailParagraph(greeting) +
			emailParagraph(
				`C'est fait : votre <strong>catalogue ${this.platformBrand}</strong> est installé avec <strong>${data.productCount} prestation${data.productCount > 1 ? 's' : ''}</strong> prêtes à facturer.`,
			) +
			emailBanner('Tarifs modifiables à tout moment — ce sont des bases, pas des engagements.', 'info') +
			profileLine +
			techLine +
			(data.productNames.length > 0
				? emailParagraph('<strong>Aperçu de votre catalogue :</strong>') +
					`<ul style="padding-left:20px;margin:8px 0 16px">${listItems}</ul>` +
					more
				: '') +
			emailParagraph(
				'<strong>Prochaines étapes :</strong><br>' +
					'• Ajustez les prix dans Produits si besoin<br>' +
					'• Créez un devis pour un client test<br>' +
					'• Transformez-le en facture et exportez le PDF',
			) +
			emailButtonRow([
				{ href: data.createInvoiceUrl, label: 'Créer une facture', variant: 'success' },
				{ href: data.productsUrl, label: 'Voir mon catalogue', variant: 'primary' },
				{ href: data.dashboardUrl, label: 'Tableau de bord', variant: 'secondary' },
			]) +
			emailParagraph(
				'Vous facturez au forfait ? Testez l\'acompte 10 % et le paiement en plusieurs fois sur une facture.',
			) +
			emailParagraph(`Bonne facturation,<br><strong>L'équipe ${this.platformBrand}</strong>`);

		return this.getBaseLayout({
			title: 'Catalogue installé',
			headline: 'Votre espace est prêt',
			content,
		});
	}

	private getOnboardingRecapText(data: {
		firstName?: string | null;
		productCount: number;
		productNames: string[];
		techLabels: string[];
		devProfileLabel?: string | null;
		productsUrl: string;
		createInvoiceUrl: string;
		dashboardUrl: string;
	}): string {
		const greeting = data.firstName ? `Bonjour ${data.firstName},` : 'Bonjour,';
		const lines = [
			greeting,
			'',
			`Votre catalogue ${this.platformBrand} est prêt : ${data.productCount} prestation(s).`,
		];
		if (data.devProfileLabel) lines.push(`Profil : ${data.devProfileLabel}`);
		if (data.techLabels.length) lines.push(`Stack : ${data.techLabels.join(', ')}`);
		if (data.productNames.length) {
			lines.push('', 'Prestations :');
			for (const name of data.productNames.slice(0, 12)) {
				lines.push(`- ${name}`);
			}
		}
		lines.push(
			'',
			`Catalogue : ${data.productsUrl}`,
			`Nouvelle facture : ${data.createInvoiceUrl}`,
			`Dashboard : ${data.dashboardUrl}`,
			'',
			`L'équipe ${this.platformBrand}`,
		);
		return lines.join('\n');
	}

	/**
	 * @deprecated Utiliser getSignupConfirmationTemplate — conservé pour preview-emails.
	 */
	private getVerifyEmailTemplate(data: { firstName?: string | null; verifyUrl: string }): string {
		return this.getSignupConfirmationTemplate({
			firstName: data.firstName,
			method: 'email',
			verifyUrl: data.verifyUrl,
		});
	}

	/**
	 * Template HTML pour réinitialisation du mot de passe.
	 */
	private getPasswordResetTemplate(data: { firstName?: string | null; resetUrl: string }): string {
		const greeting = data.firstName ? `Bonjour ${data.firstName},` : 'Bonjour,';
		const content =
			emailParagraph(greeting) +
			emailParagraph(
				`Vous avez demandé la réinitialisation de votre mot de passe ${this.platformBrand}. Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe.`,
			) +
			emailButton(data.resetUrl, 'Réinitialiser mon mot de passe', 'primary') +
			emailParagraph(
				'Ce lien est valide <strong>1 heure</strong>. Si vous n\'êtes pas à l\'origine de cette demande, ignorez cet email en toute sécurité.',
			) +
			emailParagraph(`Cordialement,<br><strong>L'équipe ${this.platformBrand}</strong>`);
		return this.getBaseLayout({
			title: 'Réinitialisation de votre mot de passe',
			headline: 'Réinitialisation de votre mot de passe',
			content,
		});
	}

	/** Abonnement PrestaFacture activé (checkout réussi). */
	async sendSubscriptionActivated(options: {
		to: string;
		firstName?: string | null;
		planLabel: string;
		settingsUrl: string;
	}): Promise<void> {
		const greeting = options.firstName ? `Bonjour ${options.firstName},` : 'Bonjour,';
		const content =
			emailParagraph(greeting) +
			emailParagraph(
				`Votre abonnement <strong>${options.planLabel}</strong> est maintenant actif sur ${this.platformBrand}.`,
			) +
			emailParagraph('Vous pouvez gérer votre facturation et consulter vos quotas depuis les paramètres.') +
			emailButton(options.settingsUrl, 'Voir mon abonnement', 'success') +
			emailParagraph(`Merci pour votre confiance,<br><strong>L'équipe ${this.platformBrand}</strong>`);
		const html = this.getBaseLayout({
			title: 'Abonnement activé',
			headline: 'Abonnement activé',
			content,
		});
		await this.send({
			from: this.subscriptionFrom,
			to: options.to,
			subject: `Abonnement ${options.planLabel} activé — ${this.platformBrand}`,
			html,
			text: `Votre abonnement ${options.planLabel} est actif. Paramètres : ${options.settingsUrl}`,
		});
	}

	/** Facture d'abonnement PrestaFacture (même modèle visuel que les factures clients). */
	async sendSubscriptionInvoice(options: {
		to: string;
		firstName?: string | null;
		clientName: string;
		invoiceNumber: string;
		invoiceDate: Date | string;
		amountEur: number;
		pdfBuffer: Buffer;
		hostedInvoiceUrl?: string | null;
	}): Promise<void> {
		const company = resolveEmailIssuerDisplayName(null);
		const subject = `Facture ${options.invoiceNumber} — ${company}`;
		const legalFooter = buildPlatformEmailLegalFooter();
		const html = this.getInvoiceTemplate({
			invoiceNumber: options.invoiceNumber,
			invoiceDate: options.invoiceDate,
			clientName: options.clientName,
			total: options.amountEur,
			paymentUrl: options.hostedInvoiceUrl ?? undefined,
			legalFooter,
		});
		const paymentLine = options.hostedInvoiceUrl
			? `\n\nConsulter en ligne : ${options.hostedInvoiceUrl}\n`
			: '';
		await this.send({
			from: this.subscriptionFrom,
			to: options.to,
			subject,
			html,
			text:
				`Bonjour ${options.clientName},\n\n` +
				`Veuillez trouver ci-joint la facture ${options.invoiceNumber} ` +
				`du ${new Date(options.invoiceDate).toLocaleDateString('fr-FR')} ` +
				`pour votre abonnement ${this.platformBrand} (${this.formatCurrency(options.amountEur)}).${paymentLine}\n` +
				`Cordialement,\n${company}`,
			attachments: [
				{
					filename: `facture-${options.invoiceNumber.replace(/\s+/g, '-')}.pdf`,
					content: options.pdfBuffer,
					contentType: 'application/pdf',
				},
			],
		});
	}

	/** Échec de paiement récurrent (carte refusée, etc.). */
	async sendSubscriptionPaymentFailed(options: {
		to: string;
		firstName?: string | null;
		manageUrl: string;
	}): Promise<void> {
		const greeting = options.firstName ? `Bonjour ${options.firstName},` : 'Bonjour,';
		const content =
			emailParagraph(greeting) +
			emailParagraph(`Le renouvellement de votre abonnement ${this.platformBrand} n'a pas pu être débité.`) +
			emailParagraph('Mettez à jour votre moyen de paiement pour éviter une interruption de service.') +
			emailButton(options.manageUrl, 'Mettre à jour le paiement', 'primary') +
			emailParagraph('Si vous avez des questions, répondez à cet email ou contactez le support.');
		const html = this.getBaseLayout({
			title: 'Paiement abonnement échoué',
			headline: 'Paiement abonnement échoué',
			content,
		});
		await this.send({
			from: this.subscriptionFrom,
			to: options.to,
			subject: `Action requise — paiement abonnement ${this.platformBrand}`,
			html,
			text: `Échec de paiement. Gérez votre abonnement : ${options.manageUrl}`,
		});
	}

	/** Abonnement résilié ou expiré. */
	async sendSubscriptionCanceled(options: {
		to: string;
		firstName?: string | null;
		planLabel: string;
	}): Promise<void> {
		const greeting = options.firstName ? `Bonjour ${options.firstName},` : 'Bonjour,';
		const content =
			emailParagraph(greeting) +
			emailParagraph(
				`Votre abonnement <strong>${options.planLabel}</strong> a été résilié. Votre compte est repassé sur le plan gratuit.`,
			) +
			emailParagraph(
				'Vos données restent accessibles ; les quotas du plan Free s\'appliquent à nouveau.',
			) +
			emailParagraph(`Vous pouvez vous réabonner à tout moment depuis ${this.platformBrand}.`);
		const html = this.getBaseLayout({
			title: 'Abonnement terminé',
			headline: 'Abonnement terminé',
			content,
		});
		await this.send({
			from: this.subscriptionFrom,
			to: options.to,
			subject: `Votre abonnement ${this.platformBrand} a pris fin`,
			html,
			text: `Abonnement ${options.planLabel} terminé. Compte repassé sur le plan gratuit.`,
		});
	}

	/**
	 * Email de bienvenue après activation du programme beta testeurs.
	 * Personnalise prénom, plan, date de fin et lien questionnaire.
	 */
	async sendBetaTrialReminder(options: {
		to: string;
		firstName?: string | null;
		phase: '60d' | '30d' | '7d';
		planLabel: string;
		expiresAt: Date | string;
		daysRemaining: number;
		billingUrl: string;
		dashboardUrl: string;
	}): Promise<void> {
		const expiresFr = new Date(options.expiresAt).toLocaleDateString('fr-FR');
		const greeting = options.firstName ? `Bonjour ${options.firstName},` : 'Bonjour,';

		const phaseCopy =
			options.phase === '60d'
				? {
						headline: 'Il vous reste environ 2 mois d\'essai beta',
						intro:
							'Votre accès complet au plan Agence continue — testez compta, API, score conformité et export Factur-X (XML). Le connecteur Plateforme Agréée n\'est pas encore activé dans l\'app.',
					}
				: options.phase === '30d'
					? {
							headline: 'Plus qu\'un mois d\'essai beta',
							intro:
								'Votre période beta se rapproche de la fin. Notez ce qui vous manquerait en repassant au plan Free, et dites-nous ce qu\'on peut améliorer.',
						}
					: {
							headline: 'Fin de beta dans 7 jours',
							intro:
								'Dans une semaine, votre compte repassera sur le plan Free (quotas mensuels). Passez Pro si vous voulez conserver l\'accès complet sans coupure.',
						};

		const content =
			emailParagraph(greeting) +
			emailParagraph(phaseCopy.intro) +
			emailBanner(
				`<strong>${options.planLabel}</strong> — encore <strong>${options.daysRemaining} jour(s)</strong>, jusqu'au <strong>${expiresFr}</strong>.`,
				options.phase === '7d' ? 'warning' : 'info',
			) +
			emailParagraph(
				'<strong>Idées de tests avant la fin :</strong><br>' +
					'• Export FEC et balance<br>' +
					'• Créances / dettes fournisseurs<br>' +
					'• Score conformité + export Factur-X (XML) sur une facture B2B',
			) +
			emailParagraph(
				'<em>Rappel : aucune transmission Plateforme Agréée dans l\'app — connecteur PA et e-reporting en développement.</em>',
			) +
			emailButtonRow([
				{ href: options.dashboardUrl, label: `Ouvrir ${this.platformBrand}`, variant: 'primary' },
				{ href: options.billingUrl, label: 'Voir les offres Pro', variant: 'secondary' },
			]) +
			emailParagraph(`Merci de tester avec nous,<br><strong>Valentine Coubertain</strong><br>${this.platformBrand}`);

		const subject =
			options.phase === '60d'
				? `Beta ${this.platformBrand} — il vous reste environ 2 mois`
				: options.phase === '30d'
					? `Beta ${this.platformBrand} — plus qu'un mois d'essai`
					: `Beta ${this.platformBrand} — fin dans 7 jours`;

		await this.send({
			from: this.verifyFrom,
			to: options.to,
			subject,
			html: this.getBaseLayout({
				title: phaseCopy.headline,
				headline: phaseCopy.headline,
				content,
			}),
			text: `${greeting}\n\n${phaseCopy.intro}\n\n${options.planLabel} — ${options.daysRemaining} jours restants (jusqu'au ${expiresFr}).\n\n${options.billingUrl}\n`,
		});
	}

	/**
	 * Email fin de période beta (retour plan Free).
	 */
	async sendBetaTrialExpired(options: {
		to: string;
		firstName?: string | null;
		billingUrl: string;
		quotasUrl: string;
	}): Promise<void> {
		const greeting = options.firstName ? `Bonjour ${options.firstName},` : 'Bonjour,';
		const content =
			emailParagraph(greeting) +
			emailParagraph(
				`Votre <strong>période beta de 3 mois</strong> est terminée. Merci d'avoir testé ${this.platformBrand} en conditions réelles — vos retours comptent vraiment.`,
			) +
			emailBanner(
				'Retour au <strong>plan Free</strong> : quotas mensuels (factures, devis, emails), pas de compta FEC ni API publique.',
				'warning',
			) +
			emailParagraph(
				'Pour continuer sans limites : compta, finance, API et PDF sans filigrane — passez au <strong>plan Pro</strong> quand vous le souhaitez.',
			) +
			emailButtonRow([
				{ href: options.billingUrl, label: 'Passer Pro', variant: 'success' },
				{ href: options.quotasUrl, label: 'Voir les quotas Free', variant: 'secondary' },
			]) +
			emailParagraph(`À bientôt,<br><strong>L'équipe ${this.platformBrand}</strong>`);

		await this.send({
			from: this.verifyFrom,
			to: options.to,
			subject: `Votre essai beta ${this.platformBrand} est terminé`,
			html: this.getBaseLayout({
				title: 'Fin de période beta',
				headline: 'Merci pour votre participation beta',
				content,
			}),
			text: `${greeting}\n\nVotre essai beta est terminé. Plan Free actif.\n\nPro : ${options.billingUrl}\nQuotas : ${options.quotasUrl}\n`,
		});
	}

	/**
	 * Email quota mensuel Free atteint (100 %).
	 */
	async sendFreeQuotaReached(options: {
		to: string;
		firstName?: string | null;
		kind: 'invoices' | 'quotes' | 'emails';
		used: number;
		max: number;
		quotasUrl: string;
		billingUrl: string;
	}): Promise<void> {
		const labels = {
			invoices: 'factures',
			quotes: 'devis',
			emails: 'emails document',
		} as const;
		const label = labels[options.kind];
		const greeting = options.firstName ? `Bonjour ${options.firstName},` : 'Bonjour,';
		const content =
			emailParagraph(greeting) +
			emailParagraph(
				`Vous avez atteint le quota mensuel de <strong>${label}</strong> sur le plan Free (${options.used}/${options.max} ce mois-ci).`,
			) +
			emailParagraph(
				'Le compteur est remis à zéro le <strong>1er du mois prochain</strong>. En attendant, la création ou l\'envoi correspondant est bloqué.',
			) +
			emailButtonRow([
				{ href: options.billingUrl, label: 'Passer Pro (illimité)', variant: 'primary' },
				{ href: options.quotasUrl, label: 'Détail des quotas', variant: 'secondary' },
			]) +
			emailParagraph(`L'équipe ${this.platformBrand}`);

		await this.send({
			from: this.verifyFrom,
			to: options.to,
			subject: `Quota Free atteint — ${label}`,
			html: this.getBaseLayout({
				title: 'Quota mensuel atteint',
				headline: `Quota ${label} atteint`,
				content,
			}),
			text: `${greeting}\n\nQuota ${label} : ${options.used}/${options.max}.\n\nPro : ${options.billingUrl}\n`,
		});
	}

	/**
	 * Email de bienvenue après activation du programme beta testeurs.
	 * Personnalise prénom, plan, date de fin et lien questionnaire.
	 */
	async sendBetaTesterWelcome(options: {
		to: string;
		firstName?: string | null;
		planLabel: string;
		durationDays: number;
		expiresAt: Date | string;
		inviteCode?: string | null;
		surveyUrl?: string | null;
		appUrl: string;
		settingsUrl: string;
		replyTo?: string | null;
	}): Promise<void> {
		const expiresFr = new Date(options.expiresAt).toLocaleDateString('fr-FR');
		const greeting = options.firstName ? `Bonjour ${options.firstName},` : 'Bonjour,';
		const codeLine = options.inviteCode?.trim()
			? emailParagraph(
					`Code campagne activé : <strong>${options.inviteCode.trim()}</strong>.`,
				)
			: '';

		const surveyBtn = options.surveyUrl
			? emailButton(options.surveyUrl, 'Répondre au questionnaire (5–8 min)', 'primary')
			: '';

		const surveyText = options.surveyUrl
			? `\n\nQuestionnaire beta : ${options.surveyUrl}\n`
			: '';

		const content =
			emailParagraph(greeting) +
			emailParagraph(
				`Merci d'avoir activé le programme <strong>beta testeurs</strong> sur ${this.platformBrand}.`,
			) +
			codeLine +
			emailBanner(
				`<strong>${options.planLabel}</strong> — accès complet pendant ${options.durationDays} jours, jusqu'au <strong>${expiresFr}</strong>.`,
				'success',
			) +
			emailParagraph(
				'Vous pouvez tester en conditions réelles : devis, factures, PDF, paiements Stripe, acomptes, échéancier, exports compta (FEC), score de conformité, export Factur-X (XML).',
			) +
			emailParagraph(
				'<strong>Pas encore activé dans l\'app</strong> : connecteur Plateforme Agréée (aucun envoi PA), e-reporting automatisé, sync bancaire. Votre retour aide à prioriser la suite.',
			) +
			emailParagraph(
				'<strong>Pour démarrer :</strong><br>' +
					'1. Complétez votre profil émetteur (SIRET, coordonnées).<br>' +
					'2. Créez un devis test, puis une facture.<br>' +
					'3. Si vous facturez au forfait : testez l\'acompte 10 % et le paiement en plusieurs fois.',
			) +
			emailButtonRow([
				{ href: options.appUrl, label: `Ouvrir ${this.platformBrand}`, variant: 'success' },
				{ href: options.settingsUrl, label: 'Mon profil émetteur', variant: 'secondary' },
			]) +
			(options.surveyUrl
				? emailParagraph(
						'Un retour structuré nous aide beaucoup — vous pouvez aussi répondre directement à cet email.',
					) + surveyBtn
				: emailParagraph(
						'Votre retour nous aide — répondez directement à cet email (bug, idée, écran confus).',
					)) +
			emailParagraph(`Merci encore,<br><strong>Valentine Coubertain</strong><br>${this.platformBrand}`);

		const html = this.getBaseLayout({
			title: `Bienvenue dans la beta ${this.platformBrand}`,
			headline: 'Bienvenue dans la beta',
			content,
		});

		const text =
			`${greeting}\n\n` +
			`Merci d'avoir activé le programme beta testeurs sur ${this.platformBrand}.\n\n` +
			`${options.planLabel} — accès complet ${options.durationDays} jours, jusqu'au ${expiresFr}.\n` +
			(options.inviteCode?.trim() ? `Code : ${options.inviteCode.trim()}\n` : '') +
			'\nDisponible : score conformité, export Factur-X (XML). Pas encore activé : connecteur PA, e-reporting, sync bancaire.\n' +
			`\nOuvrir ${this.platformBrand} : ${options.appUrl}\n` +
			`Profil émetteur : ${options.settingsUrl}` +
			surveyText +
			`\nMerci,\nValentine Coubertain\nFacturio`;

		await this.send({
			from: this.verifyFrom,
			to: options.to,
			replyTo: options.replyTo ?? undefined,
			subject: `Bienvenue dans la beta ${this.platformBrand} (3 mois offerts)`,
			html,
			text,
		});
	}

	/**
	 * Formate un montant en devise
	 */
	private formatCurrency(amount: number): string {
		return new Intl.NumberFormat('fr-FR', {
			style: 'currency',
			currency: 'EUR'
		}).format(amount);
	}
}
