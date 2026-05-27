import { formatPdfCurrency } from './pdf-currency.util';
import { PDF_LAYOUT, PDF_THEME } from './pdf-theme';
import { resolveCompanyInfo } from './pdf-document.builder';
import type { EngagementBreakdown } from '../../invoices/invoice-deposit.util';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PdfDoc = any;

export type EngagementContractPdfInput = {
	quote: {
		number: string;
		createdAt: Date | string;
		expiryDate?: Date | string | null;
		acceptedAt?: Date | string | null;
		lines: { description: string; quantity: unknown; unitPrice: unknown; taxRate?: unknown }[];
		subtotal: unknown;
		tax: unknown;
		total: unknown;
	};
	client: {
		name?: string | null;
		companyName?: string | null;
		email?: string | null;
		address?: string | null;
		siret?: string | null;
		vatNumber?: string | null;
		isCompany?: boolean | null;
	};
	organization?: unknown;
	breakdown: EngagementBreakdown;
	dueDateFr?: string | null;
};

function fmtCurrency(amount: number): string {
	return formatPdfCurrency(amount);
}

function fmtDate(value?: Date | string | null): string {
	if (!value) return '—';
	return new Date(value).toLocaleDateString('fr-FR');
}

function clientLabel(client: EngagementContractPdfInput['client']): string {
	return client.name || client.companyName || 'Client';
}

/**
 * Génère un contrat d'engagement de prestation de services (acompte + solde),
 * distinct du devis : texte contractuel structuré en articles.
 */
export class EngagementContractPdfBuilder {
	build(doc: PdfDoc, input: EngagementContractPdfInput): void {
		const company = resolveCompanyInfo(input.organization);
		const { marginX, contentWidth } = PDF_LAYOUT;
		const bottom = doc.page.height - (doc.page.margins?.bottom ?? 50);
		const quoteDate = fmtDate(input.quote.acceptedAt ?? input.quote.createdAt);
		const due = input.dueDateFr ?? fmtDate(input.quote.expiryDate);
		const { breakdown } = input;
		const isConsumer = input.client.isCompany !== true;
		const depositRatePct = breakdown.contractTotal > 0
			? Math.round((breakdown.depositAmount / breakdown.contractTotal) * 100)
			: 10;

		const ensureSpace = (needed = 60) => {
			if (doc.y + needed > bottom) {
				doc.addPage();
				doc.y = marginX;
			}
		};

		const section = (title: string, body: string) => {
			ensureSpace(80);
			doc.font('Helvetica-Bold').fontSize(11).fillColor(PDF_THEME.navy).text(title, marginX, doc.y, {
				width: contentWidth,
			});
			doc.moveDown(0.4);
			doc.font('Helvetica').fontSize(9.5).fillColor(PDF_THEME.textDark).text(body, marginX, doc.y, {
				width: contentWidth,
				align: 'justify',
				lineGap: 3,
			});
			doc.moveDown(1);
		};

		const bulletList = (title: string, items: string[]) => {
			ensureSpace(60);
			doc.font('Helvetica-Bold').fontSize(11).fillColor(PDF_THEME.navy).text(title, marginX, doc.y, {
				width: contentWidth,
			});
			doc.moveDown(0.4);
			doc.font('Helvetica').fontSize(9.5).fillColor(PDF_THEME.textDark);
			for (const item of items) {
				ensureSpace(24);
				doc.text(`• ${item}`, marginX + 8, doc.y, { width: contentWidth - 8, lineGap: 2 });
			}
			doc.moveDown(0.8);
		};

		// En-tête
		doc.font('Helvetica-Bold').fontSize(16).fillColor(PDF_THEME.navy).text(
			"CONTRAT D'ENGAGEMENT DE PRESTATION DE SERVICES",
			marginX,
			marginX,
			{ width: contentWidth, align: 'center' },
		);
		doc.moveDown(0.3);
		doc.font('Helvetica').fontSize(10).fillColor(PDF_THEME.textMuted).text(
			`Référence devis n° ${input.quote.number} — Contrat n° CONTRAT-${input.quote.number}`,
			marginX,
			doc.y,
			{ width: contentWidth, align: 'center' },
		);
		doc.moveDown(1.2);

		section(
			'ENTRE LES SOUSSIGNÉS',
			`Le Prestataire :\n${company.name}${company.legalForm ? `, ${company.legalForm}` : ''}\n` +
				`${company.address || ''}\n` +
				`${company.siret ? `SIRET : ${company.siret}` : ''}${company.vat ? ` — TVA : ${company.vat}` : ''}\n` +
				`${company.email ? `Email : ${company.email}` : ''}\n\n` +
				`Et le Client :\n${clientLabel(input.client)}\n` +
				`${input.client.address || ''}\n` +
				`${input.client.siret ? `SIRET : ${input.client.siret}` : ''}` +
				`${input.client.vatNumber ? ` — TVA : ${input.client.vatNumber}` : ''}\n` +
				`${input.client.email ? `Email : ${input.client.email}` : ''}\n\n` +
				`Ci-après dénommés ensemble « les Parties ».`,
		);

		section(
			'ARTICLE 1 — OBJET',
			`Le présent contrat a pour objet la réalisation, par le Prestataire au profit du Client, des prestations décrites au devis n° ${input.quote.number} accepté par le Client. ` +
				`Le devis et ses annexes éventuelles constituent la description détaillée des livrables, du périmètre et des conditions d'exécution. En cas de contradiction, le présent contrat prévaut sur toute communication antérieure non signée.`,
		);

		section(
			'ARTICLE 2 — DESCRIPTION DES PRESTATIONS',
			`Les prestations comprennent notamment les éléments suivants (liste non exhaustive, renvoi au devis) :\n` +
				input.quote.lines
					.map(
						(l, i) =>
							`${i + 1}. ${l.description} — quantité : ${Number(l.quantity)}, prix unitaire HT : ${fmtCurrency(Number(l.unitPrice))}`,
					)
					.join('\n') +
				`\n\nLe Prestataire exécute la mission en obligation de moyens, conformément aux règles de l'art et aux standards professionnels du secteur.`,
		);

		section(
			'ARTICLE 3 — PRIX ET MODALITÉS DE PAIEMENT',
			`Le montant total des prestations, toutes taxes comprises (TTC), est fixé à ${fmtCurrency(breakdown.contractTotal)}.\n\n` +
				`Modalités convenues :\n` +
				`• Acompte à la commande : ${depositRatePct} % soit ${fmtCurrency(breakdown.depositAmount)} TTC, payable à l'acceptation du devis et avant le démarrage effectif de la mission${due !== '—' ? `, au plus tard le ${due}` : ''} ;\n` +
				`• Solde : ${fmtCurrency(breakdown.remainderAmount)} TTC, payable à la livraison / réalisation des prestations, sur présentation de la facture de solde.\n\n` +
				`Les sommes sont payables par virement bancaire ou, le cas échéant, par carte bancaire via la plateforme de paiement sécurisée proposée par le Prestataire. ` +
				`Conformément à l'article 289 du Code général des impôts, une facture d'acompte est émise lors du versement de l'acompte et une facture de solde lors du règlement final.`,
		);

		section(
			'ARTICLE 4 — ENGAGEMENT DES PARTIES',
			`Le versement de l'acompte vaut confirmation ferme de la commande et engagement réciproque des Parties à exécuter le contrat dans les conditions définies au devis et au présent document. ` +
				`Le Client reconnaît avoir pris connaissance du devis et en accepter le contenu. Le Prestataire s'engage à démarrer la mission après encaissement de l'acompte, sauf accord écrit contraire.`,
		);

		bulletList('ARTICLE 5 — OBLIGATIONS DU PRESTATAIRE', [
			"Exécuter les prestations avec diligence et conformément au devis accepté ;",
			"Informer le Client de toute difficulté susceptible d'affecter les délais ou le périmètre ;",
			"Respecter la confidentialité des informations communiquées par le Client ;",
			"Émettre les factures conformes à la réglementation fiscale en vigueur.",
		]);

		bulletList('ARTICLE 6 — OBLIGATIONS DU CLIENT', [
			"Fournir au Prestataire, en temps utile, les informations, accès et éléments nécessaires à la bonne exécution de la mission ;",
			"Régler l'acompte puis le solde aux échéances convenues ;",
			"Valider ou formuler des réserves motivées lors de la réception des livrables dans un délai raisonnable.",
		]);

		section(
			'ARTICLE 7 — DÉLAIS ET LIVRAISON',
			`Les délais indicatifs figurent sur le devis n° ${input.quote.number}. Ils courent à compter de la réception de l'acompte et de la transmission par le Client des éléments indispensables à la réalisation. ` +
				`Tout retard imputable au Client ou à un tiers suspend les délais d'exécution à due concurrence.`,
		);

		section(
			'ARTICLE 8 — RÉCEPTION',
			`À l'achèvement des prestations, le Client procède à la réception des livrables. À défaut de réserves écrites motivées dans un délai de quinze (15) jours à compter de la mise à disposition, les prestations sont réputées acceptées sans réserve.`,
		);

		section(
			'ARTICLE 9 — PROPRIÉTÉ INTELLECTUELLE',
			`Sous réserve du paiement intégral du prix (acompte et solde), le Prestataire cède au Client les droits patrimoniaux nécessaires à l'exploitation des livrables spécifiquement créés pour sa mission, pour le territoire et la durée convenus au devis. ` +
				`Les outils, méthodes, savoir-faire et éléments préexistants du Prestataire demeurent sa propriété exclusive.`,
		);

		section(
			'ARTICLE 10 — CONFIDENTIALITÉ',
			`Chaque Partie s'engage à ne pas divulguer les informations confidentielles reçues de l'autre Partie dans le cadre du contrat, sauf obligation légale ou accord écrit préalable. Cette obligation subsiste pendant la durée du contrat et cinq (5) ans après son terme.`,
		);

		section(
			'ARTICLE 11 — ANNULATION PAR LE CLIENT',
			`Le Client peut demander l'annulation de la commande par écrit (email ou courrier recommandé). ` +
				`Si l'annulation intervient avant tout démarrage effectif de la mission et avant expiration du délai de rétractation le cas échéant, ` +
				`le Prestataire remboursera l'acompte versé, déduction faite des frais de dossier et des sommes correspondant aux prestations déjà engagées ou réalisées. ` +
				`Si la mission a déjà débuté avec l'accord du Client, l'acompte reste acquis au titre des engagements pris et des ressources mobilisées ; ` +
				`seules les sommes correspondant aux prestations non encore exécutées pourront faire l'objet d'un remboursement ou d'une facturation au prorata.`,
		);

		section(
			'ARTICLE 12 — REMBOURSEMENT',
			`Tout remboursement dû au Client sera effectué dans un délai maximal de quatorze (14) jours à compter de la date de réception de la demande justifiée, ` +
				`par le même moyen de paiement que celui utilisé lors de la transaction initiale, sauf accord exprès des Parties sur un autre mode de remboursement. ` +
				`Les remboursements partiels correspondent au montant des prestations non réalisées ou non consommées. ` +
				`Aucun remboursement ne sera dû pour des prestations livrées et acceptées sans réserve dans les conditions de l'article 8.`,
		);

		if (isConsumer) {
			section(
				'ARTICLE 13 — DÉLAI DE RÉTRACTATION (CLIENT CONSOMMATEUR)',
				`Conformément aux articles L221-18 et suivants du Code de la consommation, le Client consommateur dispose d'un délai de quatorze (14) jours à compter de l'acceptation du présent contrat pour exercer son droit de rétractation, sans avoir à motiver sa décision. ` +
					`Pour exercer ce droit, le Client adresse au Prestataire une déclaration de rétractation claire et non équivoque (courrier ou email). ` +
					`En cas de rétractation dans ce délai et avant exécution de la prestation, l'acompte versé sera remboursé intégralement dans les conditions de l'article 12. ` +
					`Si le Client demande expressément le démarrage de la prestation avant l'expiration du délai de rétractation, il reconnaît qu'en cas d'exécution complète de la prestation pendant ce délai, le droit de rétractation ne pourra plus être exercé (article L221-28 du Code de la consommation).`,
			);
		} else {
			section(
				'ARTICLE 13 — ABSENCE DE DÉLAI DE RÉTRACTATION (CLIENT PROFESSIONNEL)',
				`Le présent contrat est conclu entre professionnels. Le Client professionnel ne bénéficie pas du délai de rétractation prévu pour les consommateurs. ` +
					`Toute annulation est soumise aux conditions de l'article 11 et aux pénalités éventuellement prévues au devis.`,
			);
		}

		section(
			'ARTICLE 14 — RÉSILIATION POUR MANQUEMENT',
			`En cas de manquement grave de l'une des Parties à ses obligations, l'autre Partie pourra résilier le contrat de plein droit quinze (15) jours après mise en demeure restée infructueuse. ` +
				`En cas de résiliation imputable au Client après versement de l'acompte, les sommes dues au titre des prestations déjà réalisées restent acquises au Prestataire ; les travaux engagés peuvent être facturés au prorata.`,
		);

		section(
			'ARTICLE 15 — RESPONSABILITÉ',
			`La responsabilité du Prestataire, toutes causes confondues, est limitée au montant total TTC effectivement payé par le Client au titre du présent contrat, sauf faute lourde ou dol. Le Prestataire ne saurait être tenu responsable des dommages indirects (perte de chiffre d'affaires, perte de données non imputable au Prestataire, etc.).`,
		);

		section(
			'ARTICLE 16 — DONNÉES PERSONNELLES',
			`Les Parties s'engagent à respecter la réglementation applicable en matière de protection des données personnelles (RGPD). Le Prestataire traite les données du Client uniquement pour les besoins de l'exécution du contrat.`,
		);

		section(
			'ARTICLE 17 — DROIT APPLICABLE ET LITIGES',
			`Le présent contrat est soumis au droit français. En cas de litige, les Parties rechercheront une solution amiable. À défaut d'accord dans un délai de trente (30) jours, compétence est attribuée aux tribunaux du ressort du siège social du Prestataire, sauf disposition impérative contraire.`,
		);

		section(
			'ARTICLE 18 — ACCEPTATION',
			`Le Client déclare avoir lu et accepté le devis n° ${input.quote.number} et le présent contrat. L'acceptation du devis et le paiement de l'acompte valent signature et engagement contractuel. Date d'acceptation : ${quoteDate}.`,
		);

		ensureSpace(100);
		doc.moveDown(1);
		const sigY = doc.y;
		const colW = (contentWidth - 20) / 2;
		doc.font('Helvetica-Bold').fontSize(10).fillColor(PDF_THEME.navy).text('Pour le Prestataire', marginX, sigY, { width: colW });
		doc.text('Pour le Client', marginX + colW + 20, sigY, { width: colW });
		doc.moveDown(3);
		doc.font('Helvetica').fontSize(9).fillColor(PDF_THEME.text).text('Signature :', marginX, doc.y);
		doc.text('Signature :', marginX + colW + 20, doc.y - doc.currentLineHeight());
		doc.moveDown(2);
		doc.text(`Fait le ${quoteDate}`, marginX, doc.y, { width: contentWidth, align: 'center' });
	}
}
