import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
	private transporter: Transporter;

	constructor() {
		if (process.env.NODE_ENV === 'test') {
			this.transporter = nodemailer.createTransport({ jsonTransport: true }) as Transporter;
		} else {
			this.transporter = nodemailer.createTransport({
				host: process.env.SMTP_HOST || 'localhost',
				port: Number(process.env.SMTP_PORT || 1025),
				secure: false,
				auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || '' } : undefined
			}) as Transporter;
		}
	}

	async send(options: { to: string; subject: string; html?: string; text?: string; attachments?: { filename: string; content: Buffer; contentType?: string }[] }) {
		const from = process.env.MAIL_FROM || 'no-reply@example.com';
		await this.transporter.sendMail({ from, ...options });
	}
}
