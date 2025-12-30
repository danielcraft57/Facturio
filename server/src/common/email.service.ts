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

	/**
	 * Envoie un email générique
	 */
	async send(options: { 
		to: string; 
		subject: string; 
		html?: string; 
		text?: string; 
		attachments?: { filename: string; content: Buffer; contentType?: string }[] 
	}): Promise<void> {
		try {
			const from = `${this.fromName} <${this.fromEmail}>`;
			await this.transporter.sendMail({ from, ...options });
			this.logger.log(`Email envoyé à ${options.to}: ${options.subject}`);
		} catch (error) {
			this.logger.error(`Erreur envoi email à ${options.to}`, error);
			throw error;
		}
	}

	/**
	 * Envoie un email de facture avec PDF en pièce jointe
	 */
	async sendInvoice(options: {
		to: string;
		invoiceNumber: string;
		invoiceDate: Date | string;
		clientName: string;
		total: number;
		pdfBuffer: Buffer;
	}): Promise<void> {
		const subject = `Facture ${options.invoiceNumber}`;
		const html = this.getInvoiceTemplate({
			invoiceNumber: options.invoiceNumber,
			invoiceDate: options.invoiceDate,
			clientName: options.clientName,
			total: options.total
		});

		await this.send({
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
	 * Envoie un email de devis avec PDF en pièce jointe
	 */
	async sendQuote(options: {
		to: string;
		quoteNumber: string;
		quoteDate: Date | string;
		clientName: string;
		total: number;
		expiryDate?: Date | string;
		pdfBuffer: Buffer;
	}): Promise<void> {
		const subject = `Devis ${options.quoteNumber}`;
		const html = this.getQuoteTemplate({
			quoteNumber: options.quoteNumber,
			quoteDate: options.quoteDate,
			clientName: options.clientName,
			total: options.total,
			expiryDate: options.expiryDate
		});

		await this.send({
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
	 * Template HTML pour facture
	 */
	private getInvoiceTemplate(data: {
		invoiceNumber: string;
		invoiceDate: Date | string;
		clientName: string;
		total: number;
	}): string {
		return `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="UTF-8">
				<style>
					body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
					.container { max-width: 600px; margin: 0 auto; padding: 20px; }
					.header { background-color: #f4f4f4; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
					.content { padding: 20px 0; }
					.footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
					.button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
				</style>
			</head>
			<body>
				<div class="container">
					<div class="header">
						<h2>Facture ${data.invoiceNumber}</h2>
					</div>
					<div class="content">
						<p>Bonjour ${data.clientName},</p>
						<p>Veuillez trouver ci-joint la facture <strong>${data.invoiceNumber}</strong> du ${new Date(data.invoiceDate).toLocaleDateString('fr-FR')}.</p>
						<p><strong>Montant total : ${this.formatCurrency(data.total)}</strong></p>
						<p>Merci de régler cette facture dans les délais convenus.</p>
					</div>
					<div class="footer">
						<p>Cet email a été envoyé automatiquement par Facturio.</p>
						<p>Pour toute question, veuillez nous contacter.</p>
					</div>
				</div>
			</body>
			</html>
		`;
	}

	/**
	 * Template HTML pour devis
	 */
	private getQuoteTemplate(data: {
		quoteNumber: string;
		quoteDate: Date | string;
		clientName: string;
		total: number;
		expiryDate?: Date | string;
	}): string {
		const expiryText = data.expiryDate 
			? `<p><strong>Valable jusqu'au ${new Date(data.expiryDate).toLocaleDateString('fr-FR')}</strong></p>`
			: '';
		
		return `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="UTF-8">
				<style>
					body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
					.container { max-width: 600px; margin: 0 auto; padding: 20px; }
					.header { background-color: #f4f4f4; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
					.content { padding: 20px 0; }
					.footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
				</style>
			</head>
			<body>
				<div class="container">
					<div class="header">
						<h2>Devis ${data.quoteNumber}</h2>
					</div>
					<div class="content">
						<p>Bonjour ${data.clientName},</p>
						<p>Veuillez trouver ci-joint le devis <strong>${data.quoteNumber}</strong> du ${new Date(data.quoteDate).toLocaleDateString('fr-FR')}.</p>
						${expiryText}
						<p><strong>Montant total : ${this.formatCurrency(data.total)}</strong></p>
						<p>Nous restons à votre disposition pour toute question.</p>
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
