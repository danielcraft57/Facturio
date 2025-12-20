import { PrismaClient, QuoteStatus } from '@prisma/client';
import type { SeedContext } from './base.seed';

function getYear(): number {
	return new Date().getFullYear();
}

export async function seedQuotes(prisma: PrismaClient, clients: any[]): Promise<void> {
	const year = getYear();
	let quoteCounter = 1;

	// Devis 1: DRAFT
	const q1Number = `DEV-${year}-${String(quoteCounter++).padStart(4, '0')}`;
	const q1 = await prisma.quote.upsert({
		where: { number: q1Number },
		update: {},
		create: {
			number: q1Number,
			clientId: clients[0].id, // ACME France
			status: QuoteStatus.DRAFT,
			subtotal: 1000,
			tax: 200,
			total: 1200,
			lines: {
				create: [
					{ description: 'Développement site web', quantity: 1, unitPrice: 1000, taxRate: 0.2, taxAmount: 200, total: 1200 }
				]
			}
		}
	});

	// Devis 2: SENT avec token public
	const publicToken = 'seed-token-' + Math.random().toString(36).slice(2);
	const q2Number = `DEV-${year}-${String(quoteCounter++).padStart(4, '0')}`;
	const q2 = await prisma.quote.upsert({
		where: { number: q2Number },
		update: {},
		create: {
			number: q2Number,
			clientId: clients[3].id, // Jean Client
			status: QuoteStatus.SENT,
			sentAt: new Date(year, 1, 10),
			publicToken,
			subtotal: 2000,
			tax: 400,
			total: 2400,
			expiryDate: new Date(year, 2, 10),
			lines: {
				create: [
					{ description: 'Pack e-commerce complet', quantity: 1, unitPrice: 2000, taxRate: 0.2, taxAmount: 400, total: 2400 }
				]
			}
		}
	});
	const existingEvents = await prisma.emailEvent.findMany({ where: { quoteId: q2.id } });
	if (existingEvents.length === 0) {
		await prisma.emailEvent.createMany({
			data: [
				{ quoteId: q2.id, type: 'sent', providerId: 'seed-1' },
				{ quoteId: q2.id, type: 'delivered', providerId: 'seed-1' },
				{ quoteId: q2.id, type: 'opened', providerId: 'seed-1' }
			]
		});
	}
	const existingView = await prisma.quoteView.findFirst({ where: { quoteId: q2.id } });
	if (!existingView) {
		await prisma.quoteView.create({
			data: { quoteId: q2.id, ip: '127.0.0.1', userAgent: 'Mozilla/5.0 (seed)' }
		});
	}

	// Devis 3: ACCEPTED
	const q3Number = `DEV-${year}-${String(quoteCounter++).padStart(4, '0')}`;
	await prisma.quote.upsert({
		where: { number: q3Number },
		update: {},
		create: {
			number: q3Number,
			clientId: clients[4].id, // Exempt SARL
			status: QuoteStatus.ACCEPTED,
			acceptedAt: new Date(year, 1, 20),
			acceptedIp: '192.168.1.100',
			subtotal: 3000,
			tax: 0,
			total: 3000,
			lines: {
				create: [
					{ description: 'Application SaaS complète', quantity: 1, unitPrice: 3000, taxRate: 0, taxAmount: 0, total: 3000 }
				]
			}
		}
	});

	// Devis 4: REJECTED
	const q4Number = `DEV-${year}-${String(quoteCounter++).padStart(4, '0')}`;
	await prisma.quote.upsert({
		where: { number: q4Number },
		update: {},
		create: {
			number: q4Number,
			clientId: clients[5].id, // TechCorp Belgium
			status: QuoteStatus.REJECTED,
			subtotal: 5000,
			tax: 1000,
			total: 6000,
			lines: {
				create: [
					{ description: 'Projet sur mesure', quantity: 1, unitPrice: 5000, taxRate: 0.2, taxAmount: 1000, total: 6000 }
				]
			}
		}
	});

	// Devis 5: EXPIRED
	const q5Number = `DEV-${year}-${String(quoteCounter++).padStart(4, '0')}`;
	await prisma.quote.upsert({
		where: { number: q5Number },
		update: {},
		create: {
			number: q5Number,
			clientId: clients[6].id, // Startup Innovante
			status: QuoteStatus.EXPIRED,
			sentAt: new Date(year, 0, 1),
			expiryDate: new Date(year, 0, 31),
			subtotal: 1500,
			tax: 300,
			total: 1800,
			lines: {
				create: [
					{ description: 'Refonte site web', quantity: 1, unitPrice: 1500, taxRate: 0.2, taxAmount: 300, total: 1800 }
				]
			}
		}
	});

	// Mettre à jour le compteur
	await prisma.counter.upsert({
		where: { scope: `quote-${year}` },
		create: { scope: `quote-${year}`, current: quoteCounter - 1 },
		update: { current: quoteCounter - 1 }
	});
}

