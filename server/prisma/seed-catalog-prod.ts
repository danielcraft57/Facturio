/**
 * Prod : synchronise les modèles catalogue global (organizationId = null)
 * utilisés par /installation (preview + clone). Ne purge rien.
 *
 * Exécution : npm run seed:catalog:prod (après build:prod)
 */
import { PrismaClient } from '@prisma/client';
import { seedCatalogRulesValidation } from './seeds/catalog-rules.seed';
import { seedProducts } from './seeds/products.seed';
import { syncOrganizationProductVisuals } from './seeds/sync-org-product-visuals';

async function resolveTaxIds(prisma: PrismaClient): Promise<{ def20Id: number; def10Id: number }> {
	const def20 =
		(await prisma.taxRate.findFirst({ where: { isDefault: true } })) ??
		(await prisma.taxRate.findFirst({ where: { name: 'TVA 20%' } }));
	const def10 = await prisma.taxRate.findFirst({ where: { name: 'TVA 10%' } });
	if (!def20) {
		throw new Error(
			'Taux TVA 20 % introuvable — appliquez les migrations puis créez les taux (ou seed dev une fois).',
		);
	}
	return { def20Id: def20.id, def10Id: def10?.id ?? def20.id };
}

async function main(): Promise<void> {
	const prisma = new PrismaClient();
	try {
		console.log('[seed:catalog:prod] Synchronisation des modèles catalogue (installation)…');
		const taxIds = await resolveTaxIds(prisma);
		const result = await seedProducts(prisma, taxIds);
		await seedCatalogRulesValidation(prisma);
		const visualsFixed = await syncOrganizationProductVisuals(prisma);
		console.log(
			`[seed:catalog:prod] OK — ${Object.keys(result).length} références seed, templates globaux à jour.` +
				(visualsFixed > 0 ? ` ${visualsFixed} produit(s) org : visuels réparés.` : ''),
		);
	} finally {
		await prisma.$disconnect();
	}
}

main().catch((err) => {
	console.error('[seed:catalog:prod] Échec:', err);
	process.exit(1);
});
