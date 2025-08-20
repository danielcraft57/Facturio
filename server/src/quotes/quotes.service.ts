import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuoteStatus } from '@prisma/client';
import { randomBytes } from 'crypto';
import * as crypto from 'crypto';

export interface QuoteLineDto {
	description: string;
	quantity: number;
	unitPrice: number;
	taxRate?: number;
}

export interface CreateQuoteDto {
	number?: string;
	clientId: number;
	expiryDate?: string | Date | null;
	status?: QuoteStatus;
	lines?: QuoteLineDto[];
}

export interface UpdateQuoteDto {
	number?: string;
	clientId?: number;
	expiryDate?: string | Date | null;
	status?: QuoteStatus;
	lines?: QuoteLineDto[];
}

@Injectable()
export class QuotesService {
	constructor(private readonly prisma: PrismaService) {}

	private computeTotals(lines: QuoteLineDto[] = []) {
		let subtotal = 0;
		let tax = 0;
		for (const l of lines) {
			const base = l.quantity * l.unitPrice;
			const rate = l.taxRate ?? 0;
			subtotal += base;
			tax += base * rate;
		}
		return { subtotal, tax, total: subtotal + tax };
	}

	private async nextQuoteNumber(): Promise<string> {
		const year = new Date().getFullYear();
		const scope = `quote-${year}`;
		const counter = await this.prisma.counter.upsert({
			where: { scope },
			create: { scope, current: 1 },
			update: { current: { increment: 1 } }
		});
		const padded = String(counter.current).padStart(4, '0');
		return `DEV-${year}-${padded}`;
	}

	async create(data: CreateQuoteDto) {
		// Validation
		if (!data.clientId) {
			throw new BadRequestException('Client requis');
		}
		const lines = data.lines ?? [];
		if (lines.length === 0) {
			throw new BadRequestException('Au moins une ligne est requise');
		}
		for (const l of lines) {
			if (l.quantity <= 0) throw new BadRequestException('Quantite invalide');
			if (l.unitPrice < 0) throw new BadRequestException('Prix unitaire invalide');
		}
		const totals = this.computeTotals(lines);
		const number = data.number ?? (await this.nextQuoteNumber());
		return this.prisma.quote.create({
			data: {
				number,
				clientId: data.clientId,
				expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
				status: data.status ?? QuoteStatus.DRAFT,
				subtotal: totals.subtotal,
				tax: totals.tax,
				total: totals.total,
				lines: {
					create: lines.map(l => ({
						description: l.description,
						quantity: l.quantity,
						unitPrice: l.unitPrice,
						taxRate: l.taxRate ?? 0,
						taxAmount: l.quantity * l.unitPrice * (l.taxRate ?? 0),
						total: l.quantity * l.unitPrice * (1 + (l.taxRate ?? 0))
					}))
				}
			},
			include: { lines: true, client: true }
		});
	}

	findAll() {
		return this.prisma.quote.findMany({ orderBy: { createdAt: 'desc' }, include: { lines: true, client: true } });
	}

	async findOne(id: number) {
		const quote = await this.prisma.quote.findUnique({ where: { id }, include: { lines: true, client: true } });
		if (!quote) throw new NotFoundException('Devis non trouve');
		return quote;
	}

	async update(id: number, data: UpdateQuoteDto) {
		await this.findOne(id);
		const lines = data.lines ?? [];
		const totals = this.computeTotals(lines);
		return this.prisma.quote.update({
			where: { id },
			data: {
				number: data.number,
				clientId: data.clientId,
				expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
				status: data.status,
				subtotal: totals.subtotal,
				tax: totals.tax,
				total: totals.total,
				lines: {
					deleteMany: {},
					create: lines.map(l => ({
						description: l.description,
						quantity: l.quantity,
						unitPrice: l.unitPrice,
						taxRate: l.taxRate ?? 0,
						taxAmount: l.quantity * l.unitPrice * (l.taxRate ?? 0),
						total: l.quantity * l.unitPrice * (1 + (l.taxRate ?? 0))
					}))
				}
			},
			include: { lines: true, client: true }
		});
	}

	async remove(id: number) {
		await this.findOne(id);
		await this.prisma.quote.delete({ where: { id } });
		return { success: true };
	}

	private ensureToken(): string {
		return randomBytes(24).toString('hex');
	}

	async send(id: number) {
		const quote = await this.findOne(id);
		const token = quote.publicToken ?? this.ensureToken();
		const updated = await this.prisma.quote.update({
			where: { id },
			data: { publicToken: token, status: QuoteStatus.SENT, sentAt: new Date() }
		});
		await this.prisma.emailEvent.create({ data: { quoteId: id, type: 'sent' } });
		return { ok: true, publicUrl: `/public/quotes/${token}` };
	}

	async publicView(token: string, ip?: string, userAgent?: string) {
		const quote = await this.prisma.quote.findUnique({ where: { publicToken: token } });
		if (!quote) throw new NotFoundException('Devis introuvable');
		await this.prisma.quoteView.create({ data: { quoteId: quote.id, ip: ip || null, userAgent: userAgent || null } });
		// Retourner l'objet pour coller aux attentes e2e
		return { id: quote.id, number: quote.number, status: quote.status, clientId: quote.clientId } as any;
	}

	async publicAccept(token: string, ip?: string) {
		const quote = await this.prisma.quote.findUnique({ where: { publicToken: token } });
		if (!quote) throw new NotFoundException('Devis introuvable');
		const updated = await this.prisma.quote.update({ where: { id: quote.id }, data: { status: QuoteStatus.ACCEPTED, acceptedAt: new Date(), acceptedIp: ip || null } });
		return { status: 'accepted', id: updated.id } as any;
	}

	async publicReject(token: string) {
		const quote = await this.prisma.quote.findUnique({ where: { publicToken: token } });
		if (!quote) throw new NotFoundException('Devis introuvable');
		await this.prisma.quote.update({ where: { id: quote.id }, data: { status: QuoteStatus.REJECTED } });
		return { ok: true };
	}

	async sendQuote(id: number) {
		const quote = await this.findOne(id);
		if (!quote) throw new NotFoundException('Quote not found');

		const publicToken = crypto.randomBytes(32).toString('hex');
		const publicUrl = `${process.env.PUBLIC_APP_URL || 'http://localhost:3000'}/public/quotes/${publicToken}`;

		const updated = await this.prisma.quote.update({
			where: { id },
			data: {
				status: 'SENT',
				sentAt: new Date(),
				publicToken
			},
			include: { client: true, lines: true }
		});

		return { ...updated, publicUrl };
	}
}


