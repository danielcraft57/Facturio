/**
 * Affiche la résolution des variables email depuis server/.env
 * Usage : node scripts/verify-email-env.js
 */
require('dotenv').config({ path: '.env' });

const brand =
	process.env.MAIL_FROM_NAME?.trim() ||
	process.env.COMPANY_NAME?.trim() ||
	'PrestaFacture';

function from(name, addr) {
	return `${name} <${addr}>`;
}

const invoiceAddr = process.env.MAIL_FROM_INVOICE || 'facture@danielcraft.fr';
const invoiceName = process.env.MAIL_FROM_INVOICE_NAME || 'PrestaFacture Factures';
const quoteAddr = process.env.MAIL_FROM_QUOTE || 'devis@danielcraft.fr';
const quoteName = process.env.MAIL_FROM_QUOTE_NAME || 'PrestaFacture Devis';
const subAddr =
	process.env.MAIL_FROM_SUBSCRIPTION || process.env.MAIL_FROM_INVOICE || 'abonnement@danielcraft.fr';
const subName =
	process.env.MAIL_FROM_SUBSCRIPTION_NAME ||
	process.env.MAIL_FROM_INVOICE_NAME ||
	'PrestaFacture Abonnements';

console.log('=== SMTP ===');
console.log('Host:', process.env.SMTP_HOST || '(défaut localhost)');
console.log('Port:', process.env.SMTP_PORT || '1025');
console.log('User:', process.env.SMTP_USER || '(aucun)');
console.log('Secure:', process.env.SMTP_SECURE === 'true');
console.log('');
console.log('=== Marque (MAIL_FROM_NAME) ===');
console.log(brand);
console.log('');
console.log('=== Expéditeurs résolus ===');
console.log('No-reply / auth:', from(brand, process.env.MAIL_FROM || 'no-reply@example.com'));
console.log('Factures:', from(invoiceName, invoiceAddr));
console.log('Devis:', from(quoteName, quoteAddr));
console.log('Abonnements:', from(subName, subAddr));
console.log('');
console.log('=== Reply-To par défaut ===');
console.log(
	process.env.COMPANY_EMAIL ||
		process.env.MAIL_FROM_INVOICE ||
		process.env.MAIL_FROM ||
		'(non défini)',
);
console.log('');
console.log('=== Pied de page plateforme ===');
const footerParts = [
	process.env.COMPANY_NAME,
	process.env.COMPANY_ADDRESS,
	process.env.COMPANY_SIRET && `SIRET : ${process.env.COMPANY_SIRET}`,
	process.env.COMPANY_VAT && `TVA : ${process.env.COMPANY_VAT}`,
	process.env.COMPANY_PHONE && `Tél. : ${process.env.COMPANY_PHONE}`,
	(process.env.COMPANY_EMAIL || process.env.MAIL_FROM) &&
		`Email : ${process.env.COMPANY_EMAIL || process.env.MAIL_FROM}`,
].filter(Boolean);
console.log(footerParts.length ? footerParts.join(' — ') : brand);
console.log('');
console.log('=== Liens publics (PUBLIC_APP_URL) ===');
console.log(process.env.PUBLIC_APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173');
