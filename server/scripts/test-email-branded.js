/**
 * Envoie un email de test avec le template devis (images inline CID en localhost).
 * Usage (depuis server/) : node scripts/test-email-branded.js [destinataire]
 */
require('dotenv').config({ path: '.env' });

process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
process.env.PUBLIC_APP_URL = process.env.PUBLIC_APP_URL || process.env.FRONTEND_URL;

const nodemailer = require('nodemailer');
const { EmailService } = require('../dist/common/email.service');

const to = process.argv[2] || process.env.TEST_EMAIL_TO;
if (!to) {
	console.error('Usage: node scripts/test-email-branded.js <email>');
	process.exit(1);
}

const svc = new EmailService();
const api = svc;
const html = api['getQuoteTemplate']({
	quoteNumber: 'DEV-TEST-001',
	quoteDate: new Date(),
	clientName: 'Client Test',
	total: 4200,
	expiryDate: new Date(Date.now() + 30 * 86400000),
	acceptUrl: `${process.env.FRONTEND_URL}/public/devis/test/accepter`,
	rejectUrl: `${process.env.FRONTEND_URL}/public/devis/test/refuser`,
});

console.log('Envoi template devis avec images CID vers', to);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);

api
	.send({
		to,
		subject: '[Test] Devis PrestaFacture — images inline',
		html,
		text: 'Test email branded PrestaFacture (devis).',
		from: process.env.MAIL_FROM_QUOTE
			? `${process.env.MAIL_FROM_QUOTE_NAME || 'PrestaFacture Devis'} <${process.env.MAIL_FROM_QUOTE}>`
			: undefined,
	})
	.then(() => {
		console.log('✅ Email envoyé.');
	})
	.catch((err) => {
		console.error('❌', err);
		process.exit(1);
	});
