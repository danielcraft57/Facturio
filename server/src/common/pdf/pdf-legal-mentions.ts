import type { PdfCompanyInfo, PdfDocumentKind } from './pdf-theme';

export interface LegalMentionsContext {
	kind: PdfDocumentKind;
	company: PdfCompanyInfo;
	organization?: any;
	document?: any;
	expiryDate?: Date | string;
}

export interface LegalFooterContent {
	/** Ligne d'identité légale de l'émetteur (pied de page) */
	issuerLine: string;
	/** Blocs de texte réglementaire */
	paragraphs: string[];
}

const COUNTRY_LABELS: Record<string, string> = {
	FR: 'France',
	BE: 'Belgique',
	CH: 'Suisse',
	LU: 'Luxembourg'
};

export function formatCountryLabel(country?: string | null, countryCode?: string | null): string {
	if (country && country.length > 2) return country;
	const code = (countryCode || country || '').toUpperCase();
	return COUNTRY_LABELS[code] || (code || '');
}

/** Adresse postale lisible (sans code pays seul sur une ligne) */
export function formatPostalAddress(organization?: any): string {
	const parts = [
		organization?.address,
		organization?.address2,
		[organization?.zipCode, organization?.city].filter(Boolean).join(' ')
	].filter(Boolean);
	const countryLabel = formatCountryLabel(organization?.country, organization?.countryCode);
	if (countryLabel && countryLabel !== 'France') {
		parts.push(countryLabel);
	} else if (!parts.length && countryLabel) {
		parts.push(countryLabel);
	}
	return parts.join('\n');
}

function isVatFranchise(org?: any, company?: PdfCompanyInfo): boolean {
	if (org?.taxRegime && String(org.taxRegime).toLowerCase().includes('franchise')) return true;
	if (
		org?.companyStatus === 'AUTO_ENTREPRENEUR' ||
		org?.companyStatus === 'MICRO_ENTERPRISE'
	) {
		return true;
	}
	const vat = (company?.vat || '').toLowerCase();
	return vat.includes('293') || vat.includes('non applicable') || vat.includes('franchise');
}

function buildIssuerLine(ctx: LegalMentionsContext): string {
	const { company, organization: org } = ctx;
	const chunks: string[] = [company.name];

	if (company.legalForm) {
		chunks.push(company.legalForm);
	}
	if (company.capital) {
		chunks.push(`au capital de ${company.capital}`);
	}
	if (company.rcs) {
		chunks.push(company.rcs);
	}
	if (company.siret) {
		chunks.push(`SIRET ${company.siret}`);
	}
	if (company.vat) {
		chunks.push(
			isVatFranchise(org, company) ? company.vat : `N° TVA intracommunautaire : ${company.vat}`
		);
	}
	if (company.apeCode) {
		chunks.push(`APE ${company.apeCode}`);
	}

	return chunks.filter(Boolean).join(' — ');
}

/**
 * Mentions légales et contractuelles (France) pour factures et devis.
 * Références : art. 242 nonies du CGI, art. L441-9 et s. du Code de commerce, art. 293 B du CGI.
 */
export function buildFrenchLegalFooter(ctx: LegalMentionsContext): LegalFooterContent {
	const { kind, organization: org, document: doc, company } = ctx;
	const paragraphs: string[] = [];
	const iban = process.env.COMPANY_IBAN;
	const customMentions = process.env.LEGAL_MENTIONS || org?.legalMentions;
	const isB2C = org?.companyType === 'B2C';

	if (kind === 'facture') {
		const due =
			doc?.dueDate != null
				? new Date(doc.dueDate).toLocaleDateString('fr-FR')
				: null;
		paragraphs.push(
			due
				? `Conditions de règlement : paiement par virement bancaire à réception, au plus tard le ${due} (date d'échéance).`
				: 'Conditions de règlement : paiement par virement bancaire à réception de facture, sauf accord écrit contraire.'
		);
		if (iban) {
			paragraphs.push(`Coordonnées bancaires : IBAN ${iban}.`);
		}
		paragraphs.push(
			'Escompte pour paiement anticipé : néant.',
			'En cas de retard de paiement, application des pénalités de retard au taux légal en vigueur (pour les professionnels : taux BCE majoré de 10 points, conformément aux articles L441-10 et D441-5 du Code de commerce).',
			'Indemnité forfaitaire pour frais de recouvrement due au créancier en cas de retard de paiement : 40 € (article D441-5 du Code de commerce).',
			'Le paiement de la facture ne vaut pas renonciation aux garanties légales de conformité (particuliers) ni aux droits du créancier en cas de livraison ou prestation non conforme.'
		);
		if (isVatFranchise(org, company)) {
			paragraphs.push('TVA non applicable, article 293 B du CGI.');
		}
		if (doc?.legalMention) {
			paragraphs.push(doc.legalMention);
		}
		paragraphs.push(
			'Document établi conformément aux dispositions de l\'article 242 nonies du Code général des impôts et aux articles L441-9 et suivants du Code de commerce.'
		);
		if (isB2C) {
			paragraphs.push(
				'Médiation de la consommation : en cas de litige non résolu, le client consommateur peut recourir gratuitement à un médiateur de la consommation (liste sur www.economie.gouv.fr/mediation-conso).'
			);
		}
	} else {
		const validity =
			ctx.expiryDate != null
				? `Ce devis est valable jusqu'au ${new Date(ctx.expiryDate).toLocaleDateString('fr-FR')} inclus.`
				: "Ce devis est valable 30 jours à compter de sa date d'émission, sauf mention contraire.";
		paragraphs.push(
			validity,
			'Les prix sont indiqués hors taxes (HT) ; la TVA applicable sera celle en vigueur à la date de facturation.',
			'Acceptation : bon pour accord signé, signature précédée de la mention « Bon pour accord », ou commande ferme du client. Toute commande vaut acceptation des présentes conditions.',
			'Acompte éventuel et modalités de règlement : selon accord écrit entre les parties.'
		);
		if (isB2C) {
			paragraphs.push(
				'Droit de rétractation (consommateur) : 14 jours à compter de l\'acceptation du devis pour les contrats conclus à distance ou hors établissement, sauf exceptions légales (prestation personnalisée, etc.).'
			);
		}
	}

	if (customMentions) {
		paragraphs.push(customMentions);
	}

	return {
		issuerLine: buildIssuerLine(ctx),
		paragraphs
	};
}
