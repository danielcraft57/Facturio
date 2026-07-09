import * as path from 'path';
import * as dotenv from 'dotenv';
import { createSeedPrismaClient } from './seed-prisma';
import { runDemoSeed } from '../src/demo/demo-seed.runner';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = createSeedPrismaClient();

/**
 * Script CLI : initialise l'organisation démo (même logique que l'API).
 */
async function main(): Promise<void> {
	await runDemoSeed(prisma);
	console.log('Données démo prêtes');
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (error) => {
		console.error('Erreur ensure-demo:', error);
		await prisma.$disconnect();
		process.exit(1);
	});
