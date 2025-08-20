import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccountingService {
	constructor(private readonly prisma: PrismaService) {}

	async listAccounts() {
		return this.prisma.account.findMany({ orderBy: { code: 'asc' } });
	}

	async createAccount(input: { code: string; name: string; type: string }) {
		const existing = await this.prisma.account.findUnique({ where: { code: input.code } });
		if (existing) throw new BadRequestException('Code de compte déjà existant');
		return this.prisma.account.create({ data: { code: input.code, name: input.name, type: input.type as any } });
	}

	async createJournal(input: { code: string; name: string }) {
		return this.prisma.journal.create({ data: input });
	}

	async postEntry(input: {
		journalCode: string;
		date?: Date | string;
		reference?: string;
		memo?: string;
		lines: Array<{ accountCode: string; description?: string; debit?: number; credit?: number }>;
	}) {
		const journal = await this.prisma.journal.findUnique({ where: { code: input.journalCode } });
		if (!journal) throw new BadRequestException('Journal introuvable');

		if (!input.lines?.length) throw new BadRequestException('Aucune ligne');
		let totalDebit = 0;
		let totalCredit = 0;
		for (const l of input.lines) {
			if (!l.debit && !l.credit) throw new BadRequestException('Débit ou crédit obligatoire');
			totalDebit += Number(l.debit || 0);
			totalCredit += Number(l.credit || 0);
		}
		if (Number(totalDebit.toFixed(2)) !== Number(totalCredit.toFixed(2))) {
			throw new BadRequestException('Écriture non équilibrée');
		}

		return this.prisma.$transaction(async tx => {
			const entry = await tx.journalEntry.create({
				data: {
					journalId: journal.id,
					date: input.date ? new Date(input.date) : undefined,
					reference: input.reference,
					memo: input.memo,
					status: 'POSTED',
					totalDebit: totalDebit as any,
					totalCredit: totalCredit as any
				}
			});

			for (const l of input.lines) {
				const acc = await tx.account.findUnique({ where: { code: l.accountCode } });
				if (!acc) throw new BadRequestException(`Compte introuvable: ${l.accountCode}`);
				await tx.journalLine.create({
					data: {
						entryId: entry.id,
						accountId: acc.id,
						description: l.description,
						debit: (l.debit || 0) as any,
						credit: (l.credit || 0) as any
					}
				});
			}
			return entry;
		});
	}

	// Poste une écriture de vente: 411/706/44571
	async postInvoiceSale(params: { invoiceId: number; customerAccountCode?: string; revenueAccountCode?: string; vatCollectedAccountCode?: string }) {
		const invoice = await this.prisma.invoice.findUnique({ where: { id: params.invoiceId } });
		if (!invoice) throw new BadRequestException('Facture introuvable');
		const subtotal = Number((invoice.subtotal as any)?.toNumber?.() ?? invoice.subtotal);
		const tax = Number((invoice.tax as any)?.toNumber?.() ?? invoice.tax);
		const total = Number((invoice.total as any)?.toNumber?.() ?? invoice.total);
		const journal = await this.prisma.journal.findUnique({ where: { code: 'VE' } });
		if (!journal) throw new BadRequestException('Journal VE manquant');
		const lines = [
			{ accountCode: params.customerAccountCode ?? '411', debit: total },
			{ accountCode: params.revenueAccountCode ?? '706', credit: subtotal },
			{ accountCode: params.vatCollectedAccountCode ?? '44571', credit: tax }
		];
		return this.postEntry({ journalCode: 'VE', reference: `VENTE ${invoice.number}`, lines });
	}

	// Poste un encaissement: 512/411
	async postInvoicePayment(params: { invoiceId: number; amount: number; bankAccountCode?: string; customerAccountCode?: string }) {
		const invoice = await this.prisma.invoice.findUnique({ where: { id: params.invoiceId } });
		if (!invoice) throw new BadRequestException('Facture introuvable');
		const lines = [
			{ accountCode: params.bankAccountCode ?? '512', debit: params.amount },
			{ accountCode: params.customerAccountCode ?? '411', credit: params.amount }
		];
		return this.postEntry({ journalCode: 'BQ', reference: `PAIEMENT ${invoice.number}`, lines });
	}
}


