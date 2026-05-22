import { PrismaClient, InvoiceStatus } from '@prisma/client';
import { daysFromNow, documentFolderFields } from './document-folder.seed';

function getYear(): number {
	return new Date().getFullYear();
}

function computeTotals(lines: Array<{ quantity: number; unitPrice: number; taxRate: number }>) {
	let subtotal = 0;
	let tax = 0;
	for (const l of lines) {
		const base = l.quantity * l.unitPrice;
		subtotal += base;
		tax += base * l.taxRate;
	}
	return { subtotal, tax, total: subtotal + tax };
}

export async function seedInvoices(prisma: PrismaClient, clients: any[], products: any): Promise<void> {
	const year = getYear();
	let invoiceCounter = 1;

	// Facture 1: FR B2B (20%) - Payée
	const inv1Lines = [
		{ description: 'Facturio Pro - Abonnement mensuel', quantity: 1, unitPrice: 49, taxRate: 0.2 },
		{ description: 'Support premium', quantity: 2, unitPrice: 99, taxRate: 0.2 }
	];
	const t1 = computeTotals(inv1Lines);
	const inv1Number = `FAC-${year}-${String(invoiceCounter++).padStart(4, '0')}`;
	const inv1Mb = documentFolderFields({
		starred: true,
		seenAt: new Date(year, 0, 16),
		sentAt: new Date(year, 0, 15),
		tags: ['vip', 'comptabilité'],
	});
	const inv1 = await prisma.invoice.upsert({
		where: { number: inv1Number },
		update: inv1Mb,
		create: {
			number: inv1Number,
			clientId: clients[0].id, // ACME France
			status: InvoiceStatus.PAID,
			date: new Date(year, 0, 15),
			dueDate: new Date(year, 1, 15),
			subtotal: t1.subtotal,
			tax: t1.tax,
			total: t1.total,
			balance: 0,
			currency: 'EUR',
			...inv1Mb,
			lines: {
				create: inv1Lines.map(l => ({
					...l,
					taxAmount: l.quantity * l.unitPrice * l.taxRate,
					total: l.quantity * l.unitPrice * (1 + l.taxRate)
				}))
			}
		}
	});
	
	const existingPayment1 = await prisma.payment.findFirst({ where: { invoiceId: inv1.id } });
	if (!existingPayment1) {
		await prisma.payment.create({
			data: { invoiceId: inv1.id, amount: t1.total, method: 'bank_transfer', date: new Date(year, 0, 20) }
		});
	}

	// Facture 2: EU B2B (0% - autoliquidation)
	const inv2Lines = [{ description: 'Consulting stratégie', quantity: 10, unitPrice: 200, taxRate: 0 }];
	const t2 = computeTotals(inv2Lines);
	const inv2Number = `FAC-${year}-${String(invoiceCounter++).padStart(4, '0')}`;
	const inv2Mb = documentFolderFields({
		important: true,
		seenAt: new Date(year, 1, 12),
		sentAt: new Date(year, 1, 10),
		tags: ['relance'],
	});
	await prisma.invoice.upsert({
		where: { number: inv2Number },
		update: inv2Mb,
		create: {
			number: inv2Number,
			clientId: clients[1].id, // EU GmbH
			status: InvoiceStatus.SENT,
			date: new Date(year, 1, 10),
			dueDate: new Date(year, 2, 10),
			subtotal: t2.subtotal,
			tax: t2.tax,
			total: t2.total,
			balance: t2.total,
			currency: 'EUR',
			legalMention: 'Autoliquidation de la TVA - article 283-2 du CGI',
			...inv2Mb,
			lines: {
				create: inv2Lines.map(l => ({
					...l,
					taxAmount: 0,
					total: l.quantity * l.unitPrice
				}))
			}
		}
	});

	// Facture 3: Export US (0%)
	const inv3Lines = [{ description: 'Application mobile iOS', quantity: 1, unitPrice: 5000, taxRate: 0 }];
	const t3 = computeTotals(inv3Lines);
	const inv3Number = `FAC-${year}-${String(invoiceCounter++).padStart(4, '0')}`;
	const inv3Mb = documentFolderFields({ seenAt: null, tags: [] });
	await prisma.invoice.upsert({
		where: { number: inv3Number },
		update: inv3Mb,
		create: {
			number: inv3Number,
			clientId: clients[2].id, // US Corp
			status: InvoiceStatus.DRAFT,
			date: new Date(year, 1, 20),
			...inv3Mb,
			subtotal: t3.subtotal,
			tax: t3.tax,
			total: t3.total,
			balance: t3.total,
			currency: 'USD',
			legalMention: 'Hors champ TVA (export)',
			lines: {
				create: inv3Lines.map(l => ({
					...l,
					taxAmount: 0,
					total: l.quantity * l.unitPrice
				}))
			}
		}
	});

	// Facture 4: B2C FR (10%)
	const inv4Lines = [
		{ description: 'Formation sur site', quantity: 1, unitPrice: 800, taxRate: 0.1 },
		{ description: 'Support premium', quantity: 1, unitPrice: 99, taxRate: 0.2 }
	];
	const t4 = computeTotals(inv4Lines);
	const inv4Number = `FAC-${year}-${String(invoiceCounter++).padStart(4, '0')}`;
	const inv4Mb = documentFolderFields({
		seenAt: null,
		sentAt: new Date(year, 2, 5),
		tags: ['e-commerce'],
	});
	await prisma.invoice.upsert({
		where: { number: inv4Number },
		update: inv4Mb,
		create: {
			number: inv4Number,
			clientId: clients[3].id, // Jean Client
			status: InvoiceStatus.SENT,
			date: new Date(year, 2, 5),
			dueDate: new Date(year, 3, 5),
			...inv4Mb,
			subtotal: t4.subtotal,
			tax: t4.tax,
			total: t4.total,
			balance: t4.total,
			currency: 'EUR',
			lines: {
				create: inv4Lines.map(l => ({
					...l,
					taxAmount: l.quantity * l.unitPrice * l.taxRate,
					total: l.quantity * l.unitPrice * (1 + l.taxRate)
				}))
			}
		}
	});

	// Facture 5: Exempt (0%)
	const inv5Lines = [{ description: 'Audit fiscal', quantity: 1, unitPrice: 150, taxRate: 0 }];
	const t5 = computeTotals(inv5Lines);
	const inv5Number = `FAC-${year}-${String(invoiceCounter++).padStart(4, '0')}`;
	const inv5Mb = documentFolderFields({
		seenAt: new Date(year, 2, 16),
		sentAt: new Date(year, 2, 15),
	});
	await prisma.invoice.upsert({
		where: { number: inv5Number },
		update: inv5Mb,
		create: {
			number: inv5Number,
			clientId: clients[4].id, // Exempt SARL
			status: InvoiceStatus.PAID,
			date: new Date(year, 2, 15),
			...inv5Mb,
			subtotal: t5.subtotal,
			tax: t5.tax,
			total: t5.total,
			balance: 0,
			currency: 'EUR',
			legalMention: 'Operation exoneree de TVA',
			lines: {
				create: inv5Lines.map(l => ({
					...l,
					taxAmount: 0,
					total: l.quantity * l.unitPrice
				}))
			}
		}
	});

	// Facture 6: En retard
	const inv6Lines = [{ description: 'Maintenance annuelle', quantity: 1, unitPrice: 1200, taxRate: 0.2 }];
	const t6 = computeTotals(inv6Lines);
	const inv6Number = `FAC-${year}-${String(invoiceCounter++).padStart(4, '0')}`;
	const inv6Mb = documentFolderFields({
		starred: true,
		important: true,
		seenAt: new Date(year, 0, 11),
		sentAt: new Date(year, 0, 10),
		snoozedUntil: daysFromNow(3),
		tags: ['urgent', 'relance'],
	});
	await prisma.invoice.upsert({
		where: { number: inv6Number },
		update: inv6Mb,
		create: {
			number: inv6Number,
			clientId: clients[5].id, // TechCorp Belgium
			status: InvoiceStatus.OVERDUE,
			date: new Date(year, 0, 10),
			dueDate: new Date(year, 1, 10),
			...inv6Mb,
			subtotal: t6.subtotal,
			tax: t6.tax,
			total: t6.total,
			balance: t6.total,
			currency: 'EUR',
			lines: {
				create: inv6Lines.map(l => ({
					...l,
					taxAmount: l.quantity * l.unitPrice * l.taxRate,
					total: l.quantity * l.unitPrice * (1 + l.taxRate)
				}))
			}
		}
	});

	// Facture 7: Partiellement payée
	const inv7Lines = [
		{ description: 'Facturio Pro - Abonnement annuel', quantity: 1, unitPrice: 290, taxRate: 0.2 },
		{ description: 'Support premium', quantity: 12, unitPrice: 99, taxRate: 0.2 }
	];
	const t7 = computeTotals(inv7Lines);
	const inv7Number = `FAC-${year}-${String(invoiceCounter++).padStart(4, '0')}`;
	const inv7Mb = documentFolderFields({
		seenAt: new Date(year, 2, 2),
		sentAt: new Date(year, 2, 1),
		tags: ['vip'],
	});
	const inv7 = await prisma.invoice.upsert({
		where: { number: inv7Number },
		update: inv7Mb,
		create: {
			number: inv7Number,
			clientId: clients[6].id, // Startup Innovante
			status: InvoiceStatus.SENT,
			date: new Date(year, 2, 1),
			dueDate: new Date(year, 3, 1),
			...inv7Mb,
			subtotal: t7.subtotal,
			tax: t7.tax,
			total: t7.total,
			balance: t7.total - 500,
			currency: 'EUR',
			lines: {
				create: inv7Lines.map(l => ({
					...l,
					taxAmount: l.quantity * l.unitPrice * l.taxRate,
					total: l.quantity * l.unitPrice * (1 + l.taxRate)
				}))
			}
		}
	});
	
	const existingPayment7 = await prisma.payment.findFirst({ where: { invoiceId: inv7.id } });
	if (!existingPayment7) {
		await prisma.payment.create({
			data: { invoiceId: inv7.id, amount: 500, method: 'card', date: new Date(year, 2, 15) }
		});
	}

	// Facture 8 : archivée (hors boîte active)
	const inv8Lines = [{ description: 'Prestation 2024 — clôture', quantity: 1, unitPrice: 990, taxRate: 0.2 }];
	const t8 = computeTotals(inv8Lines);
	const inv8Number = `FAC-${year - 1}-${String(invoiceCounter++).padStart(4, '0')}`;
	const inv8Mb = documentFolderFields({
		seenAt: new Date(year - 1, 11, 20),
		sentAt: new Date(year - 1, 11, 15),
		archivedAt: new Date(year - 1, 11, 28),
		tags: ['comptabilité'],
	});
	await prisma.invoice.upsert({
		where: { number: inv8Number },
		update: inv8Mb,
		create: {
			number: inv8Number,
			clientId: clients[0].id,
			status: InvoiceStatus.PAID,
			date: new Date(year - 1, 11, 15),
			dueDate: new Date(year - 1, 11, 30),
			...inv8Mb,
			subtotal: t8.subtotal,
			tax: t8.tax,
			total: t8.total,
			balance: 0,
			currency: 'EUR',
			lines: {
				create: inv8Lines.map((l) => ({
					...l,
					taxAmount: l.quantity * l.unitPrice * l.taxRate,
					total: l.quantity * l.unitPrice * (1 + l.taxRate),
				})),
			},
		},
	});

	// Mettre à jour le compteur
	await prisma.counter.upsert({
		where: { scope: `invoice-${year}` },
		create: { scope: `invoice-${year}`, current: invoiceCounter - 1 },
		update: { current: invoiceCounter - 1 }
	});
}

