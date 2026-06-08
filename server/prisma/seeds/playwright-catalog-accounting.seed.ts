import { InvoiceStatus, PrismaClient, SaasBillingPlan } from '@prisma/client';
import { getCatalogPacks } from '../../src/catalog/catalog-packs';
import { AccountingService } from '../../src/accounting/accounting.service';

/** Packs catalogue visibles en captures marketing (grille produits riche). */
const MARKETING_CATALOG_PACK_IDS = ['pack-agence-web', 'pack-automation', 'pack-maintenance'] as const;

export async function installPlaywrightCatalogPacks(prisma: PrismaClient, organizationId: number) {
	let totalCloned = 0;
	for (const packId of MARKETING_CATALOG_PACK_IDS) {
		const pack = getCatalogPacks().packs.find((p) => p.id === packId);
		if (!pack) continue;

		const existing = await prisma.product.findMany({
			where: { organizationId },
			select: { sku: true },
		});
		const existingSkus = new Set(existing.map((p) => p.sku).filter((s): s is string => !!s));

		const templates = await prisma.product.findMany({
			where: { organizationId: null, sku: { in: pack.skus } },
		});

		const agg = await prisma.organizationCatalogItem.aggregate({
			where: { organizationId },
			_max: { sortOrder: true },
		});
		let sortOrder = (agg._max.sortOrder ?? -1) + 1;

		for (const t of templates) {
			if (t.sku && existingSkus.has(t.sku)) continue;
			const clone = await prisma.product.create({
				data: {
					organizationId,
					templateProductId: t.id,
					name: t.name,
					sku: t.sku,
					kind: t.kind,
					unitPrice: t.unitPrice,
					defaultTaxRateId: t.defaultTaxRateId,
					purpose: t.purpose,
					category: t.category,
					languages: t.languages ?? [],
					techStack: t.techStack ?? undefined,
					details: t.details ?? [],
					estimatedHours: t.estimatedHours,
					description: t.description,
					visualType: t.visualType,
					iconName: t.iconName,
					imageData: t.imageData,
				},
			});
			if (t.sku) existingSkus.add(t.sku);
			await prisma.organizationCatalogItem.create({
				data: {
					organizationId,
					productId: clone.id,
					matchScore: 0,
					source: `pack:${packId}`,
					sortOrder: sortOrder++,
				},
			});
			totalCloned++;
		}
	}
	return totalCloned;
}

export async function seedPlaywrightInvoicePayments(prisma: PrismaClient, organizationId: number) {
	const paid = await prisma.invoice.findMany({
		where: { organizationId, status: InvoiceStatus.PAID },
		select: { id: true, total: true, date: true },
	});
	let created = 0;
	for (const inv of paid) {
		const existing = await prisma.payment.findFirst({ where: { invoiceId: inv.id } });
		if (existing) continue;
		await prisma.payment.create({
			data: {
				invoiceId: inv.id,
				amount: inv.total,
				method: 'bank_transfer',
				date: inv.date,
			},
		});
		created++;
	}
	return created;
}

export async function syncPlaywrightAccounting(prisma: PrismaClient, organizationId: number) {
	const accounting = new AccountingService(prisma as any);
	return accounting.syncFromInvoices(organizationId);
}

export async function configurePlaywrightOrgPlan(prisma: PrismaClient, organizationId: number) {
	const expires = new Date();
	expires.setFullYear(expires.getFullYear() + 2);
	await prisma.organization.update({
		where: { id: organizationId },
		data: {
			saasPlan: SaasBillingPlan.PRO,
			saasPlanExpiresAt: expires,
			saasSubscriptionStatus: 'active',
		},
	});
}
