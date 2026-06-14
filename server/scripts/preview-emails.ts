/**
 * Génère des HTML de prévisualisation des emails Facturio (usage local).
 *
 * Prérequis : frontend Vite sur http://localhost:5173 (images /images/email/*).
 *
 * Usage (depuis server/) :
 *   npm run preview:emails
 *   start tmp/email-previews/index.html
 */
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';
import { EmailService } from '../src/common/email.service';
import { renderSimpleFacturioEmail, emailParagraph } from '../src/common/email-layout';
import { embedEmailImagesAsBase64 } from '../src/common/email-inline-assets';

config({ path: path.join(__dirname, '../.env') });

process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
process.env.PUBLIC_APP_URL = process.env.PUBLIC_APP_URL || process.env.FRONTEND_URL;

const OUT = path.join(__dirname, '../tmp/email-previews');

type PreviewItem = { id: string; label: string; html: string };

function writePreviews(items: PreviewItem[]): void {
	fs.mkdirSync(OUT, { recursive: true });
	const links = items
		.map(
			(item) =>
				`<li><a href="./${item.id}.html">${item.label}</a> — <code>${item.id}.html</code></li>`,
		)
		.join('\n');
	const index = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>Préviews emails Facturio</title>
<style>body{font-family:system-ui,sans-serif;max-width:720px;margin:2rem auto;padding:0 1rem;line-height:1.5}
code{background:#f1f5f9;padding:2px 6px;border-radius:4px}</style></head>
<body>
<h1>Préviews emails (local)</h1>
<p>Images intégrées en base64 (ouverture <code>file://</code> sans serveur). En SMTP, les envois depuis localhost utilisent des pièces jointes inline (CID).</p>
<ul>${links}</ul>
</body></html>`;
	fs.writeFileSync(path.join(OUT, 'index.html'), index, 'utf8');
	for (const item of items) {
		const html = embedEmailImagesAsBase64(item.html);
		fs.writeFileSync(path.join(OUT, `${item.id}.html`), html, 'utf8');
	}
}

function main(): void {
	const svc = new EmailService();
	const api = svc as unknown as {
		getInvoiceTemplate: (d: object) => string;
		getQuoteTemplate: (d: object) => string;
		getReminderTemplate: (d: object) => string;
		getInvoicePaidClientTemplate: (d: object) => string;
		getInvoicePaidProviderTemplate: (d: object) => string;
		getVerifyEmailTemplate: (d: object) => string;
		getSignupConfirmationTemplate: (d: object) => string;
		getOnboardingRecapTemplate: (d: object) => string;
		getPasswordResetTemplate: (d: object) => string;
		getBaseLayout: (d: object) => string;
		formatCurrency: (n: number) => string;
	};

	const now = new Date('2026-06-01');
	const items: PreviewItem[] = [
		{
			id: 'invoice',
			label: 'Facture (paiement en ligne)',
			html: api.getInvoiceTemplate({
				invoiceNumber: 'FAC-2026-0042',
				invoiceDate: now,
				clientName: 'Studio Nova',
				total: 1840,
				paymentUrl: 'http://localhost:5173/facture/demo-token',
			}),
		},
		{
			id: 'invoice-paid',
			label: 'Facture déjà réglée',
			html: api.getInvoiceTemplate({
				invoiceNumber: 'FAC-2026-0041',
				invoiceDate: now,
				clientName: 'Studio Nova',
				total: 290,
				alreadyPaid: true,
				invoiceViewUrl: 'http://localhost:5173/facture/demo-token',
			}),
		},
		{
			id: 'quote',
			label: 'Devis',
			html: api.getQuoteTemplate({
				quoteNumber: 'DEV-2026-0018',
				quoteDate: now,
				clientName: 'Agence Web Lille',
				total: 4200,
				expiryDate: new Date('2026-07-01'),
				acceptUrl: 'http://localhost:5173/public/devis/demo/accepter',
				rejectUrl: 'http://localhost:5173/public/devis/demo/refuser',
			}),
		},
		{
			id: 'reminder',
			label: 'Relance',
			html: api.getReminderTemplate({
				invoiceNumber: 'FAC-2026-0030',
				invoiceDate: now,
				clientName: 'Client Exemple',
				amount: 890,
				daysOverdue: 12,
				paymentUrl: 'http://localhost:5173/facture/demo-token',
			}),
		},
		{
			id: 'payment-received',
			label: 'Paiement reçu (client)',
			html: api.getInvoicePaidClientTemplate({
				clientName: 'Studio Nova',
				invoiceNumber: 'FAC-2026-0042',
				invoiceDate: now,
				total: 1840,
				lastPaymentAmount: 1840,
				paymentMethodLabel: 'Carte bancaire',
				issuerName: 'DanielCraft',
				invoiceViewUrl: 'http://localhost:5173/facture/demo-token',
			}),
		},
		{
			id: 'invoice-paid-provider',
			label: 'Facture payée (prestataire)',
			html: api.getInvoicePaidProviderTemplate({
				clientName: 'Studio Nova',
				invoiceNumber: 'FAC-2026-0042',
				total: 1840,
				lastPaymentAmount: 1840,
				paymentMethodLabel: 'Carte bancaire',
				appInvoiceUrl: 'http://localhost:5173/factures',
			}),
		},
		{
			id: 'verify-email',
			label: 'Inscription (email + confirmation)',
			html: api.getSignupConfirmationTemplate({
				firstName: 'Loïc',
				method: 'email',
				verifyUrl: 'http://localhost:5173/verifier-email/demo-token',
				betaTester: {
					planLabel: 'Agence (beta)',
					durationDays: 90,
					expiresAt: '2026-09-15T00:00:00.000Z',
				},
			}),
		},
		{
			id: 'signup-google',
			label: 'Inscription Google',
			html: api.getSignupConfirmationTemplate({
				firstName: 'Matthieu',
				method: 'google',
				installUrl: 'http://localhost:5173/installation',
				dashboardUrl: 'http://localhost:5173/dashboard',
				betaTester: {
					planLabel: 'Agence (beta)',
					durationDays: 90,
					expiresAt: '2026-09-15T00:00:00.000Z',
					inviteCode: 'DEV26',
				},
			}),
		},
		{
			id: 'onboarding-recap',
			label: 'Récap installation catalogue',
			html: api.getOnboardingRecapTemplate({
				firstName: 'Matthieu',
				productCount: 6,
				productNames: [
					'Site vitrine WordPress',
					'Maintenance mensuelle',
					'Intégration API REST',
					'Audit performance',
					'Formation client',
					'Forfait support 5 h',
				],
				techLabels: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
				devProfileLabel: 'Développeur freelance',
				productsUrl: 'http://localhost:5173/produits',
				createInvoiceUrl: 'http://localhost:5173/factures/inbox?create=1',
				dashboardUrl: 'http://localhost:5173/dashboard',
			}),
		},
		{
			id: 'password-reset',
			label: 'Reset mot de passe',
			html: api.getPasswordResetTemplate({
				firstName: 'Loïc',
				resetUrl: 'http://localhost:5173/reset-password?token=demo',
			}),
		},
		{
			id: 'refund',
			label: 'Remboursement',
			html: renderSimpleFacturioEmail({
				title: 'Remboursement',
				headline: 'Remboursement effectué',
				headerVariant: 'danger',
				bodyHtml:
					emailParagraph('Bonjour Client Exemple,') +
					emailParagraph(
						`Nous vous confirmons que <strong>${api.formatCurrency(150)}</strong> a été remboursé(e) pour la facture <strong>FAC-2026-0030</strong>.`,
					),
			}),
		},
		{
			id: 'subscription-activated',
			label: 'Abonnement activé',
			html: api.getBaseLayout({
				title: 'Abonnement activé',
				headline: 'Abonnement activé',
				content:
					emailParagraph('Bonjour Loïc,') +
					emailParagraph('Votre abonnement <strong>Pro</strong> est maintenant actif sur Facturio.') +
					'<p style="margin:0 0 14px;"><a href="http://localhost:5173/parametres/abonnement" style="display:inline-block;padding:14px 28px;background:#0d9488;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;">Voir mon abonnement</a></p>',
			}),
		},
	];

	writePreviews(items);
	console.log(`✅ ${items.length} préviews écrites dans ${OUT}`);
	console.log(`   Ouvrir : ${path.join(OUT, 'index.html')}`);
	console.log(`   (frontend dev : ${process.env.FRONTEND_URL})`);
}

main();
