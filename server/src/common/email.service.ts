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

	constructor() {
		this.fromEmail = process.env.MAIL_FROM || 'no-reply@example.com';
		this.fromName = process.env.MAIL_FROM_NAME || 'Facturio';

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
	}): Promise<void> {
		try {
			const from = options.from ?? `${this.fromName} <${this.fromEmail}>`;
			const { from: _omit, ...rest } = options;
			await this.transporter.sendMail({ from, ...rest });
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
	}): Promise<void> {
		const subject = `Facture ${options.invoiceNumber}`;
		const html = this.getInvoiceTemplate({
			invoiceNumber: options.invoiceNumber,
			invoiceDate: options.invoiceDate,
			clientName: options.clientName,
			total: options.total,
			trackOpenUrl: options.trackOpenUrl
		});

		await this.send({
			from: this.invoiceFrom,
			to: options.to,
			subject,
			html,
			text: `Bonjour,\n\nVeuillez trouver ci-joint la facture ${options.invoiceNumber} d'un montant de ${this.formatCurrency(options.total)}.\n\nCordialement`,
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
	}): Promise<void> {
		const subject = `Rappel - Facture ${options.invoiceNumber}`;
		const html = this.getReminderTemplate({
			invoiceNumber: options.invoiceNumber,
			invoiceDate: options.invoiceDate,
			clientName: options.clientName,
			amount: options.amount,
			daysOverdue: options.daysOverdue
		});

		await this.send({
			to: options.to,
			subject,
			html,
			text: `Bonjour,\n\nNous vous rappelons que la facture ${options.invoiceNumber} d'un montant de ${this.formatCurrency(options.amount)} est toujours en attente de paiement.\n\nCordialement`
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
		body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background: #ffffff; }
		.container { max-width: 600px; margin: 0 auto; padding: 24px; }
		.header { background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); padding: 24px; border-radius: 8px; margin-bottom: 24px; border-left: 4px solid #dc2626; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); }
		.header h2 { margin: 0; font-size: 1.5rem; color: #dc2626; font-weight: 700; }
		.content { padding: 0 0 24px; }
		.content p { margin: 0 0 12px; color: #374151; }
		.total { font-size: 1.125rem; font-weight: 600; color: #dc2626; }
		.footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280; line-height: 1.5; }
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
		body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background: #ffffff; }
		.container { max-width: 600px; margin: 0 auto; padding: 24px; }
		.header { background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); padding: 24px; border-radius: 8px; margin-bottom: 24px; border-left: 4px solid #dc2626; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); }
		.header h2 { margin: 0; font-size: 1.5rem; color: #dc2626; font-weight: 700; }
		.content { padding: 0 0 24px; }
		.content p { margin: 0 0 12px; color: #374151; }
		.total { font-size: 1.125rem; font-weight: 600; color: #dc2626; }
		.footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280; line-height: 1.5; }
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
	}): string {
		const overdueText = data.daysOverdue 
			? `<p><strong>Cette facture est en retard de ${data.daysOverdue} jour(s).</strong></p>`
			: '<p><strong>Cette facture est en attente de paiement.</strong></p>';
		
		return `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="UTF-8">
				<style>
					body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
					.container { max-width: 600px; margin: 0 auto; padding: 20px; }
					.header { background-color: #fff3cd; padding: 20px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #ffc107; }
					.content { padding: 20px 0; }
					.footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
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
	 * Formate un montant en devise
	 */
	private formatCurrency(amount: number): string {
		return new Intl.NumberFormat('fr-FR', {
			style: 'currency',
			currency: 'EUR'
		}).format(amount);
	}
}
