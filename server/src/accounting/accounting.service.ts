import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Service de comptabilité
 * 
 * Gère la comptabilité en partie double avec :
 * - Création et gestion des comptes (plan comptable)
 * - Création et gestion des journaux
 * - Écritures comptables équilibrées (débit = crédit)
 * - Export FEC (Fichier des Écritures Comptables) pour la DGFIP
 * - Balance des comptes
 * - Grand livre
 * - Écritures automatiques pour :
 *   - Ventes (411/706/44571)
 *   - Encaissements (512/411)
 *   - Achats (622/44566/401)
 *   - Paiements fournisseurs (401/512)
 *   - Paie (641/645/421/431)
 *   - Paiements salaires (421/512)
 *   - Paiements URSSAF (431/512)
 *   - Cotisations micro-social (645/431)
 *   - Contribution C3S (635/447)
 * 
 * @see AccountingController pour les endpoints API
 */
@Injectable()
export class AccountingService {
	constructor(private readonly prisma: PrismaService) {}

	/**
	 * Liste tous les comptes du plan comptable
	 * 
	 * @returns Liste des comptes triés par code
	 */
	async listAccounts() {
		return this.prisma.account.findMany({ orderBy: { code: 'asc' } });
	}

	/**
	 * Crée un nouveau compte comptable
	 * 
	 * @param input - Code, nom et type du compte
	 * @returns Compte créé
	 * @throws {BadRequestException} Si le code existe déjà
	 */
	async createAccount(input: { code: string; name: string; type: string }) {
		const existing = await this.prisma.account.findUnique({ where: { code: input.code } });
		if (existing) throw new BadRequestException('Code de compte déjà existant');
		return this.prisma.account.create({ data: { code: input.code, name: input.name, type: input.type as any } });
	}

	/**
	 * Crée ou met à jour un journal comptable
	 * 
	 * @param input - Code et nom du journal
	 * @returns Journal créé ou mis à jour
	 */
	async createJournal(input: { code: string; name: string }) {
		return this.prisma.journal.upsert({
			where: { code: input.code },
			create: input,
			update: { name: input.name }
		});
	}

	/**
	 * Poste une écriture comptable
	 * 
	 * L'écriture doit être équilibrée (total débit = total crédit).
	 * Crée automatiquement les comptes s'ils n'existent pas (avec les comptes par défaut).
	 * 
	 * @param input - Journal, date, référence, libellé et lignes (débit/crédit)
	 * @returns Écriture créée
	 * @throws {BadRequestException} Si écriture non équilibrée ou aucune ligne
	 * 
	 * @example
	 * ```typescript
	 * await accountingService.postEntry({
	 *   journalCode: 'VE',
	 *   reference: 'VENTE FAC-2024-0001',
	 *   lines: [
	 *     { accountCode: '411', debit: 1200 },
	 *     { accountCode: '706', credit: 1000 },
	 *     { accountCode: '44571', credit: 200 }
	 *   ]
	 * });
	 * ```
	 */
	async postEntry(input: {
		journalCode: string;
		date?: Date | string;
		reference?: string;
		memo?: string;
		lines: Array<{ accountCode: string; description?: string; debit?: number; credit?: number }>;
	}) {
		let journal = await this.prisma.journal.findUnique({ where: { code: input.journalCode } });
		if (!journal) {
			const nameMap: Record<string, string> = { VE: 'Ventes', BQ: 'Banque', OD: 'Opérations diverses' };
			journal = await this.prisma.journal.upsert({
				where: { code: input.journalCode },
				create: { code: input.journalCode, name: nameMap[input.journalCode] ?? input.journalCode },
				update: { name: nameMap[input.journalCode] ?? input.journalCode }
			});
		}

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
			let acc = await tx.account.findUnique({ where: { code: l.accountCode } });
			if (!acc) {
				const defaultAccountMeta: Record<string, { name: string; type: string }> = {
					'512': { name: 'Banque', type: 'BANK' },
					'706': { name: 'Prestations de services', type: 'REVENUE' },
					'707': { name: 'Ventes de marchandises', type: 'REVENUE' },
					'44571': { name: 'TVA collectée', type: 'TAX' },
					'44566': { name: 'TVA déductible', type: 'TAX' },
					'411': { name: 'Clients', type: 'CUSTOMER' },
					'401': { name: 'Fournisseurs', type: 'SUPPLIER' },
					'622': { name: 'Rémunérations et honoraires', type: 'EXPENSE' },
					'641': { name: 'Rémunérations du personnel', type: 'EXPENSE' },
					'645': { name: 'Charges sociales', type: 'EXPENSE' },
					'421': { name: 'Salaires à payer', type: 'LIABILITY' },
					'431': { name: 'URSSAF', type: 'LIABILITY' },
					'447': { name: 'Autres impôts et taxes à payer', type: 'LIABILITY' },
					'635': { name: 'Autres impôts et taxes', type: 'EXPENSE' }
				};
				const meta = defaultAccountMeta[l.accountCode];
				if (!meta) throw new BadRequestException(`Compte introuvable: ${l.accountCode}`);
				acc = await tx.account.create({ data: { code: l.accountCode, name: meta.name, type: meta.type as any } });
			}
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

	/**
	 * Exporte le FEC (Fichier des Écritures Comptables) pour la DGFIP
	 * 
	 * Format conforme à la norme FEC (arrêté du 29 juillet 2013).
	 * Format pipe-delimited (|) avec en-tête.
	 * 
	 * @param params - Dates de début et fin (optionnel)
	 * @returns Fichier FEC au format texte
	 * 
	 * @example
	 * ```typescript
	 * const fec = await accountingService.exportFEC({
	 *   start: '2024-01-01',
	 *   end: '2024-12-31'
	 * });
	 * // Sauvegarder dans un fichier .txt
	 * ```
	 */
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

	/**
	 * Calcule la balance des comptes
	 * 
	 * Pour chaque compte, calcule :
	 * - Total débit
	 * - Total crédit
	 * - Solde (débit - crédit)
	 * 
	 * @param params - Dates de début et fin (optionnel)
	 * @returns Balance triée par code de compte
	 */
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

	/**
	 * Récupère le grand livre
	 * 
	 * Pour chaque compte (ou un compte spécifique), liste toutes les écritures
	 * avec totaux débit/crédit.
	 * 
	 * @param params - Dates et code de compte optionnel
	 * @returns Grand livre trié par code de compte
	 * @throws {BadRequestException} Si le code de compte n'existe pas
	 */
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

	/**
	 * Poste l'écriture de vente d'une facture
	 * 
	 * Écriture : 411 (Clients) / 706 (Prestations) / 44571 (TVA collectée)
	 * 
	 * @param params - ID facture et codes de comptes optionnels
	 * @returns Écriture créée
	 * @throws {BadRequestException} Si facture introuvable
	 */
	// Vente: 411/706/44571
	async postInvoiceSale(params: { invoiceId: string; customerAccountCode?: string; revenueAccountCode?: string; vatCollectedAccountCode?: string }) {
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

	/**
	 * Poste l'écriture d'encaissement d'une facture
	 * 
	 * Écriture : 512 (Banque) / 411 (Clients)
	 * 
	 * @param params - ID facture, montant et codes de comptes optionnels
	 * @returns Écriture créée
	 * @throws {BadRequestException} Si facture introuvable
	 */
	// Encaissement: 512/411
	async postInvoicePayment(params: { invoiceId: string; amount: number; bankAccountCode?: string; customerAccountCode?: string }) {
		const invoice = await this.prisma.invoice.findUnique({ where: { id: params.invoiceId } });
		if (!invoice) throw new BadRequestException('Facture introuvable');
		const lines = [
			{ accountCode: params.bankAccountCode ?? '512', debit: params.amount },
			{ accountCode: params.customerAccountCode ?? '411', credit: params.amount }
		];
		return this.postEntry({ journalCode: 'BQ', reference: `PAIEMENT ${invoice.number}`, lines });
	}

	// Achat services: 622/44566/401
	async postServicePurchase(params: {
		reference?: string;
		amountExclTax: number;
		taxRate?: number; // ex: 0.2
		expenseAccountCode?: string; // défaut 622
		vatDeductibleAccountCode?: string; // défaut 44566
		vendorAccountCode?: string; // défaut 401
		journalCode?: string; // défaut OD
		date?: string | Date;
		memo?: string;
	}) {
		const rate = params.taxRate ?? 0.2;
		const base = Number(params.amountExclTax || 0);
		const vat = Number((base * rate).toFixed(2));
		const total = Number((base + vat).toFixed(2));
		const lines = [
			{ accountCode: params.expenseAccountCode ?? '622', description: params.memo, debit: base },
			{ accountCode: params.vatDeductibleAccountCode ?? '44566', description: 'TVA déductible', debit: vat },
			{ accountCode: params.vendorAccountCode ?? '401', description: 'Fournisseur', credit: total }
		];
		return this.postEntry({
			journalCode: params.journalCode ?? 'OD',
			date: params.date as any,
			reference: params.reference,
			memo: params.memo,
			lines
		});
	}

	// Paiement fournisseur: 401/512
	async postServicePayment(params: {
		amount: number;
		vendorAccountCode?: string; // défaut 401
		bankAccountCode?: string; // défaut 512
		reference?: string;
		date?: string | Date;
		memo?: string;
	}) {
		const lines = [
			{ accountCode: params.vendorAccountCode ?? '401', description: params.memo, debit: params.amount },
			{ accountCode: params.bankAccountCode ?? '512', description: 'Paiement', credit: params.amount }
		];
		return this.postEntry({
			journalCode: 'BQ',
			date: params.date as any,
			reference: params.reference,
			memo: params.memo,
			lines
		});
	}

	// Paie: 641 (débit) + 645 (débit) / 421 (crédit) + 431 (crédit)
	async postPayroll(params: {
		grossSalary: number; // salaire brut
		employeeContrib: number; // part salariale
		employerContrib: number; // part patronale
		journalCode?: string; // défaut OD
		date?: string | Date;
		reference?: string;
		memo?: string;
		salaryExpenseAccountCode?: string; // 641
		employerContribExpenseAccountCode?: string; // 645
		salaryPayableAccountCode?: string; // 421
		urssafLiabilityAccountCode?: string; // 431
	}) {
		const gross = Number(params.grossSalary || 0);
		const salPart = Number(params.employeeContrib || 0);
		const empPart = Number(params.employerContrib || 0);
		const net = Number((gross - salPart).toFixed(2));
		const urssafTotal = Number((salPart + empPart).toFixed(2));
		const lines = [
			{ accountCode: params.salaryExpenseAccountCode ?? '641', description: 'Salaire brut', debit: gross },
			{ accountCode: params.employerContribExpenseAccountCode ?? '645', description: 'Charges patronales', debit: empPart },
			{ accountCode: params.salaryPayableAccountCode ?? '421', description: 'Salaire net à payer', credit: net },
			{ accountCode: params.urssafLiabilityAccountCode ?? '431', description: 'URSSAF à payer', credit: urssafTotal }
		];
		return this.postEntry({
			journalCode: params.journalCode ?? 'OD',
			date: params.date as any,
			reference: params.reference,
			memo: params.memo ?? 'Écriture de paie',
			lines
		});
	}

	// Paiement salaires: 421/512
	async postSalaryPayment(params: { amount: number; bankAccountCode?: string; salaryPayableAccountCode?: string; date?: string | Date; reference?: string; memo?: string }) {
		const lines = [
			{ accountCode: params.salaryPayableAccountCode ?? '421', description: params.memo, debit: params.amount },
			{ accountCode: params.bankAccountCode ?? '512', description: 'Paiement salaires', credit: params.amount }
		];
		return this.postEntry({
			journalCode: 'BQ',
			date: params.date as any,
			reference: params.reference,
			memo: params.memo,
			lines
		});
	}

	// Paiement URSSAF: 431/512
	async postUrssafPayment(params: { amount: number; bankAccountCode?: string; urssafLiabilityAccountCode?: string; date?: string | Date; reference?: string; memo?: string }) {
		const lines = [
			{ accountCode: params.urssafLiabilityAccountCode ?? '431', description: params.memo ?? 'URSSAF', debit: params.amount },
			{ accountCode: params.bankAccountCode ?? '512', description: 'Paiement URSSAF', credit: params.amount }
		];
		return this.postEntry({
			journalCode: 'BQ',
			date: params.date as any,
			reference: params.reference,
			memo: params.memo,
			lines
		});
	}

	/**
	 * Poste l'écriture de cotisation micro-social (auto-entrepreneur)
	 * 
	 * Calcule la cotisation sur le CA de la période et crée l'écriture :
	 * 645 (Charges sociales) / 431 (URSSAF)
	 * 
	 * @param params - Période, taux et codes de comptes optionnels
	 * @returns Écriture créée
	 */
	// Micro-social (auto-entrepreneur): calcul d'une cotisation sur CA
	async postMicroSocialContribution(params: { periodStart: string; periodEnd: string; rate: number; expenseAccountCode?: string; liabilityAccountCode?: string; reference?: string; memo?: string }) {
		const start = new Date(params.periodStart);
		const end = new Date(params.periodEnd);
		const invoices = await this.prisma.invoice.findMany({ where: { date: { gte: start, lte: end } } });
		const ca = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
		const amount = Number((ca * params.rate).toFixed(2));
		const lines = [
			{ accountCode: params.expenseAccountCode ?? '645', description: params.memo ?? 'Micro-social', debit: amount },
			{ accountCode: params.liabilityAccountCode ?? '431', description: 'URSSAF', credit: amount }
		];
		return this.postEntry({ journalCode: 'OD', reference: params.reference ?? 'MICRO-SOCIAL', memo: params.memo, lines });
	}

	// C3S: contribution assise sur CA si seuil dépassé
	async postC3SContribution(params: { year: number; threshold: number; rate: number; expenseAccountCode?: string; liabilityAccountCode?: string; reference?: string; memo?: string }) {
		const start = new Date(params.year, 0, 1);
		const end = new Date(params.year, 11, 31, 23, 59, 59);
		const invoices = await this.prisma.invoice.findMany({ where: { date: { gte: start, lte: end } } });
		const ca = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
		if (ca < params.threshold) return { skipped: true, reason: 'threshold-not-met', ca } as any;
		const amount = Number((ca * params.rate).toFixed(2));
		const lines = [
			{ accountCode: params.expenseAccountCode ?? '635', description: params.memo ?? 'C3S', debit: amount },
			{ accountCode: params.liabilityAccountCode ?? '447', description: 'C3S à payer', credit: amount }
		];
		return this.postEntry({ journalCode: 'OD', reference: params.reference ?? `C3S-${params.year}`, memo: params.memo, lines });
	}
}


