import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

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

	constructor() {
		this.fromEmail = process.env.MAIL_FROM || 'no-reply@example.com';
		this.fromName = process.env.MAIL_FROM_NAME || 'Facturio';
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
		const name = process.env.MAIL_FROM_INVOICE_NAME || 'Facturio Factures';
		return `${name} <${addr}>`;
	}

	/** Adresse d'envoi des devis (compte dédié). */
	private get quoteFrom(): string {
		const addr = process.env.MAIL_FROM_QUOTE || 'devis@danielcraft.fr';
		const name = process.env.MAIL_FROM_QUOTE_NAME || 'Facturio Devis';
		return `${name} <${addr}>`;
	}

	/** Factures d'abonnement Facturio (Stripe plateforme) — défaut : MAIL_FROM_INVOICE ou abonnement@. */
	private get subscriptionFrom(): string {
		const addr =
			process.env.MAIL_FROM_SUBSCRIPTION ||
			process.env.MAIL_FROM_INVOICE ||
			'abonnement@danielcraft.fr';
		const name =
			process.env.MAIL_FROM_SUBSCRIPTION_NAME ||
			process.env.MAIL_FROM_INVOICE_NAME ||
			'Facturio Abonnements';
		return `${name} <${addr}>`;
	}

	/** Adresse d'envoi des emails transactionnels "no-reply". */
	private get verifyFrom(): string {
		const addr = this.noReplyEmail || 'no-reply@example.com';
		const name = this.fromName || 'Facturio';
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
		attachments?: { filename: string; content: Buffer; contentType?: string }[];
		from?: string;
		replyTo?: string;
	}): Promise<void> {
		try {
			const from = options.from ?? `${this.fromName} <${this.fromEmail}>`;
			const { from: _omit, replyTo, ...rest } = options;
			const reply =
				replyTo ||
				process.env.COMPANY_EMAIL ||
				process.env.MAIL_FROM_INVOICE ||
				this.fromEmail;
			await this.transporter.sendMail({
				from,
				replyTo: reply,
				...rest,
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
		pdfBuffer: Buffer;
		trackOpenUrl?: string;
		paymentUrl?: string;
	}): Promise<void> {
		const company = process.env.COMPANY_NAME || 'Facturio';
		const subject = `Facture ${options.invoiceNumber} — ${company}`;
		const html = this.getInvoiceTemplate({
			invoiceNumber: options.invoiceNumber,
			invoiceDate: options.invoiceDate,
			clientName: options.clientName,
			total: options.total,
			trackOpenUrl: options.trackOpenUrl,
			paymentUrl: options.paymentUrl
		});

		const paymentLine = options.paymentUrl
			? `\n\nConsulter et payer en ligne :\n${options.paymentUrl}\n`
			: '';

		await this.send({
			from: this.invoiceFrom,
			to: options.to,
			subject,
			html,
			text:
				`Bonjour ${options.clientName},\n\n` +
				`Veuillez trouver ci-joint la facture ${options.invoiceNumber} ` +
				`du ${new Date(options.invoiceDate).toLocaleDateString('fr-FR')} ` +
				`d'un montant de ${this.formatCurrency(options.total)}.${paymentLine}\n` +
				`Cordialement,\n${company}`,
			attachments: [{
				filename: `facture-${options.invoiceNumber}.pdf`,
				content: options.pdfBuffer,
				contentType: 'application/pdf'
			}]
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
	}): Promise<void> {
		const subject = `Devis ${options.quoteNumber}`;
		const html = this.getQuoteTemplate({
			quoteNumber: options.quoteNumber,
			quoteDate: options.quoteDate,
			clientName: options.clientName,
			total: options.total,
			expiryDate: options.expiryDate,
			trackOpenUrl: options.trackOpenUrl,
			acceptUrl: options.acceptUrl,
			rejectUrl: options.rejectUrl
		});

		await this.send({
			from: this.quoteFrom,
			to: options.to,
			subject,
			html,
			text: `Bonjour,\n\nVeuillez trouver ci-joint le devis ${options.quoteNumber} d'un montant de ${this.formatCurrency(options.total)}.\n\nCordialement`,
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
		pdfBuffer?: Buffer;
	}): Promise<void> {
		const subject = options.daysOverdue
			? `Relance - Facture ${options.invoiceNumber} (${options.daysOverdue} jour(s) de retard)`
			: `Relance - Facture ${options.invoiceNumber}`;
		const html = this.getReminderTemplate({
			invoiceNumber: options.invoiceNumber,
			invoiceDate: options.invoiceDate,
			clientName: options.clientName,
			amount: options.amount,
			daysOverdue: options.daysOverdue,
			paymentUrl: options.paymentUrl
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
	}): Promise<void> {
		const html = this.getInvoicePaidClientTemplate(options);
		const viewLine = options.invoiceViewUrl
			? `\n\nConsulter la facture : ${options.invoiceViewUrl}`
			: '';
		const text =
			`Bonjour ${options.clientName},\n\n` +
			`Nous confirmons la réception de votre paiement pour la facture ${options.invoiceNumber} ` +
			`(${this.formatCurrency(options.lastPaymentAmount)} — ${options.paymentMethodLabel}).\n\n` +
			`Montant total de la facture : ${this.formatCurrency(options.total)}. La facture est réglée.${viewLine}\n\n` +
			`Cordialement,\n${options.issuerName}`;

		await this.send({
			from: this.invoiceFrom,
			to: options.to,
			replyTo: options.replyTo,
			subject: `Paiement reçu — Facture ${options.invoiceNumber}`,
			html,
			text,
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
	}): Promise<void> {
		const html = this.getInvoicePaidProviderTemplate(options);
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
	 * Pied de page avec mentions légales (SIRET, adresse, etc.) - style V6 / LCEN.
	 */
	private getLegalFooter(): string {
		const name = process.env.COMPANY_NAME || 'Votre Entreprise';
		const address = process.env.COMPANY_ADDRESS || '';
		const siret = process.env.COMPANY_SIRET || '';
		const vat = process.env.COMPANY_VAT || '';
		const phone = process.env.COMPANY_PHONE || '';
		const email = process.env.COMPANY_EMAIL || process.env.MAIL_FROM || '';
		const parts: string[] = [name];
		if (address) parts.push(address);
		if (siret) parts.push(`SIRET : ${siret}`);
		if (vat) parts.push(`TVA : ${vat}`);
		if (phone) parts.push(`Tél. : ${phone}`);
		if (email) parts.push(`Email : ${email}`);
		return parts.join(' - ');
	}

	/**
	 * Template HTML pour facture (style DanielCraftFr, pixel tracking, mentions légales).
	 */
	private getInvoiceTemplate(data: {
		invoiceNumber: string;
		invoiceDate: Date | string;
		clientName: string;
		total: number;
		trackOpenUrl?: string;
		paymentUrl?: string;
	}): string {
		const pixel = data.trackOpenUrl
			? `<img src="${data.trackOpenUrl}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;" />`
			: '';
		const legal = this.getLegalFooter();
		return `
<!DOCTYPE html>
<html lang="fr">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Facture ${data.invoiceNumber}</title>
	<style>
		body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #111827; margin: 0; padding: 0; background: #fdf2f2; }
		.container { max-width: 600px; margin: 0 auto; padding: 24px; }
		/* Entête aligné sur la même ligne visuelle que la confirmation : rouge → bleu, titre noir */
		.header { background: linear-gradient(135deg, #b91c1c 0%, #dc2626 30%, #2563eb 100%); padding: 20px 24px; border-radius: 16px; margin-bottom: 24px; box-shadow: 0 18px 45px rgba(185,28,28,0.55); }
		.header h2 { margin: 0; font-size: 1.4rem; color: #111827; font-weight: 700; letter-spacing: -0.02em; }
		.content { padding: 0 0 24px; }
		.content p { margin: 0 0 12px; color: #1f2933; font-size: 15px; }
		.total { font-size: 1.1rem; font-weight: 600; color: #b91c1c; }
		.footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #fecaca; font-size: 11px; color: #6b7280; line-height: 1.5; }
	</style>
</head>
<body>
	${pixel}
	<div class="container">
		<div class="header">
			<h2>Facture ${data.invoiceNumber}</h2>
		</div>
		<div class="content">
			<p>Bonjour ${data.clientName},</p>
			<p>Veuillez trouver ci-joint la facture <strong>${data.invoiceNumber}</strong> du ${new Date(data.invoiceDate).toLocaleDateString('fr-FR')}.</p>
			<p class="total">Montant total : ${this.formatCurrency(data.total)}</p>
			<p>Merci de régler cette facture dans les délais convenus.</p>
			${data.paymentUrl ? `
			<table cellpadding="0" cellspacing="0" role="presentation" style="margin-top: 24px;">
				<tr>
					<td>
						<a href="${data.paymentUrl}" style="display: inline-block; padding: 14px 28px; background: #16a34a; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
							Voir la facture et payer en ligne
						</a>
					</td>
				</tr>
			</table>
			<p style="font-size: 12px; color: #6b7280; margin-top: 12px;">Paiement sécurisé par carte bancaire.</p>` : ''}
		</div>
		<div class="footer">
			<p>${legal}</p>
			<p>Cet email a été envoyé automatiquement par Facturio.</p>
		</div>
	</div>
</body>
</html>`;
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
	}): string {
		const legal = this.getLegalFooter();
		const viewBtn = data.invoiceViewUrl
			? `<table cellpadding="0" cellspacing="0" role="presentation" style="margin-top: 20px;"><tr><td><a href="${data.invoiceViewUrl}" style="display: inline-block; padding: 14px 28px; background: #16a34a; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">Voir la facture</a></td></tr></table>`
			: '';
		return `
<!DOCTYPE html>
<html lang="fr">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Paiement reçu — ${data.invoiceNumber}</title>
	<style>
		body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #111827; margin: 0; padding: 0; background: #f0fdf4; }
		.container { max-width: 600px; margin: 0 auto; padding: 24px; }
		.header { background: linear-gradient(135deg, #15803d 0%, #16a34a 50%, #2563eb 100%); padding: 20px 24px; border-radius: 16px; margin-bottom: 24px; }
		.header h2 { margin: 0; font-size: 1.35rem; color: #fff; font-weight: 700; }
		.content p { margin: 0 0 12px; color: #1f2933; font-size: 15px; }
		.highlight { font-size: 1.05rem; font-weight: 600; color: #15803d; }
		.footer { margin-top: 28px; padding-top: 16px; border-top: 1px solid #bbf7d0; font-size: 11px; color: #6b7280; }
	</style>
</head>
<body>
	<div class="container">
		<div class="header"><h2>Paiement reçu</h2></div>
		<div class="content">
			<p>Bonjour ${data.clientName},</p>
			<p>Nous confirmons la réception de votre paiement pour la facture <strong>${data.invoiceNumber}</strong> du ${new Date(data.invoiceDate).toLocaleDateString('fr-FR')}.</p>
			<p class="highlight">Montant encaissé : ${this.formatCurrency(data.lastPaymentAmount)} (${data.paymentMethodLabel})</p>
			<p>Montant total de la facture : ${this.formatCurrency(data.total)} — <strong>facture réglée</strong>.</p>
			${viewBtn}
			<p style="margin-top: 20px;">Cordialement,<br><strong>${data.issuerName}</strong></p>
</div>
		<div class="footer"><p>${legal}</p></div>
	</div>
</body>
</html>`;
	}

	private getInvoicePaidProviderTemplate(data: {
		clientName: string;
		invoiceNumber: string;
		total: number;
		lastPaymentAmount: number;
		paymentMethodLabel: string;
		appInvoiceUrl: string;
	}): string {
		const legal = this.getLegalFooter();
		return `
<!DOCTYPE html>
<html lang="fr">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Facture payée — ${data.invoiceNumber}</title>
	<style>
		body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #111827; margin: 0; padding: 0; background: #eff6ff; }
		.container { max-width: 600px; margin: 0 auto; padding: 24px; }
		.header { background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%); padding: 20px 24px; border-radius: 16px; margin-bottom: 24px; }
		.header h2 { margin: 0; font-size: 1.35rem; color: #fff; font-weight: 700; }
		.content p { margin: 0 0 12px; font-size: 15px; }
		.footer { margin-top: 28px; padding-top: 16px; border-top: 1px solid #bfdbfe; font-size: 11px; color: #6b7280; }
	</style>
</head>
<body>
	<div class="container">
		<div class="header"><h2>Facture payée</h2></div>
		<div class="content">
			<p>Bonjour,</p>
			<p>La facture <strong>${data.invoiceNumber}</strong> a été intégralement réglée par <strong>${data.clientName}</strong>.</p>
			<p>Encaissement : <strong>${this.formatCurrency(data.lastPaymentAmount)}</strong> (${data.paymentMethodLabel})</p>
			<p>Total facture : ${this.formatCurrency(data.total)}</p>
			<table cellpadding="0" cellspacing="0" role="presentation" style="margin-top: 20px;"><tr><td><a href="${data.appInvoiceUrl}" style="display: inline-block; padding: 14px 28px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">Ouvrir la facture dans Facturio</a></td></tr></table>
</div>
		<div class="footer"><p>${legal}</p><p>Notification automatique Facturio.</p></div>
	</div>
</body>
</html>`;
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
	}): string {
		const expiryText = data.expiryDate
			? `<p><strong style="color: #dc2626;">Valable jusqu'au ${new Date(data.expiryDate).toLocaleDateString('fr-FR')}</strong></p>`
			: '';
		const pixel = data.trackOpenUrl
			? `<img src="${data.trackOpenUrl}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;" />`
			: '';
		const legal = this.getLegalFooter();
		const buttons = (data.acceptUrl || data.rejectUrl) ? `
		<table cellpadding="0" cellspacing="0" role="presentation" style="margin-top: 24px;">
			<tr>
				${data.acceptUrl ? `<td style="padding-right: 12px;"><a href="${data.acceptUrl}" style="display: inline-block; padding: 12px 24px; background: #dc2626; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; transition: background 300ms ease;">Accepter le devis</a></td>` : ''}
				${data.rejectUrl ? `<td><a href="${data.rejectUrl}" style="display: inline-block; padding: 12px 24px; background: #f9fafb; color: #374151; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px; border: 1px solid #e5e7eb;">Refuser</a></td>` : ''}
			</tr>
		</table>` : '';
		return `
<!DOCTYPE html>
<html lang="fr">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Devis ${data.quoteNumber}</title>
	<style>
		body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #111827; margin: 0; padding: 0; background: #fdf2f2; }
		.container { max-width: 600px; margin: 0 auto; padding: 24px; }
		.header { background: linear-gradient(135deg, #b91c1c 0%,rgb(231, 166, 166) 30%, #2563eb 100%); padding: 20px 24px; border-radius: 16px; margin-bottom: 24px; box-shadow: 0 18px 45px rgba(185,28,28,0.55); }
		.header h2 { margin: 0; font-size: 1.4rem; color: #111827; font-weight: 700; letter-spacing: -0.02em; }
		.content { padding: 0 0 24px; }
		.content p { margin: 0 0 12px; color: #1f2933; font-size: 15px; }
		.total { font-size: 1.1rem; font-weight: 600; color: #b91c1c; }
		.footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #fecaca; font-size: 11px; color: #6b7280; line-height: 1.5; }
	</style>
</head>
<body>
	${pixel}
	<div class="container">
		<div class="header">
			<h2>Devis ${data.quoteNumber}</h2>
		</div>
		<div class="content">
			<p>Bonjour ${data.clientName},</p>
			<p>Veuillez trouver ci-joint le devis <strong>${data.quoteNumber}</strong> du ${new Date(data.quoteDate).toLocaleDateString('fr-FR')}.</p>
			${expiryText}
			<p class="total">Montant total : ${this.formatCurrency(data.total)}</p>
			<p>Nous restons à votre disposition pour toute question.</p>
			${buttons}
		</div>
		<div class="footer">
			<p>${legal}</p>
			<p>Cet email a été envoyé automatiquement par Facturio.</p>
		</div>
	</div>
</body>
</html>`;
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
	}): string {
		const overdueText = data.daysOverdue 
			? `<p><strong>Cette facture est en retard de ${data.daysOverdue} jour(s).</strong></p>`
			: '<p><strong>Cette facture est en attente de paiement.</strong></p>';
		const payBtn = data.paymentUrl
			? `<table cellpadding="0" cellspacing="0" role="presentation" style="margin-top: 20px;"><tr><td style="border-radius: 8px; background: #2563eb;"><a href="${data.paymentUrl}" style="display: inline-block; padding: 12px 24px; color: #fff; text-decoration: none; font-weight: 600;">Voir la facture et payer en ligne</a></td></tr></table>`
			: '';
		
		return `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="UTF-8">
				<style>
					body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #111827; margin: 0; padding: 0; background: #fdf2f2; }
					.container { max-width: 600px; margin: 0 auto; padding: 24px; }
					.header { background: linear-gradient(135deg, #b91c1c 0%, #dc2626 50%, #f97373 100%); padding: 20px 24px; border-radius: 16px; margin-bottom: 24px; box-shadow: 0 18px 45px rgba(185,28,28,0.55); }
					.content { padding: 0 0 24px; }
					.footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #fecaca; font-size: 12px; color: #6b7280; }
				</style>
			</head>
			<body>
				<div class="container">
					<div class="header">
						<h2>Rappel - Facture ${data.invoiceNumber}</h2>
					</div>
					<div class="content">
						<p>Bonjour ${data.clientName},</p>
						<p>Nous vous rappelons que la facture <strong>${data.invoiceNumber}</strong> du ${new Date(data.invoiceDate).toLocaleDateString('fr-FR')} est toujours en attente de paiement.</p>
						${overdueText}
						<p><strong>Montant à régler : ${this.formatCurrency(data.amount)}</strong></p>
						<p>Merci de procéder au règlement dans les plus brefs délais.</p>
						${payBtn}
					</div>
					<div class="footer">
						<p>Cet email a été envoyé automatiquement par Facturio.</p>
					</div>
				</div>
			</body>
			</html>
		`;
	}

	/**
	 * Envoie l'email de vérification d'adresse (inscription).
	 * Utilise le template Facturio avec lien de confirmation.
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
		const subject = 'Confirmez cette connexion - Facturio';
		const deviceHint = options.userAgent
			? `<p style="color:#6b7280;font-size:0.9rem;">Appareil détecté : ${options.userAgent.slice(0, 120)}</p>`
			: '';
		const html = this.getBaseLayout({
			title: subject,
			content: `
				<p>Bonjour${options.firstName ? ` ${options.firstName}` : ''},</p>
				<p>Une connexion à votre compte Facturio a été détectée depuis un <strong>nouvel appareil</strong> ou pendant une session déjà active ailleurs.</p>
				${deviceHint}
				<p>Si c'était vous, confirmez cette connexion :</p>
				<p style="text-align:center;margin:28px 0;">
					<a href="${options.verifyUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Confirmer cette connexion</a>
				</p>
				<p style="color:#6b7280;font-size:0.9rem;">Ce lien expire dans 1 heure. Sinon, ignorez cet email et changez votre mot de passe si vous suspectez une intrusion.</p>
			`,
		});
		const text = `Bonjour${options.firstName ? ` ${options.firstName}` : ''},\n\nConfirmez cette connexion : ${options.verifyUrl}\n\nLien valide 1 heure.\n\nL'équipe Facturio`;
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
	}): Promise<void> {
		const subject = 'Confirmez votre adresse email - Facturio';
		const html = this.getVerifyEmailTemplate({
			firstName: options.firstName,
			verifyUrl: options.verifyUrl,
		});
		const text = `Bonjour${options.firstName ? ` ${options.firstName}` : ''},\n\nCliquez sur le lien suivant pour confirmer votre adresse email et activer votre compte Facturio :\n${options.verifyUrl}\n\nCe lien est valide 24 heures.\n\nCet email est envoyé depuis une adresse no-reply, merci de ne pas y répondre.\n\nL'équipe Facturio`;
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
		const subject = 'Réinitialisation de votre mot de passe - Facturio';
		const html = this.getPasswordResetTemplate({
			firstName: options.firstName,
			resetUrl: options.resetUrl,
		});
		const text = `Bonjour${options.firstName ? ` ${options.firstName}` : ''},\n\nVous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien ci-dessous (valide 1 heure) :\n${options.resetUrl}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet email.\n\nL'équipe Facturio`;
		await this.send({
			to: options.to,
			subject,
			html,
			text,
		});
	}

	/**
	 * Layout HTML commun (Facturio) pour emails transactionnels.
	 */
	private getBaseLayout(data: { title: string; content: string }): string {
		const legal = this.getLegalFooter();
		return `
<!DOCTYPE html>
<html lang="fr">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${data.title}</title>
	<style>
		/* Couleurs texte globales */
		body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #111827; margin: 0; padding: 0; background: #fdf2f2; }
		/* Ratio global : largeur 560px, padding vertical ~34px (≈ 560 / φ²) pour un équilibre visuel */
		.wrapper { padding: 34px 21px; }
		.container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 18px; box-shadow: 0 22px 55px rgba(15,23,42,0.25); overflow: hidden; }
		/* Entête dégradé DanielCraft : rouge → ton clair → bleu (pastel, sobre) */
		.header { background: linear-gradient(135deg, #fecaca 0%, #ffe4e6 40%, #bfdbfe 100%); padding: 30px 24px 22px; text-align: left; border-bottom: 1px solid rgba(248,113,113,0.25); }
		.header h1 { margin: 0; font-size: 1.72rem; font-weight: 700; color: #111827; letter-spacing: -0.03em; }
		.header .logo { color: #111827; font-size: 0.95rem; margin-top: 4px; opacity: 0.85; }
		.content { padding: 28px 24px 24px; }
		.content p { margin: 0 0 16px; color: #111827; font-size: 15px; }
		.btn { display: inline-block; padding: 14px 28px; background: #dc2626; color: #ffffff !important; text-decoration: none; border-radius: 999px; font-weight: 600; font-size: 15px; margin: 8px 0 24px; box-shadow: 0 12px 30px rgba(220,38,38,0.55); }
		.btn:hover { background: #b91c1c; }
		.footer { padding: 20px 24px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; line-height: 1.5; }
		.footer p { margin: 0; }
		.link-plain { color: #dc2626; word-break: break-all; }
	</style>
</head>
<body>
	<div class="wrapper">
		<div class="container">
			<div class="header">
				<h1>Danielcraft.fr</h1>
				<div class="logo">${data.title}</div>
			</div>
			<div class="content">
				${data.content}
			</div>
			<div class="footer">
				<p>${legal}</p>
				<p>Cet email a été envoyé automatiquement par Facturio.</p>
			</div>
		</div>
	</div>
</body>
</html>`;
	}

	/**
	 * Template HTML pour vérification d'email (inscription).
	 */
	private getVerifyEmailTemplate(data: { firstName?: string | null; verifyUrl: string }): string {
		const greeting = data.firstName ? `Bonjour ${data.firstName},` : 'Bonjour,';
		const content = `
			<p>${greeting}</p>
			<p>Merci d'avoir créé un compte sur Facturio. Pour activer votre compte et accéder à toutes les fonctionnalités, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous.</p>
			<p><a href="${data.verifyUrl}" class="btn">Confirmer mon adresse email</a></p>
			<p>Ce lien est valide <strong>24 heures</strong>. Si vous n'avez pas créé de compte Facturio, vous pouvez ignorer cet email.</p>
			<p>À bientôt,<br><strong>L'équipe Facturio</strong></p>`;
		return this.getBaseLayout({
			title: 'Confirmez votre adresse email',
			content,
		});
	}

	/**
	 * Template HTML pour réinitialisation du mot de passe.
	 */
	private getPasswordResetTemplate(data: { firstName?: string | null; resetUrl: string }): string {
		const greeting = data.firstName ? `Bonjour ${data.firstName},` : 'Bonjour,';
		const content = `
			<p>${greeting}</p>
			<p>Vous avez demandé la réinitialisation de votre mot de passe Facturio. Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe.</p>
			<p><a href="${data.resetUrl}" class="btn">Réinitialiser mon mot de passe</a></p>
			<p>Ce lien est valide <strong>1 heure</strong>. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email en toute sécurité.</p>
			<p>Cordialement,<br><strong>L'équipe Facturio</strong></p>`;
		return this.getBaseLayout({
			title: 'Réinitialisation de votre mot de passe',
			content,
		});
	}

	/** Abonnement Facturio activé (checkout réussi). */
	async sendSubscriptionActivated(options: {
		to: string;
		firstName?: string | null;
		planLabel: string;
		settingsUrl: string;
	}): Promise<void> {
		const greeting = options.firstName ? `Bonjour ${options.firstName},` : 'Bonjour,';
		const content = `
			<p>${greeting}</p>
			<p>Votre abonnement <strong>${options.planLabel}</strong> est maintenant actif sur Facturio.</p>
			<p>Vous pouvez gérer votre facturation et consulter vos quotas depuis les paramètres.</p>
			<p><a href="${options.settingsUrl}" class="btn">Voir mon abonnement</a></p>
			<p>Merci pour votre confiance,<br><strong>L'équipe Facturio</strong></p>`;
		const html = this.getBaseLayout({ title: 'Abonnement activé', content });
		await this.send({
			from: this.subscriptionFrom,
			to: options.to,
			subject: `Abonnement ${options.planLabel} activé — Facturio`,
			html,
			text: `Votre abonnement ${options.planLabel} est actif. Paramètres : ${options.settingsUrl}`,
		});
	}

	/** Facture d'abonnement Facturio (même modèle visuel que les factures clients). */
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
		const company = process.env.COMPANY_NAME || 'Facturio';
		const subject = `Facture ${options.invoiceNumber} — ${company}`;
		const html = this.getInvoiceTemplate({
			invoiceNumber: options.invoiceNumber,
			invoiceDate: options.invoiceDate,
			clientName: options.clientName,
			total: options.amountEur,
			paymentUrl: options.hostedInvoiceUrl ?? undefined,
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
				`pour votre abonnement Facturio (${this.formatCurrency(options.amountEur)}).${paymentLine}\n` +
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
		const content = `
			<p>${greeting}</p>
			<p>Le renouvellement de votre abonnement Facturio n'a pas pu être débité.</p>
			<p>Mettez à jour votre moyen de paiement pour éviter une interruption de service.</p>
			<p><a href="${options.manageUrl}" class="btn">Mettre à jour le paiement</a></p>
			<p>Si vous avez des questions, répondez à cet email ou contactez le support.</p>`;
		const html = this.getBaseLayout({ title: 'Paiement abonnement échoué', content });
		await this.send({
			from: this.subscriptionFrom,
			to: options.to,
			subject: 'Action requise — paiement abonnement Facturio',
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
		const content = `
			<p>${greeting}</p>
			<p>Votre abonnement <strong>${options.planLabel}</strong> a été résilié. Votre compte est repassé sur le plan gratuit.</p>
			<p>Vos données restent accessibles ; les quotas du plan Free s'appliquent à nouveau.</p>
			<p>Vous pouvez vous réabonner à tout moment depuis Facturio.</p>`;
		const html = this.getBaseLayout({ title: 'Abonnement terminé', content });
		await this.send({
			from: this.subscriptionFrom,
			to: options.to,
			subject: 'Votre abonnement Facturio a pris fin',
			html,
			text: `Abonnement ${options.planLabel} terminé. Compte repassé sur le plan gratuit.`,
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
