import { PrismaClient } from '@prisma/client';
import { purgeAll, seedTaxRates, seedChartOfAccounts, type SeedContext } from './seeds/base.seed';
import { seedProducts, seedPlans } from './seeds/products.seed';
import { seedClients } from './seeds/clients.seed';
import { seedInvoices } from './seeds/invoices.seed';
import { seedQuotes } from './seeds/quotes.seed';
import { seedSubscriptions } from './seeds/subscriptions.seed';
import { seedFilings } from './seeds/filings.seed';
import { seedProspects } from './seeds/prospects.seed';
import { seedPacks } from './seeds/packs.seed';

const prisma = new PrismaClient();

async function main(): Promise<void> {
	const purge = String(process.env.SEED_PURGE || 'true').toLowerCase() !== 'false';
	
	console.log('🌱 Démarrage des seeds...\n');

	if (purge) {
		console.log('🗑️  Purge de la base de données...');
		await purgeAll(prisma);
		console.log('✅ Base purgée\n');
	}

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

	// 4. Clients
	console.log('👥 Seeds des clients...');
	const clients = await seedClients(prisma, { def10Id: taxIds.def10Id });
	console.log(`✅ ${clients.length} clients créés\n`);

	// 5. Abonnements
	console.log('🔄 Seeds des abonnements...');
	await seedSubscriptions(prisma, clients, plans);
	console.log('✅ Abonnements créés\n');

	// 6. Factures et paiements
	console.log('🧾 Seeds des factures et paiements...');
	await seedInvoices(prisma, clients, Object.values(products));
	console.log('✅ Factures et paiements créés\n');

	// 7. Devis
	console.log('📄 Seeds des devis...');
	await seedQuotes(prisma, clients);
	console.log('✅ Devis créés\n');

	// 8. Déclarations
	console.log('📋 Seeds des déclarations...');
	await seedFilings(prisma);
	console.log('✅ Déclarations créées\n');

	// 9. Prospects
	console.log('🎯 Seeds des prospects...');
	await seedProspects(prisma);
	console.log('✅ Prospects créés\n');

	// 10. Packs
	console.log('📦 Seeds des packs...');
	await seedPacks(prisma, products);
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
