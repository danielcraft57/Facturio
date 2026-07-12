import type { PrismaClient } from '@prisma/client';
import {
	DEMO_ORG_NAME,
	DEMO_USER_EMAIL,
	DEMO_USER_PASSWORD,
	DEMO_USER_FIRST_NAME,
	DEMO_USER_LAST_NAME,
	getDemoSeedVolumes,
} from './demo.constants';

type SeedModule = typeof import('../../prisma/seeds/base.seed');
type ProductsSeedModule = typeof import('../../prisma/seeds/products.seed');
type CatalogRulesModule = typeof import('../../prisma/seeds/catalog-rules.seed');
type PlaywrightDemoModule = typeof import('../../prisma/seeds/playwright-demo.seed');

/**
 * Charge un module de seed Prisma à l'exécution (hors compilation tsc rootDir).
 *
 * @param relativePath - Chemin depuis server/src/demo/
 */
function loadSeedModule<T>(relativePath: string): T {
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	return require(relativePath) as T;
}

/**
 * Initialise ou complète l'organisation démo dans la base courante (idempotent).
 *
 * @param prisma - Client Prisma actif (même DATABASE_URL que l'API)
 */
export async function runDemoSeed(prisma: PrismaClient): Promise<void> {
	const existing = await prisma.organization.findFirst({
		where: { name: DEMO_ORG_NAME },
		select: { id: true },
	});

	if (existing) {
		const [clients, invoices, quotes] = await Promise.all([
			prisma.client.count({ where: { organizationId: existing.id } }),
			prisma.invoice.count({ where: { organizationId: existing.id } }),
			prisma.quote.count({ where: { organizationId: existing.id } }),
		]);
		if (clients > 0 && invoices > 0 && quotes > 0) {
			return;
		}
	}

	const { seedTaxRates, seedChartOfAccounts } = loadSeedModule<SeedModule>('../../prisma/seeds/base.seed');
	const { seedProducts, seedPlans } = loadSeedModule<ProductsSeedModule>('../../prisma/seeds/products.seed');
	const { seedCatalogRulesValidation } = loadSeedModule<CatalogRulesModule>(
		'../../prisma/seeds/catalog-rules.seed',
	);
	const { seedPlaywrightDemo } = loadSeedModule<PlaywrightDemoModule>(
		'../../prisma/seeds/playwright-demo.seed',
	);

	const volumes = getDemoSeedVolumes();
	const taxIds = await seedTaxRates(prisma);
	await seedChartOfAccounts(prisma);
	const products = await seedProducts(prisma, taxIds);
	await seedPlans(prisma, products.productSaas);
	await seedCatalogRulesValidation(prisma);

	await seedPlaywrightDemo(prisma, {
		email: DEMO_USER_EMAIL,
		password: DEMO_USER_PASSWORD,
		orgName: DEMO_ORG_NAME,
		firstName: DEMO_USER_FIRST_NAME,
		lastName: DEMO_USER_LAST_NAME,
		...volumes,
	});
}
