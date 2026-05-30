import { PrismaClient, InvoiceStatus, QuoteStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { documentFolderFields } from './document-folder.seed';
import { withEntityId } from '../../src/common/entity-id';

type DemoConfig = {
	email: string;
	password: string;
	monthsBack: number;
	clients: number;
	invoices: number;
	quotes: number;
};

function clamp(n: number, min: number, max: number) {
	return Math.max(min, Math.min(max, n));
}

/** PRNG deterministe (LCG) pour avoir des seeds stables. */
function makeRng(seed: number) {
	let s = seed >>> 0;
	return () => {
		s = (1664525 * s + 1013904223) >>> 0;
		return s / 2 ** 32;
	};
}

function pick<T>(rng: () => number, arr: T[]): T {
	return arr[Math.floor(rng() * arr.length)]!;
}

function dateMonthsBack(monthsBack: number, rng: () => number): Date {
	const now = new Date();
	const start = new Date(now);
	start.setMonth(start.getMonth() - monthsBack);
	start.setHours(12, 0, 0, 0);
	const t = start.getTime() + (now.getTime() - start.getTime()) * rng();
	const d = new Date(t);
	d.setHours(12, 0, 0, 0);
	return d;
}

function addDays(base: Date, days: number): Date {
	const d = new Date(base);
	d.setDate(d.getDate() + days);
	d.setHours(12, 0, 0, 0);
	return d;
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

function docFieldsForStatus(status: InvoiceStatus | QuoteStatus, date: Date, rng: () => number) {
	const tagsPool = ['vip', 'relance', 'maintenance', 'ia', 'comptabilité', 'urgent', 'prospection'];
	const tags = rng() < 0.55 ? [pick(rng, tagsPool)] : [];
	const starred = rng() < 0.18;
	const important = rng() < 0.14;

	// "Boîte mail" visuelle: sent = vu, draft = pas vu, overdue = important
	if (status === 'DRAFT') {
		return documentFolderFields({ seenAt: null, starred, important, tags });
	}
	if (status === 'SENT' || status === 'ACCEPTED' || status === 'EXPIRED' || status === 'REJECTED') {
		return documentFolderFields({ seenAt: addDays(date, clamp(Math.floor(rng() * 6), 0, 5)), starred, important, sentAt: date, tags });
	}
	if (status === 'OVERDUE') {
		return documentFolderFields({ seenAt: addDays(date, 1), starred: true, important: true, sentAt: date, tags: ['urgent', 'relance'] });
	}
	if (status === 'PAID') {
		return documentFolderFields({ seenAt: addDays(date, 1), starred, important: false, sentAt: date, tags });
	}
	// fallback
	return documentFolderFields({ seenAt: addDays(date, 1), starred, important, tags });
}

export async function seedPlaywrightDemo(prisma: PrismaClient, cfg?: Partial<DemoConfig>) {
	const config: DemoConfig = {
		email: cfg?.email ?? process.env.PLAYWRIGHT_DEMO_EMAIL ?? 'playwright@facturio.local',
		password: cfg?.password ?? process.env.PLAYWRIGHT_DEMO_PASSWORD ?? 'playwright',
		monthsBack: clamp(Number(cfg?.monthsBack ?? process.env.PLAYWRIGHT_DEMO_MONTHS_BACK ?? 6), 2, 18),
		clients: clamp(Number(cfg?.clients ?? process.env.PLAYWRIGHT_DEMO_CLIENTS ?? 18), 8, 60),
		invoices: clamp(Number(cfg?.invoices ?? process.env.PLAYWRIGHT_DEMO_INVOICES ?? 40), 12, 200),
		quotes: clamp(Number(cfg?.quotes ?? process.env.PLAYWRIGHT_DEMO_QUOTES ?? 26), 8, 120),
	};

	const rng = makeRng(20260529);

	// 1) Organisation + user
	const onboardingCompletedAt = new Date();
	const existingOrg = await prisma.organization.findFirst({ where: { name: 'Playwright Demo' } });
	const org = existingOrg
		? await prisma.organization.update({
				where: { id: existingOrg.id },
				data: { onboardingCompletedAt },
		  })
		: await prisma.organization.create({
				data: {
					name: 'Playwright Demo',
					companyType: 'B2B',
					address: 'Paris, France',
					email: 'demo@facturio.local',
					defaultCurrency: 'EUR',
					defaultLanguage: 'fr',
					onboardingCompletedAt,
					preferredTechnologies: ['react', 'nestjs', 'typescript'],
				},
		  });

	const hashed = await bcrypt.hash(config.password, 12);
	await prisma.user.upsert({
		where: { email: config.email },
		update: {
			password: hashed,
			organizationId: org.id,
			status: 'ACTIVE',
			emailVerified: true,
			role: 'ADMIN',
			firstName: 'Playwright',
			lastName: 'Demo',
		},
		create: {
			email: config.email,
			password: hashed,
			firstName: 'Playwright',
			lastName: 'Demo',
			organizationId: org.id,
			status: 'ACTIVE',
			emailVerified: true,
			role: 'ADMIN',
		},
	});

	// 2) Clients
	const companyNames = [
		'Atelier Pixel',
		'Studio Lambda',
		'Nova Systems',
		'Agence Rivage',
		'Boulangerie Martin',
		'Restaurant Le Gourmet',
		'Cabinet Compta Plus',
		'Startup Helios',
		'TechCorp Belgium',
		'ACME France',
	];
	const people = ['Marie Dupont', 'Jean Client', 'Paul Lemaire', 'Camille Bernard', 'Luc Morel'];
	const createdClients: any[] = [];

	for (let i = 0; i < config.clients; i++) {
		const isCompany = rng() < 0.72;
		const baseName = isCompany ? pick(rng, companyNames) : pick(rng, people);
		const safeSlug = `${baseName}`.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '');
		const email = `${safeSlug}.${i + 1}@demo.facturio.local`;
		const data: any = {
			name: baseName,
			email,
			isCompany,
			companyName: isCompany ? `${baseName} SAS` : null,
			countryCode: 'FR',
			address: `${10 + i} Rue de la Paix`,
			siren: isCompany ? String(400000000 + i).slice(0, 9) : null,
			organizationId: org.id,
		};
		const existing = await prisma.client.findUnique({ where: { email } });
		if (!existing) createdClients.push(await prisma.client.create({ data: withEntityId(data) }));
		else createdClients.push(existing);
	}

	// 3) Quotes (étalés)
	const quoteLinesPool = [
		{ description: 'Site vitrine (React + SEO)', unitPrice: 490, taxRate: 0.2 },
		{ description: 'Intégration API + automatisation', unitPrice: 750, taxRate: 0.2 },
		{ description: 'Maintenance mensuelle', unitPrice: 120, taxRate: 0.2 },
		{ description: 'Pack IA (tri emails + extraction)', unitPrice: 600, taxRate: 0.2 },
	];

	for (let i = 0; i < config.quotes; i++) {
		const d = dateMonthsBack(config.monthsBack, rng);
		const status = pick(rng, [QuoteStatus.DRAFT, QuoteStatus.SENT, QuoteStatus.ACCEPTED, QuoteStatus.REJECTED, QuoteStatus.EXPIRED]);
		const number = `DEV-${d.getFullYear()}-${String(3000 + i).padStart(4, '0')}`;
		const client = pick(rng, createdClients);

		const l1 = pick(rng, quoteLinesPool);
		const qty = rng() < 0.2 ? 2 : 1;
		const lines = [{ description: l1.description, quantity: qty, unitPrice: l1.unitPrice, taxRate: l1.taxRate }];
		const totals = computeTotals(lines);
		const mb = docFieldsForStatus(status, d, rng);

		await prisma.quote.upsert({
			where: { number },
			update: mb,
			create: {
				number,
				date: d,
				expiryDate: addDays(d, 30),
				status,
				clientId: client.id,
				organizationId: org.id,
				...mb,
				subtotal: totals.subtotal,
				tax: totals.tax,
				total: totals.total,
				lines: {
					create: lines.map((l) => ({
						...l,
						taxAmount: l.quantity * l.unitPrice * l.taxRate,
						total: l.quantity * l.unitPrice * (1 + l.taxRate),
					})),
				},
			},
		});
	}

	// 4) Invoices (étalées)
	const invoiceLinesPool = [
		{ description: 'Développement React (TJM)', unitPrice: 650, taxRate: 0.2 },
		{ description: 'Intégration Stripe', unitPrice: 480, taxRate: 0.2 },
		{ description: 'Maintenance & SLA', unitPrice: 290, taxRate: 0.2 },
		{ description: 'Automatisation n8n/Make', unitPrice: 840, taxRate: 0.2 },
	];

	for (let i = 0; i < config.invoices; i++) {
		const d = dateMonthsBack(config.monthsBack, rng);
		const status = pick(rng, [InvoiceStatus.DRAFT, InvoiceStatus.SENT, InvoiceStatus.PAID, InvoiceStatus.OVERDUE]);
		const number = `FAC-${d.getFullYear()}-${String(6000 + i).padStart(4, '0')}`;
		const client = pick(rng, createdClients);

		const l1 = pick(rng, invoiceLinesPool);
		const qty = 1 + Math.floor(rng() * 4);
		const lines = [{ description: l1.description, quantity: qty, unitPrice: l1.unitPrice, taxRate: l1.taxRate }];
		const totals = computeTotals(lines);
		const mb = docFieldsForStatus(status, d, rng);
		const dueDate = addDays(d, 30);
		const isPaid = status === InvoiceStatus.PAID;
		const balance = isPaid ? 0 : totals.total;

		await prisma.invoice.upsert({
			where: { number },
			update: mb,
			create: {
				number,
				date: d,
				dueDate,
				status,
				clientId: client.id,
				organizationId: org.id,
				...mb,
				subtotal: totals.subtotal,
				tax: totals.tax,
				total: totals.total,
				balance,
				currency: 'EUR',
				lines: {
					create: lines.map((l) => ({
						...l,
						taxAmount: l.quantity * l.unitPrice * l.taxRate,
						total: l.quantity * l.unitPrice * (1 + l.taxRate),
					})),
				},
			},
		});
	}

	console.log('\n🎬 Seed Playwright prêt');
	console.log(`   Compte: ${config.email}`);
	console.log(`   Mot de passe: ${config.password}`);
	console.log(`   Org: ${org.name} (id ${org.id})\n`);
}

