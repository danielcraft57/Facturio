/**
 * Identité visuelle des emails PrestaFacture — alignée sur prestafacture.com
 * (hero teal, preset Finance bleu / vert secondaire).
 */
export const EMAIL_BRAND = {
	/** Teal hero marketing */
	teal700: '#0f766e',
	teal600: '#0d9488',
	teal900: '#134e4a',
	/** Preset Finance (nav, CTA app) */
	primary: '#1e40af',
	primaryDark: '#1e3a8a',
	secondary: '#047857',
	secondaryDark: '#065f46',
	/** Neutres */
	bgPage: '#f0fdfa',
	bgCard: '#ffffff',
	bgMuted: '#f8fafc',
	text: '#111827',
	textMuted: '#475569',
	textSoft: '#64748b',
	border: '#e2e8f0',
	borderSoft: '#ccfbf1',
	/** Sémantique */
	success: '#047857',
	successBg: '#ecfdf5',
	warning: '#b45309',
	warningBg: '#fffbeb',
	danger: '#b91c1c',
	dangerBg: '#fef2f2',
	info: '#1e40af',
	infoBg: '#eff6ff',
} as const;

export type EmailHeaderVariant = 'default' | 'success' | 'warning' | 'danger' | 'quote';

const HEADER_FILES: Record<EmailHeaderVariant, string> = {
	default: 'header-default.webp',
	success: 'header-success.webp',
	warning: 'header-warning.webp',
	danger: 'header-danger.webp',
	quote: 'header-quote.webp',
};

import { resolvePublicAppBaseUrl } from './public-app-url';

/** Nom de marque plateforme (emails, en-têtes) — pas MAIL_FROM_NAME (souvent un domaine SMTP). */
export function getPlatformBrandName(): string {
	const explicit = process.env.PLATFORM_BRAND_NAME?.trim();
	if (explicit) return explicit;
	const fromName = process.env.MAIL_FROM_NAME?.trim();
	if (fromName && !fromName.includes('.')) return fromName;
	return process.env.COMPANY_NAME?.trim() || 'PrestaFacture';
}

/** URL publique des images email (frontend :5173 en dev, domaine en prod). */
export function getPublicAppBaseUrl(): string {
	return resolvePublicAppBaseUrl();
}

/** Libellé domaine public pour pieds de page email (sans schéma). */
export function getPublicAppDomainLabel(): string {
	try {
		return new URL(getPublicAppBaseUrl()).host.replace(/^www\./, '');
	} catch {
		return 'prestafacture.com';
	}
}

export function getEmailAssetsBaseUrl(): string {
	return `${getPublicAppBaseUrl()}/images/email`;
}

export function getEmailAssetUrl(file: string): string {
	return `${getEmailAssetsBaseUrl()}/${file}`;
}

export function getEmailIconUrl(size: 48 | 96 = 48): string {
	return getEmailAssetUrl(size === 96 ? 'prestafacture-icon-96.webp' : 'prestafacture-icon-48.webp');
}

export function getEmailHeaderUrl(variant: EmailHeaderVariant = 'default'): string {
	return getEmailAssetUrl(HEADER_FILES[variant]);
}

export const EMAIL_GRADIENT_CSS = `linear-gradient(135deg, ${EMAIL_BRAND.teal700} 0%, ${EMAIL_BRAND.teal600} 42%, ${EMAIL_BRAND.teal900} 100%)`;
