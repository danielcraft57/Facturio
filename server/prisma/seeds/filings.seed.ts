import { PrismaClient, FilingStatus } from '@prisma/client';
import type { SeedContext } from './base.seed';

function quarterFromDate(d: Date): { periodStart: Date; periodEnd: Date; dueDate: Date; label: string } {
	const y = d.getFullYear();
	const q = Math.floor(d.getMonth() / 3) + 1;
	const monthStart = (q - 1) * 3;
	const periodStart = new Date(y, monthStart, 1);
	const periodEnd = new Date(y, monthStart + 3, 0);
	const dueDate = new Date(y, monthStart + 3, 15); // 15 jours après la fin du trimestre
	return { periodStart, periodEnd, dueDate, label: `${y}-Q${q}` };
}

export async function seedFilings(prisma: PrismaClient): Promise<void> {
	const now = new Date();
	const currentYear = now.getFullYear();

	// CA3 Q1 (déjà payé)
	const q1 = quarterFromDate(new Date(currentYear, 0, 15));
	const invoicesQ1 = await prisma.invoice.findMany({
		where: {
			date: { gte: q1.periodStart, lte: q1.periodEnd },
			status: { in: ['PAID', 'SENT'] }
		}
	});
	const taxableBaseQ1 = invoicesQ1.reduce((acc, i) => acc + Number(i.subtotal), 0);
	const taxAmountQ1 = invoicesQ1.reduce((acc, i) => acc + Number(i.tax), 0);

	const filingQ1 = await prisma.filing.create({
		data: {
			type: 'VAT_CA3',
			authority: 'DGFIP',
			periodStart: q1.periodStart,
			periodEnd: q1.periodEnd,
			dueDate: q1.dueDate,
			status: FilingStatus.PAID,
			amountDue: taxAmountQ1,
			amountPaid: taxAmountQ1,
			lines: {
				create: [
					{ taxRate: 0.2, taxableBase: taxableBaseQ1, taxAmount: taxAmountQ1 },
					{ taxRate: 0.1, taxableBase: 0, taxAmount: 0 },
					{ taxRate: 0, taxableBase: 0, taxAmount: 0 }
				]
			}
		}
	});
	await prisma.authorityPayment.create({
		data: { filingId: filingQ1.id, authority: 'DGFIP', amount: taxAmountQ1, date: q1.dueDate, reference: `CA3-${currentYear}-Q1` } as any
	});

	// CA3 Q2 (calculé, pas encore payé)
	const q2 = quarterFromDate(new Date(currentYear, 3, 15));
	const invoicesQ2 = await prisma.invoice.findMany({
		where: {
			date: { gte: q2.periodStart, lte: q2.periodEnd },
			status: { in: ['PAID', 'SENT'] }
		}
	});
	const taxableBaseQ2 = invoicesQ2.reduce((acc, i) => acc + Number(i.subtotal), 0);
	const taxAmountQ2 = invoicesQ2.reduce((acc, i) => acc + Number(i.tax), 0);

	await prisma.filing.create({
		data: {
			type: 'VAT_CA3',
			authority: 'DGFIP',
			periodStart: q2.periodStart,
			periodEnd: q2.periodEnd,
			dueDate: q2.dueDate,
			status: FilingStatus.CALCULATED,
			amountDue: taxAmountQ2,
			lines: {
				create: [
					{ taxRate: 0.2, taxableBase: taxableBaseQ2, taxAmount: taxAmountQ2 },
					{ taxRate: 0.1, taxableBase: 0, taxAmount: 0 },
					{ taxRate: 0, taxableBase: 0, taxAmount: 0 }
				]
			}
		}
	});

	// URSSAF mensuel (déjà payé)
	const lastMonth = new Date(currentYear, now.getMonth() - 1, 1);
	const lastMonthEnd = new Date(currentYear, now.getMonth(), 0);
	await prisma.filing.create({
		data: {
			type: 'URSSAF_MONTHLY',
			authority: 'URSSAF',
			periodStart: lastMonth,
			periodEnd: lastMonthEnd,
			dueDate: new Date(currentYear, now.getMonth(), 5),
			status: FilingStatus.PAID,
			amountDue: 2500,
			amountPaid: 2500,
			notes: 'Cotisations sociales mensuelles',
			lines: {
				create: [
					{ taxRate: 0, taxableBase: 10000, taxAmount: 2500 }
				]
			}
		}
	});
}

