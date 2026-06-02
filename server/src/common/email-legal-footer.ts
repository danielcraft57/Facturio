import { formatPostalAddress } from './pdf/pdf-legal-mentions';

function trimValue(value: unknown): string {
	if (value == null) return '';
	return String(value).trim();
}

function formatLegalFormLabel(organization?: Record<string, unknown> | null): string {
	if (!organization) return '';
	const status = organization.companyStatus;
	if (status === 'AUTO_ENTREPRENEUR' || status === 'MICRO_ENTERPRISE') {
		return 'Entrepreneur individuel (micro-entreprise)';
	}
	return trimValue(organization.legalForm);
}

function formatCapitalLabel(organization?: Record<string, unknown> | null): string {
	if (organization?.capital == null) return '';
	const n = Number(organization.capital);
	if (Number.isNaN(n)) return '';
	return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

function formatRcs(organization?: Record<string, unknown> | null): string {
	const rcs = trimValue(organization?.rcs);
	if (!rcs) return '';
	const city = trimValue(organization?.rcsCity);
	return city ? `RCS ${rcs} ${city}` : `RCS ${rcs}`;
}

/** Nom affiché dans l’objet / signature (fiche entreprise, sans .env). */
export function resolveEmailIssuerDisplayName(organization?: Record<string, unknown> | null): string {
	if (!organization) {
		return trimValue(process.env.COMPANY_NAME) || 'Facturio';
	}
	return (
		trimValue(organization.legalName) ||
		trimValue(organization.name) ||
		'Votre entreprise'
	);
}

/**
 * Pied de page légal pour emails métier (devis, factures…) — données BDD uniquement.
 * Les champs vides sont omis ; si rien n’est renseigné, une ligne minimale avec le nom.
 */
export function buildEmailLegalFooter(organization?: Record<string, unknown> | null): string {
	if (!organization) {
		return buildPlatformEmailLegalFooter();
	}

	const parts: string[] = [];
	const name = resolveEmailIssuerDisplayName(organization);
	if (name) parts.push(name);

	const legalForm = formatLegalFormLabel(organization);
	if (legalForm) parts.push(legalForm);

	const capital = formatCapitalLabel(organization);
	if (capital) parts.push(`au capital de ${capital}`);

	const rcs = formatRcs(organization);
	if (rcs) parts.push(rcs);

	const address = formatPostalAddress(organization).replace(/\s*\n+\s*/g, ', ').trim();
	if (address) parts.push(address);

	const siret = trimValue(organization.siret);
	if (siret) parts.push(`SIRET : ${siret}`);

	const vat = trimValue(organization.vatNumber);
	if (vat) parts.push(`TVA : ${vat}`);

	const phone = trimValue(organization.phone);
	if (phone) parts.push(`Tél. : ${phone}`);

	const email =
		trimValue(organization.email) || trimValue(organization.dataControllerEmail);
	if (email) parts.push(`Email : ${email}`);

	const website = trimValue(organization.website);
	if (website) parts.push(`Site : ${website}`);

	if (parts.length === 0) {
		return name || 'Votre entreprise';
	}

	return parts.join(' — ');
}

/** Pied de page Facturio plateforme (abonnements SaaS) — variables d’environnement. */
export function buildPlatformEmailLegalFooter(): string {
	const parts: string[] = [];
	const name = trimValue(process.env.COMPANY_NAME);
	if (name) parts.push(name);
	const address = trimValue(process.env.COMPANY_ADDRESS);
	if (address) parts.push(address.replace(/\s*\n+\s*/g, ', '));
	const siret = trimValue(process.env.COMPANY_SIRET);
	if (siret) parts.push(`SIRET : ${siret}`);
	const vat = trimValue(process.env.COMPANY_VAT);
	if (vat) parts.push(`TVA : ${vat}`);
	const phone = trimValue(process.env.COMPANY_PHONE);
	if (phone) parts.push(`Tél. : ${phone}`);
	const email = trimValue(process.env.COMPANY_EMAIL) || trimValue(process.env.MAIL_FROM);
	if (email) parts.push(`Email : ${email}`);
	return parts.length > 0 ? parts.join(' — ') : 'Facturio';
}
