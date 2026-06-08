import { PrismaClient, Prisma } from '@prisma/client';
import { flattenTechAssembly } from '../../src/catalog/tech-assembly.utils';
import { DANIELCRAFT_PRESTATIONS, DEV_PRODUCT_ALIASES } from './danielcraft-prestations.data';

/**
 * Produits développeur v2 — livrables par stack (dev-products.catalog.ts).
 */
type ProductRef = { id: number; sku?: string | null };

export async function seedProducts(prisma: PrismaClient, taxIds: { def20Id: number; def10Id: number }): Promise<{
	productSaas: ProductRef;
	productService: ProductRef;
	productApp: ProductRef;
	productGood: ProductRef;
	siteVitrine: ProductRef;
	automatisation: ProductRef;
	auditOptim: ProductRef;
}> {
	const created: ProductRef[] = [];

	for (const p of DANIELCRAFT_PRESTATIONS) {
		const data = {
			name: p.name,
			sku: p.sku,
			kind: p.kind,
			defaultTaxRateId: taxIds.def20Id,
			unitPrice: p.unitPrice,
			category: p.category,
			purpose: p.purpose ?? null,
			techStack: p.assembly as unknown as Prisma.JsonObject,
			languages: flattenTechAssembly(p.assembly) as unknown as Prisma.JsonArray,
			estimatedHours: p.estimatedHours ?? null,
			description: p.description,
			details: p.details as unknown as Prisma.JsonArray,
			visualType: p.visualType ?? 'icon',
			iconName: p.iconName,
			imageData: p.imageData ?? null,
		};

		const existing = await prisma.product.findFirst({
			where: { sku: p.sku, organizationId: null },
		});
		if (!existing) {
			created.push(
				await prisma.product.create({
					data: { ...data, organizationId: null },
				}),
			);
		} else {
			created.push(
				await prisma.product.update({
					where: { id: existing.id },
					data: data as Prisma.ProductUncheckedUpdateInput,
				}),
			);
		}
	}

	const bySku = (sku: string): ProductRef => {
		const found = created.find((c) => c.sku === sku);
		if (!found) throw new Error(`Produit seed manquant: ${sku}`);
		return found;
	};

	return {
		productSaas: bySku(DEV_PRODUCT_ALIASES.supportAbo),
		productService: bySku(DEV_PRODUCT_ALIASES.siteVitrine),
		productApp: bySku(DEV_PRODUCT_ALIASES.automatisation),
		productGood: bySku(DEV_PRODUCT_ALIASES.auditOptim),
		siteVitrine: bySku(DEV_PRODUCT_ALIASES.siteVitrine),
		automatisation: bySku(DEV_PRODUCT_ALIASES.automatisation),
		auditOptim: bySku(DEV_PRODUCT_ALIASES.auditOptim),
	};
}

export async function seedPlans(prisma: PrismaClient, productSaas: { id: number }): Promise<{
	planMonthly: unknown;
	planYearly: unknown;
	planEnterprise: unknown;
}> {
	const plans = [
		{
			productId: productSaas.id,
			name: 'Support mensuel',
			amount: 29,
			currency: 'EUR',
			interval: 'MONTH',
			trialDays: 14,
		},
		{
			productId: productSaas.id,
			name: 'Support annuel',
			amount: 290,
			currency: 'EUR',
			interval: 'YEAR',
			trialDays: 30,
		},
		{
			productId: productSaas.id,
			name: 'Support prioritaire',
			amount: 99,
			currency: 'EUR',
			interval: 'MONTH',
			metered: true,
		},
	];

	const created: { id: number }[] = [];
	for (const p of plans) {
		const existing = await prisma.plan.findFirst({
			where: { productId: productSaas.id, name: p.name },
		});
		if (!existing) {
			created.push(await prisma.plan.create({ data: p as never }));
		} else {
			created.push(existing);
		}
	}

	return {
		planMonthly: created[0]!,
		planYearly: created[1]!,
		planEnterprise: created[2]!,
	};
}
