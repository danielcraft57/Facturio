import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/**
 * Extrait l'adresse email d'un en-tête « Nom <a@b.c> » ou « a@b.c ».
 *
 * @param from - En-tête From complet ou adresse seule
 * @returns Adresse email normalisée
 */
export function parseEmailHeaderAddress(from: string): string {
	const match = from.match(/<([^>]+)>/);
	return (match ? match[1] : from).trim();
}

/**
 * Utilisateur SMTP : si seul le login local est fourni (ex. facture), complète avec le domaine de MAIL_FROM.
 *
 * @returns Login SMTP ou undefined si non configuré
 */
export function resolveSmtpAuthUser(): string | undefined {
	const raw = process.env.SMTP_USER?.trim();
	if (!raw) return undefined;
	if (raw.includes('@')) return raw;
	const fromDomain = parseEmailHeaderAddress(process.env.MAIL_FROM || '').split('@')[1];
	return fromDomain ? `${raw}@${fromDomain}` : raw;
}

/**
 * Crée le transport Nodemailer à partir des variables d'environnement.
 *
 * @returns Transport SMTP (ou jsonTransport en tests)
 */
export function createSmtpTransporter(): Transporter {
	if (process.env.NODE_ENV === 'test') {
		return nodemailer.createTransport({ jsonTransport: true }) as Transporter;
	}

	const port = Number(process.env.SMTP_PORT || 1025);
	const user = resolveSmtpAuthUser();

	return nodemailer.createTransport({
		host: process.env.SMTP_HOST || 'localhost',
		port,
		secure: process.env.SMTP_SECURE === 'true',
		requireTLS: port === 587 && process.env.SMTP_SECURE !== 'true',
		auth: user
			? {
					user,
					pass: process.env.SMTP_PASS || '',
				}
			: undefined,
		tls:
			process.env.SMTP_REJECT_UNAUTHORIZED === 'false'
				? { rejectUnauthorized: false }
				: undefined,
	}) as Transporter;
}
