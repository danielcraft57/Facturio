import { createSeedPrismaClient } from './seed-prisma';
import {
	purgeAll,
	seedApiAccessToken,
	seedChartOfAccounts,
	seedDefaultUser,
	seedTaxRates,
} from './seeds/base.seed';
import { seedProducts, seedPlans } from './seeds/products.seed';
import { seedCatalogRulesValidation } from './seeds/catalog-rules.seed';
import { seedPlaywrightDemo } from './seeds/playwright-demo.seed';

const prisma = createSeedPrismaClient();

async function main(): Promise<void> {
	const purge = String(process.env.SEED_PURGE || 'true').toLowerCase() !== 'false';
	console.log('🎬 Démarrage seed Playwright...\n');

	if (purge) {
		console.log('🗑️  Purge de la base de données...');
		await purgeAll(prisma);
		console.log('✅ Base purgée\n');
	}

	// Base minimale utile (taux, compta, produits) + user défaut (au cas où)
	console.log('👤 Vérification utilisateur par défaut...');
	await seedDefaultUser(prisma);
	const defaultOrg = await prisma.organization.findFirst();
	if (defaultOrg) await seedApiAccessToken(prisma, defaultOrg.id);
	console.log('✅ Utilisateur par défaut prêt\n');

	console.log('📊 Seeds des taux de TVA...');
	const taxIds = await seedTaxRates(prisma);
	console.log('✅ Taux de TVA créés\n');

	console.log('📚 Seeds du plan comptable...');
	await seedChartOfAccounts(prisma);
	console.log('✅ Plan comptable créé\n');

	console.log('📦 Seeds des produits et plans...');
	const products = await seedProducts(prisma, taxIds);
	await seedPlans(prisma, products.productSaas);
	await seedCatalogRulesValidation(prisma);
	console.log('✅ Produits et plans créés\n');

	// Dataset dédié pub / screenshots
	await seedPlaywrightDemo(prisma);

	console.log('🎉 Seed Playwright terminé avec succès !');
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error('❌ Erreur seed Playwright:', e);
		await prisma.$disconnect();
		process.exit(1);
	});

