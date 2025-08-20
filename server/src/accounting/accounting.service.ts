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

	private toDate(input?: string | Date): Date | undefined {
		if (!input) return undefined;
		return typeof input === 'string' ? new Date(input) : input;
	}

	private formatYyyyMmDd(d: Date): string {
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		return `${y}${m}${day}`;
	}

	private toNumber(n: any): number {
		if (n == null) return 0;
		return (n as any)?.toNumber?.() ?? Number(n);
	}

	async exportFEC(params: { start?: string; end?: string }): Promise<string> {
		const start = params.start ? new Date(params.start) : new Date('1970-01-01');
		const end = params.end ? new Date(params.end) : new Date('2999-12-31');
		const entries = await this.prisma.journalEntry.findMany({
			where: { date: { gte: start, lte: end }, status: 'POSTED' },
			include: { journal: true, lines: { include: { account: true } } },
			orderBy: [{ date: 'asc' }, { id: 'asc' }]
		});
		const header = [
			'JournalCode',
			'JournalLib',
			'EcritureNum',
			'EcritureDate',
			'CompteNum',
			'CompteLib',
			'PieceRef',
			'PieceDate',
			'EcritureLib',
			'Debit',
			'Credit',
			'EcritureLet',
			'DateLet',
			'ValidDate',
			'Montantdevise',
			'Idevise'
		].join('|');
		const lines: string[] = [header];
		for (const e of entries) {
			for (const l of e.lines) {
				const row = [
					e.journal.code,
					e.journal.name,
					String(e.id),
					this.formatYyyyMmDd(new Date(e.date)),
					l.account.code,
					l.account.name,
					e.reference ?? '',
					e.date ? this.formatYyyyMmDd(new Date(e.date)) : '',
					l.description ?? e.memo ?? '',
					this.toNumber(l.debit).toFixed(2),
					this.toNumber(l.credit).toFixed(2),
					'',
					'',
					this.formatYyyyMmDd(new Date(e.date)),
					'',
					''
				].join('|');
				lines.push(row);
			}
		}
		return lines.join('\n');
	}

	async getTrialBalance(params: { start?: string; end?: string }) {
		const start = params.start ? new Date(params.start) : new Date('1970-01-01');
		const end = params.end ? new Date(params.end) : new Date('2999-12-31');
		const grouped = await this.prisma.journalLine.groupBy({
			by: ['accountId'],
			where: { entry: { date: { gte: start, lte: end }, status: 'POSTED' } },
			_sum: { debit: true, credit: true }
		});
		const accountIds = grouped.map(g => g.accountId);
		const accounts = await this.prisma.account.findMany({ where: { id: { in: accountIds } } });
		return grouped
			.map(g => {
				const acc = accounts.find(a => a.id === g.accountId)!;
				const debit = this.toNumber(g._sum.debit);
				const credit = this.toNumber(g._sum.credit);
				return {
					accountCode: acc.code,
					accountName: acc.name,
					debit,
					credit,
					balance: Number((debit - credit).toFixed(2))
				};
			})
			.sort((a, b) => a.accountCode.localeCompare(b.accountCode));
	}

	async getGeneralLedger(params: { start?: string; end?: string; accountCode?: string }) {
		const start = params.start ? new Date(params.start) : new Date('1970-01-01');
		const end = params.end ? new Date(params.end) : new Date('2999-12-31');
		let accountFilter: any = {};
		if (params.accountCode) {
			const acc = await this.prisma.account.findFirst({ where: { code: params.accountCode } });
			if (!acc) throw new BadRequestException('Compte introuvable');
			accountFilter = { accountId: acc.id };
		}
		const lines = await this.prisma.journalLine.findMany({
			where: { ...accountFilter, entry: { date: { gte: start, lte: end }, status: 'POSTED' } },
			include: { account: true, entry: { include: { journal: true } } },
			orderBy: [{ entry: { date: 'asc' } }, { id: 'asc' }]
		});
		const ledger: Record<string, any> = {};
		for (const l of lines) {
			const code = l.account.code;
			if (!ledger[code]) ledger[code] = { accountCode: code, accountName: l.account.name, lines: [], totalDebit: 0, totalCredit: 0 };
			const debit = this.toNumber(l.debit);
			const credit = this.toNumber(l.credit);
			ledger[code].lines.push({
				date: l.entry.date,
				journalCode: l.entry.journal.code,
				reference: l.entry.reference,
				memo: l.description ?? l.entry.memo,
				debit,
				credit
			});
			ledger[code].totalDebit += debit;
			ledger[code].totalCredit += credit;
		}
		return Object.values(ledger).sort((a: any, b: any) => a.accountCode.localeCompare(b.accountCode));
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


