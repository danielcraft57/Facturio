import { PrismaClient, QuoteStatus } from '@prisma/client';

/**
 * Devis d'exemple alignés sur les forfaits et descriptions du site V6 (danielcraft.fr).
 * Prix et libellés : V6/src/pages/index.html, V6/src/includes/schema.html
 * - Site Vitrine : 490€ HT
 * - Applications métier & automatisation : 750€ HT
 * - Audit & Optimisation : 650€ HT
 * - En première page V6 : Site Vitrine 490€, Identité 990€, Pack SEO 699€
 */
function getYear(): number {
	return new Date().getFullYear();
}

/** Descriptions des services telles que sur V6 (index.html) et produits Facturio. */
const V6_SERVICES = {
	siteVitrine: {
		description:
			"Site vitrine professionnel, responsive, identité de votre commerce ou artisanat. Design responsive, page d'accueil & contact, guide d'utilisation, repo GitHub inclus, 14 jours de support.",
		unitPrice: 490
	},
	automatisation: {
		description:
			"Applications métier & automatisation : applications web (CRM, backoffice, SaaS), automatisation de tâches, intégrations API, traitements de données & reporting, 14 jours de support.",
		unitPrice: 750
	},
	auditOptim: {
		description:
			"Audit & Optimisation : identité technique, performances & scalabilité, recommandations priorisées, métriques avant/après, 14 jours de support.",
		unitPrice: 650
	}
} as const;

/** Produits seed (siteVitrine, automatisation, auditOptim) pour lier les lignes de devis aux produits. */
type ProductsSeed = { siteVitrine?: { id: number }; automatisation?: { id: number }; auditOptim?: { id: number } };

export async function seedQuotes(prisma: PrismaClient, clients: any[], products?: ProductsSeed): Promise<void> {
	const year = getYear();
	let quoteCounter = 1;
	const taxRate = 0.2;

	// Devis 1: DRAFT - Site Vitrine 600€ (V6), client ACME
	const q1Number = `DEV-${year}-${String(quoteCounter++).padStart(4, '0')}`;
	const s1 = V6_SERVICES.siteVitrine;
	const t1 = { subtotal: s1.unitPrice, tax: s1.unitPrice * taxRate, total: s1.unitPrice * (1 + taxRate) };
	await prisma.quote.upsert({
		where: { number: q1Number },
		update: {},
		create: {
			number: q1Number,
			clientId: clients[0].id,
			status: QuoteStatus.DRAFT,
			subtotal: t1.subtotal,
			tax: t1.tax,
			total: t1.total,
			lines: {
				create: [
					{
						productId: products?.siteVitrine?.id ?? null,
						description: s1.description,
						quantity: 1,
						unitPrice: s1.unitPrice,
						taxRate,
						taxAmount: t1.tax,
						total: t1.total
					}
				]
			}
		}
	});

	// Devis 2: SENT - Applications métier & automatisation 900€ (V6), client Jean Client
	const publicToken = 'seed-token-' + Math.random().toString(36).slice(2);
	const q2Number = `DEV-${year}-${String(quoteCounter++).padStart(4, '0')}`;
	const s2 = V6_SERVICES.automatisation;
	const t2 = { subtotal: s2.unitPrice, tax: s2.unitPrice * taxRate, total: s2.unitPrice * (1 + taxRate) };
	const q2 = await prisma.quote.upsert({
		where: { number: q2Number },
		update: {},
		create: {
			number: q2Number,
			clientId: clients[3].id,
			status: QuoteStatus.SENT,
			sentAt: new Date(year, 1, 10),
			publicToken,
			subtotal: t2.subtotal,
			tax: t2.tax,
			total: t2.total,
			expiryDate: new Date(year, 2, 10),
			lines: {
				create: [
					{
						productId: products?.automatisation?.id ?? null,
						description: s2.description,
						quantity: 1,
						unitPrice: s2.unitPrice,
						taxRate,
						taxAmount: t2.tax,
						total: t2.total
					}
				]
			}
		}
	});
	const existingEvents = await prisma.emailEvent.findMany({ where: { quoteId: q2.id } });
	if (existingEvents.length === 0) {
		await prisma.emailEvent.createMany({
			data: [
				{ quoteId: q2.id, type: 'sent', providerId: 'seed-1' },
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

	// Devis 3: ACCEPTED - Audit & Optimisation 800€ (V6), client Exempt SARL
	const q3Number = `DEV-${year}-${String(quoteCounter++).padStart(4, '0')}`;
	await prisma.quote.upsert({
		where: { number: q3Number },
		update: {},
		create: {
			number: q3Number,
			clientId: clients[4].id,
			status: QuoteStatus.ACCEPTED,
			acceptedAt: new Date(year, 1, 20),
			acceptedIp: '192.168.1.100',
			subtotal: V6_SERVICES.auditOptim.unitPrice,
			tax: V6_SERVICES.auditOptim.unitPrice * taxRate,
			total: V6_SERVICES.auditOptim.unitPrice * (1 + taxRate),
			lines: {
				create: [
					{
						productId: products?.auditOptim?.id ?? null,
						description: V6_SERVICES.auditOptim.description,
						quantity: 1,
						unitPrice: V6_SERVICES.auditOptim.unitPrice,
						taxRate,
						taxAmount: V6_SERVICES.auditOptim.unitPrice * taxRate,
						total: V6_SERVICES.auditOptim.unitPrice * (1 + taxRate)
					}
				]
			}
		}
	});

	// Devis 4: REJECTED - Site Vitrine 600€ (V6), client TechCorp Belgium
	const q4Number = `DEV-${year}-${String(quoteCounter++).padStart(4, '0')}`;
	const s4 = V6_SERVICES.siteVitrine;
	const t4 = { subtotal: s4.unitPrice, tax: s4.unitPrice * taxRate, total: s4.unitPrice * (1 + taxRate) };
	await prisma.quote.upsert({
		where: { number: q4Number },
		update: {},
		create: {
			number: q4Number,
			clientId: clients[5].id,
			status: QuoteStatus.REJECTED,
			subtotal: t4.subtotal,
			tax: t4.tax,
			total: t4.total,
			lines: {
				create: [
					{
						productId: products?.siteVitrine?.id ?? null,
						description: s4.description,
						quantity: 1,
						unitPrice: s4.unitPrice,
						taxRate,
						taxAmount: t4.tax,
						total: t4.total
					}
				]
			}
		}
	});

	// Devis 5: EXPIRED - Applications métier & automatisation 900€ (V6), client Startup Innovante
	const q5Number = `DEV-${year}-${String(quoteCounter++).padStart(4, '0')}`;
	const s5 = V6_SERVICES.automatisation;
	const t5 = { subtotal: s5.unitPrice, tax: s5.unitPrice * taxRate, total: s5.unitPrice * (1 + taxRate) };
	await prisma.quote.upsert({
		where: { number: q5Number },
		update: {},
		create: {
			number: q5Number,
			clientId: clients[6].id,
			status: QuoteStatus.EXPIRED,
			sentAt: new Date(year, 0, 1),
			expiryDate: new Date(year, 0, 31),
			subtotal: t5.subtotal,
			tax: t5.tax,
			total: t5.total,
			lines: {
				create: [
					{
						productId: products?.automatisation?.id ?? null,
						description: s5.description,
						quantity: 1,
						unitPrice: s5.unitPrice,
						taxRate,
						taxAmount: t5.tax,
						total: t5.total
					}
				]
			}
		}
	});

	// Devis 6: DRAFT - Boulangerie Martin (Site Vitrine + Maintenance), client lié devis
	if (clients.length > 8) {
		const q6Number = `DEV-${year}-${String(quoteCounter++).padStart(4, '0')}`;
		const productIdSite = products?.siteVitrine?.id ?? null;
		const subSite = V6_SERVICES.siteVitrine.unitPrice;
		const taxSite = subSite * taxRate;
		const subMaint = 49;
		const taxMaint = subMaint * taxRate;
		const subtotal6 = subSite + subMaint;
		const tax6 = taxSite + taxMaint;
		await prisma.quote.upsert({
			where: { number: q6Number },
			update: {},
			create: {
				number: q6Number,
				clientId: clients[8].id,
				status: QuoteStatus.DRAFT,
				subtotal: subtotal6,
				tax: tax6,
				total: subtotal6 + tax6,
				lines: {
					create: [
						{
							productId: productIdSite,
							description: V6_SERVICES.siteVitrine.description,
							quantity: 1,
							unitPrice: subSite,
							taxRate,
							taxAmount: taxSite,
							total: subSite + taxSite
						},
						{
							productId: null,
							description: 'Maintenance site (mensuelle) - 1er mois',
							quantity: 1,
							unitPrice: subMaint,
							taxRate,
							taxAmount: taxMaint,
							total: subMaint + taxMaint
						}
					]
				}
			}
		});
	}

	await prisma.counter.upsert({
		where: { scope: `quote-${year}` },
		create: { scope: `quote-${year}`, current: quoteCounter - 1 },
		update: { current: quoteCounter - 1 }
	});
}
