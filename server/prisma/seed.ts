import { PrismaClient } from '@prisma/client';
import { purgeAll, seedTaxRates, seedChartOfAccounts, seedDefaultUser, type SeedContext } from './seeds/base.seed';
import { seedProducts, seedPlans } from './seeds/products.seed';
import { seedClients } from './seeds/clients.seed';
import { seedInvoices } from './seeds/invoices.seed';
import { seedQuotes } from './seeds/quotes.seed';
import { seedSubscriptions } from './seeds/subscriptions.seed';
import { seedFilings } from './seeds/filings.seed';
import { seedProspects } from './seeds/prospects.seed';
import { seedPacks } from './seeds/packs.seed';

const prisma = new PrismaClient();

/**
 * Exécute un seed ou ignore si la table du modèle n'existe pas (P2021).
 */
async function seedOrSkip(_prisma: PrismaClient, modelName: string, fn: () => Promise<void>): Promise<void> {
	try {
		await fn();
	} catch (e: any) {
		if (e?.code === 'P2021' && e?.meta?.modelName === modelName) {
			console.log(`   (table ${modelName} absente, seed ignoré)`);
			return;
		}
		throw e;
	}
}

async function main(): Promise<void> {
	const purge = String(process.env.SEED_PURGE || 'true').toLowerCase() !== 'false';
	
	console.log('🌱 Démarrage des seeds...\n');

	if (purge) {
		console.log('🗑️  Purge de la base de données...');
		await purgeAll(prisma);
		console.log('✅ Base purgée\n');
	}

	// 0. Utilisateur et organisation par défaut (premier compte après seed)
	console.log('👤 Vérification utilisateur par défaut...');
	await seedDefaultUser(prisma);
	console.log('✅ Utilisateur par défaut prêt\n');

	// 1. Taux de TVA
	console.log('📊 Seeds des taux de TVA...');
	const taxIds = await seedTaxRates(prisma);
	console.log('✅ Taux de TVA créés\n');

	// 2. Plan comptable
	console.log('📚 Seeds du plan comptable...');
	const { accounts, journals } = await seedChartOfAccounts(prisma);
	console.log('✅ Plan comptable créé\n');

	// 3. Produits et plans
	console.log('📦 Seeds des produits et plans...');
	const products = await seedProducts(prisma, taxIds);
	const plans = await seedPlans(prisma, products.productSaas);
	console.log('✅ Produits et plans créés\n');

	// 4. Clients (rattachés à l'organisation par défaut pour que le backend les retourne)
	const defaultOrg = await prisma.organization.findFirst();
	console.log('👥 Seeds des clients...');
	const clients = await seedClients(prisma, { def10Id: taxIds.def10Id, organizationId: defaultOrg?.id });
	console.log(`✅ ${clients.length} clients créés\n`);

	// 5. Abonnements
	console.log('🔄 Seeds des abonnements...');
	await seedSubscriptions(prisma, clients, plans);
	console.log('✅ Abonnements créés\n');

	// 6. Factures et paiements
	console.log('🧾 Seeds des factures et paiements...');
	await seedInvoices(prisma, clients, Object.values(products));
	console.log('✅ Factures et paiements créés\n');

	// 7. Devis (liés aux clients et produits V6)
	console.log('📄 Seeds des devis...');
	await seedQuotes(prisma, clients, products);
	console.log('✅ Devis créés\n');

	// 8. Déclarations
	console.log('📋 Seeds des déclarations...');
	await seedFilings(prisma);
	console.log('✅ Déclarations créées\n');

	// 9. Prospects (ignoré si la table n'existe pas, ex. sans migration Prospect)
	console.log('🎯 Seeds des prospects...');
	await seedOrSkip(prisma, 'Prospect', () => seedProspects(prisma));
	console.log('✅ Prospects créés\n');

	// 10. Packs (ignoré si la table n'existe pas)
	console.log('📦 Seeds des packs...');
	await seedOrSkip(prisma, 'Pack', () => seedPacks(prisma, products));
	console.log('✅ Packs créés\n');

	console.log('🎉 Seeds terminés avec succès !');
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error('❌ Erreur lors des seeds:', e);
		await prisma.$disconnect();
		process.exit(1);
	});
