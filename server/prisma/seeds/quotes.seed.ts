import { PrismaClient, QuoteStatus } from '@prisma/client';
import { daysFromNow, documentFolderFields } from './document-folder.seed';

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

/** Descriptions des services telles que sur V6 (index.html) et produits PrestaFacture. */
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
	const organizationId: number | undefined = clients?.[0]?.organizationId ?? undefined;

	// Devis 1: DRAFT - Site Vitrine 600€ (V6), client ACME
	const q1Number = `DEV-${year}-${String(quoteCounter++).padStart(4, '0')}`;
	const s1 = V6_SERVICES.siteVitrine;
	const t1 = { subtotal: s1.unitPrice, tax: s1.unitPrice * taxRate, total: s1.unitPrice * (1 + taxRate) };
	const q1Mb = documentFolderFields({ seenAt: null, tags: [] });
	await prisma.quote.upsert({
		where: { number: q1Number },
		update: q1Mb,
		create: {
			number: q1Number,
			organizationId,
			clientId: clients[0].id,
			status: QuoteStatus.DRAFT,
			...q1Mb,
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
	const q2Mb = documentFolderFields({
		starred: true,
		seenAt: new Date(year, 1, 11),
		sentAt: new Date(year, 1, 10),
		tags: ['e-commerce'],
	});
	const q2 = await prisma.quote.upsert({
		where: { number: q2Number },
		update: q2Mb,
		create: {
			number: q2Number,
			organizationId,
			clientId: clients[3].id,
			status: QuoteStatus.SENT,
			publicToken,
			...q2Mb,
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
	const q3Mb = documentFolderFields({
		important: true,
		seenAt: new Date(year, 1, 21),
		sentAt: new Date(year, 1, 18),
		tags: ['vip'],
	});
	await prisma.quote.upsert({
		where: { number: q3Number },
		update: q3Mb,
		create: {
			number: q3Number,
			organizationId,
			clientId: clients[4].id,
			status: QuoteStatus.ACCEPTED,
			acceptedAt: new Date(year, 1, 20),
			acceptedIp: '192.168.1.100',
			...q3Mb,
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
	const q4Mb = documentFolderFields({ seenAt: new Date(year, 1, 5) });
	await prisma.quote.upsert({
		where: { number: q4Number },
		update: q4Mb,
		create: {
			number: q4Number,
			organizationId,
			clientId: clients[5].id,
			status: QuoteStatus.REJECTED,
			...q4Mb,
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
	const q5Mb = documentFolderFields({
		seenAt: new Date(year, 0, 2),
		sentAt: new Date(year, 0, 1),
		snoozedUntil: daysFromNow(5),
		tags: ['relance'],
	});
	await prisma.quote.upsert({
		where: { number: q5Number },
		update: q5Mb,
		create: {
			number: q5Number,
			organizationId,
			clientId: clients[6].id,
			status: QuoteStatus.EXPIRED,
			expiryDate: new Date(year, 0, 31),
			...q5Mb,
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
		const q6Mb = documentFolderFields({ starred: true, seenAt: null });
		await prisma.quote.upsert({
			where: { number: q6Number },
			update: q6Mb,
			create: {
				number: q6Number,
				organizationId,
				clientId: clients[8].id,
				status: QuoteStatus.DRAFT,
				...q6Mb,
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

	// Devis archivé (démonstration Archives)
	const qArchNumber = `DEV-${year - 1}-9999`;
	const qArchMb = documentFolderFields({
		seenAt: new Date(year - 1, 10, 1),
		sentAt: new Date(year - 1, 9, 28),
		archivedAt: new Date(year - 1, 10, 15),
	});
	const sArch = V6_SERVICES.siteVitrine;
	const tArch = { subtotal: sArch.unitPrice, tax: sArch.unitPrice * taxRate, total: sArch.unitPrice * (1 + taxRate) };
	await prisma.quote.upsert({
		where: { number: qArchNumber },
		update: qArchMb,
		create: {
			number: qArchNumber,
			clientId: clients[0].id,
			status: QuoteStatus.SENT,
			...qArchMb,
			subtotal: tArch.subtotal,
			tax: tArch.tax,
			total: tArch.total,
			lines: {
				create: [
					{
						productId: products?.siteVitrine?.id ?? null,
						description: sArch.description,
						quantity: 1,
						unitPrice: sArch.unitPrice,
						taxRate,
						taxAmount: tArch.tax,
						total: tArch.total,
					},
				],
			},
		},
	});

	await prisma.counter.upsert({
		where: { scope: `quote-${year}` },
		create: { scope: `quote-${year}`, current: quoteCounter - 1 },
		update: { current: quoteCounter - 1 }
	});
}
