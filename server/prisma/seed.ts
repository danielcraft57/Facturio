import { PrismaClient, InvoiceStatus, QuoteStatus, FilingStatus } from '@prisma/client';

const prisma = new PrismaClient();

function getYear(): number {
	return new Date().getFullYear();
}

function quarterFromDate(d: Date): { periodStart: Date; periodEnd: Date; dueDate: Date; label: string } {
	const y = d.getFullYear();
	const q = Math.floor(d.getMonth() / 3) + 1;
	const monthStart = (q - 1) * 3;
	const periodStart = new Date(y, monthStart, 1);
	const periodEnd = new Date(y, monthStart + 3, 0);
	const dueDate = new Date(y, monthStart + 3, 0);
	return { periodStart, periodEnd, dueDate, label: `${y}-Q${q}` };
}

async function purgeAll(): Promise<void> {
	// Purge dans l'ordre pour respecter les FK
	await prisma.quoteView.deleteMany();
	await prisma.emailEvent.deleteMany();
	await prisma.quoteLine.deleteMany();
	await prisma.quote.deleteMany();
	await prisma.invoiceLine.deleteMany();
	await prisma.payment.deleteMany();
	await prisma.invoice.deleteMany();
	await prisma.filingLine.deleteMany();
	await prisma.authorityPayment.deleteMany();
	await prisma.filing.deleteMany();
	await prisma.subscription.deleteMany();
	await prisma.plan.deleteMany();
	await prisma.product.deleteMany();
	// On garde TaxRate mais on forcera les valeurs après
	await prisma.counter.deleteMany();
}

async function seedTaxRates(): Promise<{ def20Id: number; def10Id: number; zeroId: number }> {
	// Mettre isDefault: false partout puis positionner une seule valeur par défaut
	await prisma.taxRate.updateMany({ data: { isDefault: false } });

	async function upsertByName(name: string, rate: number, isDefault: boolean) {
		const existing = await prisma.taxRate.findFirst({ where: { name } });
		if (existing) {
			return prisma.taxRate.update({ where: { id: existing.id }, data: { rate, isDefault } });
		}
		return prisma.taxRate.create({ data: { name, rate, isDefault } });
	}

	const t20 = await upsertByName('TVA 20%', 0.2, true);
	const t10 = await upsertByName('TVA 10%', 0.1, false);
	await upsertByName('TVA 5.5%', 0.055, false);
	await upsertByName('TVA 2.1%', 0.021, false);
	const t0 = await upsertByName('TVA 0% (exonération / export / intracom B2B)', 0, false);
	return { def20Id: t20.id, def10Id: t10.id, zeroId: t0.id };
}

async function seedProductsAndPlans(defaultTaxIds: { def20Id: number; def10Id: number }) {
	const productSaas = await prisma.product.create({
		data: { name: 'Facturio Pro', sku: 'FF-PRO', kind: 'SAAS', defaultTaxRateId: defaultTaxIds.def20Id }
	});
	const productService = await prisma.product.create({
		data: { name: 'Audit fiscal', sku: 'AUDIT-SERV', kind: 'SERVICE', defaultTaxRateId: defaultTaxIds.def10Id }
	});
	const planMonthly = await prisma.plan.create({
		data: { productId: productSaas.id, name: 'Pro mensuel', amount: 29, currency: 'EUR', interval: 'MONTH' }
	});
	const planYearly = await prisma.plan.create({
		data: { productId: productSaas.id, name: 'Pro annuel', amount: 290, currency: 'EUR', interval: 'YEAR' }
	});
	return { productSaas, productService, planMonthly, planYearly };
}

async function seedClients(defaultTaxIds: { def10Id: number }) {
	const frCompany = await prisma.client.upsert({
		where: { email: 'fr@acme.test' },
		update: { name: 'ACME France', isCompany: true, countryCode: 'FR' },
		create: { name: 'ACME France', email: 'fr@acme.test', isCompany: true, countryCode: 'FR' }
	});
	const deCompany = await prisma.client.upsert({
		where: { email: 'de@eu-b2b.test' },
		update: { name: 'EU GmbH', isCompany: true, countryCode: 'DE', vatNumber: 'DE123456789' },
		create: { name: 'EU GmbH', email: 'de@eu-b2b.test', isCompany: true, countryCode: 'DE', vatNumber: 'DE123456789' }
	});
	const usCompany = await prisma.client.upsert({
		where: { email: 'us@export.test' },
		update: { name: 'US Corp', isCompany: true, countryCode: 'US' },
		create: { name: 'US Corp', email: 'us@export.test', isCompany: true, countryCode: 'US' }
	});
	const frB2C = await prisma.client.upsert({
		where: { email: 'b2c@home.test' },
		update: { name: 'Jean Client', isCompany: false, countryCode: 'FR', taxRateOverrideId: defaultTaxIds.def10Id },
		create: { name: 'Jean Client', email: 'b2c@home.test', isCompany: false, countryCode: 'FR', taxRateOverrideId: defaultTaxIds.def10Id }
	});
	const vatExempt = await prisma.client.upsert({
		where: { email: 'exempt@company.test' },
		update: { name: 'Exempt SARL', isCompany: true, countryCode: 'FR', isVatExempt: true },
		create: { name: 'Exempt SARL', email: 'exempt@company.test', isCompany: true, countryCode: 'FR', isVatExempt: true }
	});
	return { frCompany, deCompany, usCompany, frB2C, vatExempt };
}

function computeInvoiceTotals(lines: Array<{ quantity: number; unitPrice: number; taxRate: number }>) {
	let subtotal = 0;
	let tax = 0;
	for (const l of lines) {
		const base = l.quantity * l.unitPrice;
		subtotal += base;
		tax += base * l.taxRate;
	}
	const total = subtotal + tax;
	return { subtotal, tax, total };
}

async function seedInvoicesAndPayments(clients: any) {
	const year = getYear();
	// Facture FR (20%)
	const lines1 = [
		{ description: 'Service A', quantity: 2, unitPrice: 100, taxRate: 0.2 },
		{ description: 'Service B', quantity: 1, unitPrice: 50, taxRate: 0.2 }
	];
	const t1 = computeInvoiceTotals(lines1);
	const inv1 = await prisma.invoice.create({
		data: {
			number: `FAC-${year}-0001`,
			clientId: clients.frCompany.id,
			status: InvoiceStatus.DRAFT,
			subtotal: t1.subtotal,
			tax: t1.tax,
			total: t1.total,
			balance: t1.total,
			currency: 'EUR',
			lines: { create: lines1.map(l => ({ ...l, taxAmount: l.quantity * l.unitPrice * l.taxRate, total: l.quantity * l.unitPrice * (1 + l.taxRate) })) }
		}
	});
	// Paiement partiel puis solde
	await prisma.payment.create({ data: { invoiceId: inv1.id, amount: 250, method: 'bank_transfer' } });
	await prisma.payment.create({ data: { invoiceId: inv1.id, amount: t1.subtotal - 250, method: 'card' } });
	await prisma.invoice.update({ where: { id: inv1.id }, data: { status: InvoiceStatus.PAID, balance: 0 } });

	// Facture EU B2B (0%)
	const lines2 = [{ description: 'Consulting', quantity: 1, unitPrice: 1000, taxRate: 0 }];
	const t2 = computeInvoiceTotals(lines2);
	await prisma.invoice.create({
		data: {
			number: `FAC-${year}-0002`,
			clientId: clients.deCompany.id,
			status: InvoiceStatus.SENT,
			subtotal: t2.subtotal,
			tax: t2.tax,
			total: t2.total,
			balance: t2.total,
			currency: 'EUR',
			lines: { create: lines2.map(l => ({ ...l, taxAmount: 0, total: l.quantity * l.unitPrice })) }
		}
	});

	// Facture export US (0%)
	const lines3 = [{ description: 'Support', quantity: 3, unitPrice: 80, taxRate: 0 }];
	const t3 = computeInvoiceTotals(lines3);
	await prisma.invoice.create({
		data: {
			number: `FAC-${year}-0003`,
			clientId: clients.usCompany.id,
			status: InvoiceStatus.DRAFT,
			subtotal: t3.subtotal,
			tax: t3.tax,
			total: t3.total,
			balance: t3.total,
			currency: 'EUR',
			lines: { create: lines3.map(l => ({ ...l, taxAmount: 0, total: l.quantity * l.unitPrice })) }
		}
	});

	// Mettre a jour le compteur facture
	await prisma.counter.upsert({ where: { scope: `invoice-${year}` }, create: { scope: `invoice-${year}`, current: 3 }, update: { current: 3 } });
}

async function seedQuotes(clients: any) {
	const year = getYear();
	const q1 = await prisma.quote.create({
		data: {
			number: `DEV-${year}-0001`,
			clientId: clients.frCompany.id,
			status: QuoteStatus.DRAFT,
			subtotal: 100,
			tax: 20,
			total: 120,
			lines: { create: [{ description: 'Service', quantity: 1, unitPrice: 100, taxRate: 0.2, taxAmount: 20, total: 120 }] }
		}
	});
	const publicToken = 'seed-token-' + Math.random().toString(36).slice(2);
	const q2 = await prisma.quote.create({
		data: {
			number: `DEV-${year}-0002`,
			clientId: clients.frB2C.id,
			status: QuoteStatus.SENT,
			sentAt: new Date(),
			publicToken,
			subtotal: 200,
			tax: 40,
			total: 240,
			lines: { create: [{ description: 'Pack', quantity: 2, unitPrice: 100, taxRate: 0.2, taxAmount: 40, total: 240 }] }
		}
	});
	await prisma.emailEvent.createMany({ data: [
		{ quoteId: q2.id, type: 'sent' },
		{ quoteId: q2.id, type: 'delivered' },
		{ quoteId: q2.id, type: 'opened' }
	] });
	await prisma.quoteView.create({ data: { quoteId: q2.id, ip: '127.0.0.1', userAgent: 'seed-agent' } });

	await prisma.quote.create({
		data: {
			number: `DEV-${year}-0003`,
			clientId: clients.vatExempt.id,
			status: QuoteStatus.ACCEPTED,
			acceptedAt: new Date(),
			acceptedIp: '127.0.0.1',
			subtotal: 300,
			tax: 0,
			total: 300,
			lines: { create: [{ description: 'Exempt', quantity: 3, unitPrice: 100, taxRate: 0, taxAmount: 0, total: 300 }] }
		}
	});

	// Mettre a jour le compteur devis
	await prisma.counter.upsert({ where: { scope: `quote-${year}` }, create: { scope: `quote-${year}`, current: 3 }, update: { current: 3 } });
}

async function seedSubscriptions(clients: any, plans: any) {
	const now = new Date();
	const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
	await prisma.subscription.create({
		data: {
			clientId: clients.frCompany.id,
			planId: plans.planMonthly.id,
			status: 'ACTIVE',
			quantity: 5,
			startDate: now,
			currentPeriodStart: now,
			currentPeriodEnd: nextMonth
		}
	});
}

async function seedFilings(): Promise<void> {
	const { periodStart, periodEnd, dueDate } = quarterFromDate(new Date(getYear(), 0, 15)); // Q1
	// Agreger TVA depuis factures existantes (simplifie: toutes FR)
	const invoices = await prisma.invoice.findMany();
	const taxableBase = invoices.reduce((acc, i) => acc + Number(i.subtotal), 0);
	const taxAmount = invoices.reduce((acc, i) => acc + Number(i.tax), 0);
	const filing = await prisma.filing.create({
		data: {
			type: 'VAT_CA3',
			authority: 'DGFIP',
			periodStart,
			periodEnd,
			dueDate,
			status: FilingStatus.CALCULATED,
			amountDue: taxAmount,
			lines: { create: [{ taxRate: 0, taxableBase, taxAmount }] }
		}
	});
	await prisma.authorityPayment.create({ data: { filingId: filing.id, authority: 'DGFIP', amount: taxAmount } as any });
	await prisma.filing.update({ where: { id: filing.id }, data: { amountPaid: taxAmount, status: FilingStatus.PAID } });
}

async function main(): Promise<void> {
	const purge = String(process.env.SEED_PURGE || 'true').toLowerCase() !== 'false';
	if (purge) {
		await purgeAll();
		console.log('Base purgee');
	}

	const taxIds = await seedTaxRates();
	console.log('Taux de TVA seeds ok');

	const { productSaas, productService, planMonthly, planYearly } = await seedProductsAndPlans(taxIds);
	console.log('Produits et plans seeds ok');

	const clients = await seedClients({ def10Id: taxIds.def10Id });
	console.log('Clients seeds ok');

	await seedSubscriptions(clients, { planMonthly, planYearly });
	console.log('Abonnements seeds ok');

	await seedInvoicesAndPayments(clients);
	console.log('Factures et paiements seeds ok');

	await seedQuotes(clients);
	console.log('Devis et evenements email seeds ok');

	await seedFilings();
	console.log('Declarations seeds ok');
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});


