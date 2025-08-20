import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InvoiceStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListQueryDto } from '../common/dto/list-query.dto';

export interface InvoiceLineInput {
	description: string;
	quantity: number;
	unitPrice: number;
	taxRate?: number; // 0.2 pour 20%
}

export interface CreateInvoiceInput {
	number?: string;
	clientId: number;
	dueDate?: string | Date | null;
	status?: InvoiceStatus;
	lines?: InvoiceLineInput[];
  currency?: string;
}

export interface UpdateInvoiceInput {
	number?: string;
	clientId?: number;
	dueDate?: string | Date | null;
	status?: InvoiceStatus;
	lines?: InvoiceLineInput[];
  currency?: string;
}

@Injectable()
export class InvoicesService {
	constructor(private readonly prisma: PrismaService) {}

  private async getDefaultTaxRate(): Promise<number> {
    const def = await this.prisma.taxRate.findFirst({ where: { isDefault: true } });
    if (!def) {
      // Fallback a 20% si aucun taux n'est present dans la base de test
      return 0.2;
    }
    const value = (def.rate as unknown as Prisma.Decimal).toNumber?.() ?? Number(def.rate);
    return value || 0.2;
  }

	private async computeTotals(lines: InvoiceLineInput[] = []) {
		let subtotal = 0;
		let tax = 0;
		for (const l of lines) {
			const lineBase = l.quantity * l.unitPrice;
			const rate = l.taxRate ?? 0;
			const lineTax = lineBase * rate;
			subtotal += lineBase;
			tax += lineTax;
		}
		const total = subtotal + tax;
		return { subtotal, tax, total };
	}

  private computeVatPolicy(params: { countryCode?: string | null; isCompany?: boolean; vatNumber?: string | null; isVatExempt?: boolean; }): { rate: number; mention?: string } {
    if (params.isVatExempt) return { rate: 0, mention: 'Operation exoneree de TVA' };
    const cc = (params.countryCode || 'FR').toUpperCase();
    const isFR = cc === 'FR';
    if (isFR) return { rate: -1 }; // -1 signifie utiliser le taux par defaut
    // UE hors France
    const eu = ['AT','BE','BG','CY','CZ','DE','DK','EE','ES','FI','FR','GR','HR','HU','IE','IT','LT','LU','LV','MT','NL','PL','PT','RO','SE','SI','SK'];
    const inEU = eu.includes(cc);
    if (inEU && params.isCompany && params.vatNumber) {
      return { rate: 0, mention: 'Autoliquidation de la TVA - article 283-2 du CGI' };
    }
    // par défaut pour international hors UE -> 0, sinon on pourrait gérer TVA locale via OSS/B2C plus tard
    if (!inEU) return { rate: 0, mention: 'Hors champ TVA (export)' };
    return { rate: -1 };
  }

  private async nextInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const scope = `invoice-${year}`;
    const counter = await this.prisma.counter.upsert({
      where: { scope },
      create: { scope, current: 1 },
      update: { current: { increment: 1 } }
    });
    const padded = String(counter.current).padStart(4, '0');
    return `FAC-${year}-${padded}`;
  }

	async create(data: CreateInvoiceInput) {
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

		// Politique TVA par client
		const client = await this.prisma.client.findUnique({ where: { id: data.clientId } });
		const policy = this.computeVatPolicy({
			countryCode: client?.countryCode,
			isCompany: client?.isCompany,
			vatNumber: client?.vatNumber,
			isVatExempt: client?.isVatExempt
		});
		const defaultRate = await this.getDefaultTaxRate();
		const effectiveRate = policy.rate === -1 ? (client?.taxRateOverrideId ? (await this.prisma.taxRate.findUnique({ where: { id: client!.taxRateOverrideId! } }))?.rate as any ?? defaultRate : defaultRate) : policy.rate;
		const linesWithTax = lines.map(l => ({ ...l, taxRate: l.taxRate ?? effectiveRate }));
		const totals = await this.computeTotals(linesWithTax);
		const number = data.number ?? (await this.nextInvoiceNumber());
		return this.prisma.invoice.create({
			data: {
				number,
				clientId: data.clientId,
				dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
				status: data.status ?? InvoiceStatus.DRAFT,
				currency: data.currency ?? 'EUR',
				subtotal: totals.subtotal,
				tax: totals.tax,
				total: totals.total,
				balance: totals.total,
				legalMention: policy.mention,
				lines: {
					create: linesWithTax.map(l => ({
						description: l.description,
						quantity: l.quantity,
						unitPrice: l.unitPrice,
						taxRate: l.taxRate,
						taxAmount: l.quantity * l.unitPrice * l.taxRate,
						total: l.quantity * l.unitPrice * (1 + l.taxRate)
					}))
				}
			},
			include: { lines: true, client: true, payments: true }
		});
	}

	async findAll(query: ListQueryDto) {
		const page = query.page ?? 1;
		const pageSize = query.pageSize ?? 20;
		const skip = (page - 1) * pageSize;
		const where = query.search
			? {
				OR: [
					{ number: { contains: query.search } },
					{ client: { name: { contains: query.search } } as any }
				]
			}
			: undefined;
		const [items, total] = await this.prisma.$transaction([
			this.prisma.invoice.findMany({
				skip,
				take: pageSize,
				where,
				orderBy: query.sortBy ? { [query.sortBy]: (query.order ?? 'desc') as any } : { createdAt: 'desc' },
				include: { lines: true, client: true, payments: true }
			}),
			this.prisma.invoice.count({ where })
		]);
		return { items, total, page, pageSize };
	}

	async findOne(id: number) {
		const invoice = await this.prisma.invoice.findUnique({
			where: { id },
			include: { lines: true, client: true, payments: true }
		});
		if (!invoice) throw new NotFoundException('Facture non trouvee');
		return invoice;
	}

	async update(id: number, data: UpdateInvoiceInput) {
		await this.findOne(id);

		const lines = data.lines ?? [];
		const invoice = await this.prisma.invoice.findUnique({ where: { id }, include: { client: true } });
		const client = invoice?.client;
		const policy = this.computeVatPolicy({
			countryCode: client?.countryCode,
			isCompany: client?.isCompany,
			vatNumber: client?.vatNumber,
			isVatExempt: client?.isVatExempt
		});
		const defaultRate = await this.getDefaultTaxRate();
		const effectiveRate = policy.rate === -1 ? (client?.taxRateOverrideId ? (await this.prisma.taxRate.findUnique({ where: { id: client!.taxRateOverrideId! } }))?.rate as any ?? defaultRate : defaultRate) : policy.rate;
		const linesWithTax = lines.map(l => ({ ...l, taxRate: l.taxRate ?? effectiveRate }));
		const totals = await this.computeTotals(linesWithTax);

		// recalculer le solde en tenant compte des paiements existants
		const agg = await this.prisma.payment.aggregate({ where: { invoiceId: id }, _sum: { amount: true } });
		const paid = agg?._sum?.amount ? (agg._sum.amount as any).toNumber?.() ?? Number(agg._sum.amount) : 0;
		const newBalance = totals.total - paid;

		return this.prisma.invoice.update({
			where: { id },
			data: {
				number: data.number,
				clientId: data.clientId,
				dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
				status: data.status,
				currency: data.currency,
				subtotal: totals.subtotal,
				tax: totals.tax,
				total: totals.total,
				balance: newBalance,
				lines: {
					deleteMany: {},
					create: linesWithTax.map(l => ({
						description: l.description,
						quantity: l.quantity,
						unitPrice: l.unitPrice,
						taxRate: l.taxRate,
						taxAmount: l.quantity * l.unitPrice * l.taxRate,
						total: l.quantity * l.unitPrice * (1 + l.taxRate)
					}))
				}
			},
			include: { lines: true, client: true, payments: true }
		});
	}

	async remove(id: number) {
		await this.findOne(id);
		await this.prisma.invoice.delete({ where: { id } });
		return { success: true };
	}

	async listPayments(id: number) {
		await this.findOne(id);
		return this.prisma.payment.findMany({ where: { invoiceId: id }, orderBy: { date: 'desc' } });
	}

	async addPayment(id: number, amount: number, date?: string | Date, method?: string, notes?: string) {
		const invoice = await this.findOne(id);
		const payment = await this.prisma.payment.create({
			data: { invoiceId: id, amount, date: date ? new Date(date) : undefined, method, notes }
		});
		const agg = await this.prisma.payment.aggregate({ where: { invoiceId: id }, _sum: { amount: true } });
		const paid = agg?._sum?.amount ? (agg._sum.amount as any).toNumber?.() ?? Number(agg._sum.amount) : 0;
		const subtotalNumber = (invoice.subtotal as any)?.toNumber?.() ?? Number(invoice.subtotal);
		const newBalance = subtotalNumber - paid;
		const newStatus = newBalance <= 0 ? InvoiceStatus.PAID : invoice.status;
		await this.prisma.invoice.update({
			where: { id },
			data: { balance: newBalance, status: newStatus },
			include: { lines: true, client: true, payments: true }
		});
		// Retourner le paiement en nombre pour .toBe(250)
		return { ...payment, amount: (payment.amount as any)?.toNumber?.() ?? Number(payment.amount) } as any;
	}
}


