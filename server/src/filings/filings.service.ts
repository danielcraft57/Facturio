import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AuthorityType, FilingStatus, FilingType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateFilingDto {
	type: string;
	authority?: string;
	period?: string; // Format: "2024-Q1", "2024-Q2", etc.
	periodStart?: string | Date;
	periodEnd?: string | Date;
	dueDate?: string | Date;
	notes?: string;
}

export interface UpdateFilingDto {
	status?: FilingStatus;
	notes?: string;
}

@Injectable()
export class FilingsService {
	constructor(private readonly prisma: PrismaService) {}

	create(data: CreateFilingDto) {
		// Parser la période si elle est fournie
		let periodStart: Date;
		let periodEnd: Date;
		let dueDate: Date;

		if (data.period) {
			// Format: "2024-Q1", "2024-Q2", etc.
			const match = data.period.match(/^(\d{4})-Q(\d)$/);
			if (!match) {
				throw new BadRequestException('Format de période invalide. Utilisez YYYY-QN (ex: 2024-Q1)');
			}
			
			const year = parseInt(match[1]);
			const quarter = parseInt(match[2]);
			
			if (quarter < 1 || quarter > 4) {
				throw new BadRequestException('Trimestre invalide. Doit être entre 1 et 4.');
			}
			
			// Calculer les dates du trimestre
			const monthStart = (quarter - 1) * 3;
			periodStart = new Date(year, monthStart, 1);
			periodEnd = new Date(year, monthStart + 3, 0); // Dernier jour du mois
			
			// Date d'échéance : fin du mois suivant la fin du trimestre
			dueDate = new Date(year, monthStart + 3, 0);
		} else {
			// Utiliser les dates fournies directement
			if (!data.periodStart || !data.periodEnd || !data.dueDate) {
				throw new BadRequestException('Les dates periodStart, periodEnd et dueDate sont requises si period n\'est pas fourni');
			}
			periodStart = new Date(data.periodStart);
			periodEnd = new Date(data.periodEnd);
			dueDate = new Date(data.dueDate);
		}

		let typeValue: any = data.type ?? 'VAT_CA3';
		if (typeValue === 'VAT') typeValue = 'VAT_CA3';
		const authorityValue: any = (data.authority as any) ?? 'DGFIP';
		return this.prisma.filing.create({
			data: {
				type: typeValue,
				authority: authorityValue,
				periodStart,
				periodEnd,
				dueDate,
				notes: data.notes,
				// Garder une trace lisible de la periode
				// Prisma schema n'a pas de champ period string, mais les tests attendent filing.period
				// On peut ajouter un champ calculé via select custom dans le controller, ou renvoyer ici une valeur additionnelle.
			}
		});
	}

	findAll() {
		return this.prisma.filing.findMany({ orderBy: { createdAt: 'desc' }, include: { lines: true, payments: true } });
	}

	async findOne(id: number) {
		const f = await this.prisma.filing.findUnique({ where: { id }, include: { lines: true, payments: true } });
		if (!f) throw new NotFoundException('Declaration introuvable');
		return f;
	}

	update(id: number, data: UpdateFilingDto) {
		return this.prisma.filing.update({ where: { id }, data });
	}

	async remove(id: number) {
		await this.findOne(id);
		await this.prisma.filing.delete({ where: { id } });
		return { success: true };
	}

	// Calcul CA3/CA12 simplifie a partir des factures de la periode
	async calculateVatReturn(id: number) {
		const filing = await this.findOne(id);
		if (!(filing.type === 'VAT_CA3' || filing.type === 'VAT_CA12')) {
			throw new NotFoundException('Type de declaration non TVA');
		}
		const start = new Date(filing.periodStart);
		const end = new Date(filing.periodEnd);
		const invoices = await this.prisma.invoice.findMany({ include: { lines: true, client: true } });
		let taxableBase = 0;
		let taxAmount = 0;
		for (const inv of invoices) {
			// on suppose toutes les factures taxables FR pour v1
			taxableBase += (inv.subtotal as unknown as Prisma.Decimal)?.toNumber?.() ?? Number(inv.subtotal);
			taxAmount += (inv.tax as unknown as Prisma.Decimal)?.toNumber?.() ?? Number(inv.tax);
		}
		const amountDue = taxAmount; // simplifie: pas de credit reporté ni acomptes
		await this.prisma.filing.update({
			where: { id },
			data: {
				status: 'CALCULATED' as FilingStatus,
				lines: { deleteMany: {}, create: [{ taxRate: 0 as any, taxableBase, taxAmount }] },
				amountDue
			}
		});
		const updated = await this.findOne(id);
		return {
			...updated,
			vatAmount: (updated.amountDue as any)?.toNumber?.() ?? Number(updated.amountDue),
			invoiceCount: invoices.length,
			totalAmount: taxableBase
		} as any;
	}

	async addAuthorityPayment(id: number, amount: number, date?: string | Date, reference?: string, notes?: string) {
		await this.findOne(id);
		if (amount < 0) throw new BadRequestException('Montant invalide');
		const created = await this.prisma.authorityPayment.create({
			data: {
				filingId: id,
				authority: 'DGFIP',
				amount,
				date: date ? new Date(date) : undefined,
				reference,
				notes
			}
		});
		const agg = await this.prisma.authorityPayment.aggregate({ where: { filingId: id }, _sum: { amount: true } });
		const paid = agg?._sum?.amount ? (agg._sum.amount as any).toNumber?.() ?? Number(agg._sum.amount) : 0;
		const filing = await this.findOne(id);
		const newStatus: FilingStatus = paid >= ((filing.amountDue as any as number) ?? 0) ? 'PAID' as FilingStatus : filing.status as FilingStatus;
		await this.prisma.filing.update({ where: { id }, data: { amountPaid: paid, status: newStatus } });
		return { ...created, amount: (created.amount as any)?.toNumber?.() ?? Number(created.amount) } as any;
	}
}


