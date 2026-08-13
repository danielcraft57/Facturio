import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';

export interface SeedContext {
	prisma: PrismaClient;
	taxIds: { def20Id: number; def10Id: number; zeroId: number };
	products: { productSaas: any; productService: any; productApp: any; productGood: any };
	plans: { planMonthly: any; planYearly: any };
	clients: any[];
	accounts: Map<string, number>; // code -> id
	journals: Map<string, number>; // code -> id
}

export async function seedTaxRates(prisma: PrismaClient): Promise<{ def20Id: number; def10Id: number; zeroId: number }> {
	await prisma.taxRate.updateMany({ data: { isDefault: false } });

	async function upsertByName(name: string, rate: number, isDefault: boolean) {
		const existing = await prisma.taxRate.findFirst({ where: { name } });
		if (existing) {
			return prisma.taxRate.update({ where: { id: existing.id }, data: { rate, isDefault } });
		}
		return prisma.taxRate.create({ data: { name, rate, isDefault } });
	}

	const t20 = await upsertByName('TVA 20%', 0.2, true);
	const t10 = await upsertByName('TVA 10%', 0.1, false);
	await upsertByName('TVA 5.5%', 0.055, false);
	await upsertByName('TVA 2.1%', 0.021, false);
	const t0 = await upsertByName('TVA 0% (exonération / export / intracom B2B)', 0, false);
	return { def20Id: t20.id, def10Id: t10.id, zeroId: t0.id };
}

export async function seedChartOfAccounts(prisma: PrismaClient): Promise<{ accounts: Map<string, number>; journals: Map<string, number> }> {
	// Journaux
	const journalVE = await prisma.journal.upsert({
		where: { code: 'VE' },
		update: {},
		create: { code: 'VE', name: 'Ventes' }
	});
	const journalBQ = await prisma.journal.upsert({
		where: { code: 'BQ' },
		update: {},
		create: { code: 'BQ', name: 'Banque' }
	});
	const journalOD = await prisma.journal.upsert({
		where: { code: 'OD' },
		update: {},
		create: { code: 'OD', name: 'Opérations diverses' }
	});

	const journals = new Map<string, number>();
	journals.set('VE', journalVE.id);
	journals.set('BQ', journalBQ.id);
	journals.set('OD', journalOD.id);

	// Comptes
	const accountsData: Array<{ code: string; name: string; type: any }> = [
		{ code: '512', name: 'Banque', type: 'BANK' },
		{ code: '411', name: 'Clients', type: 'CUSTOMER' },
		{ code: '401', name: 'Fournisseurs', type: 'SUPPLIER' },
		{ code: '706', name: 'Prestations de services', type: 'REVENUE' },
		{ code: '707', name: 'Ventes de marchandises', type: 'REVENUE' },
		{ code: '44571', name: 'TVA collectée', type: 'TAX' },
		{ code: '44566', name: 'TVA déductible', type: 'TAX' },
		{ code: '606', name: 'Achats non stockés', type: 'EXPENSE' },
		{ code: '615', name: 'Entretien et réparations', type: 'EXPENSE' },
		{ code: '622', name: 'Rémunérations d\'intermédiaires et honoraires', type: 'EXPENSE' },
		{ code: '641', name: 'Rémunérations du personnel', type: 'EXPENSE' },
		{ code: '645', name: 'Charges de sécurité sociale et de prévoyance', type: 'EXPENSE' },
		{ code: '421', name: 'Personnel - rémunérations dues', type: 'LIABILITY' },
		{ code: '431', name: 'Sécurité sociale', type: 'LIABILITY' },
		{ code: '447', name: 'Autres impôts et taxes à payer', type: 'LIABILITY' },
		{ code: '635', name: 'Autres impôts, taxes et versements assimilés', type: 'EXPENSE' }
	];

	const accounts = new Map<string, number>();
	for (const a of accountsData) {
		const existing = await prisma.account.findFirst({ where: { code: a.code } });
		if (!existing) {
			const created = await prisma.account.create({ data: a as any });
			accounts.set(a.code, created.id);
		} else {
			accounts.set(a.code, existing.id);
		}
	}

	return { accounts, journals };
}

/**
 * Crée un utilisateur et une organisation par défaut si aucun utilisateur n'existe.
 * Compte utilisable pour la première connexion après seed.
 */
export async function seedDefaultUser(prisma: PrismaClient): Promise<void> {
	const count = await prisma.user.count();
	if (count > 0) return;

	const org = await prisma.organization.create({
		data: {
			name: 'PrestaFacture',
			saasPlan: 'PRO',
			companyType: 'B2B',
			address: process.env.COMPANY_ADDRESS || '57000 Metz, France',
			siret: process.env.COMPANY_SIRET || null,
			email: process.env.COMPANY_EMAIL || 'contact@danielcraft.fr',
			phone: process.env.COMPANY_PHONE || null,
		},
	});
	const hashedPassword = await bcrypt.hash('prestafacture', 12); // compte local admin@prestafacture.local
	await prisma.user.create({
		data: {
			email: 'admin@prestafacture.local',
			password: hashedPassword,
			firstName: 'Admin',
			lastName: 'PrestaFacture',
			organizationId: org.id,
			status: 'ACTIVE',
			emailVerified: true,
			role: 'ADMIN',
		},
	});
}

/** Jeton API démo (dev uniquement) — valeur connue pour tester l’API publique. */
export const SEED_API_TOKEN_PLAIN = 'fact_seed_dev_demo_do_not_use_in_prod';

export async function seedApiAccessToken(prisma: PrismaClient, organizationId: number): Promise<void> {
	const existing = await prisma.apiAccessToken.findFirst({
		where: { organizationId, name: 'Seed — démo API' },
	});
	if (existing) return;

	const tokenHash = createHash('sha256').update(SEED_API_TOKEN_PLAIN, 'utf8').digest('hex');
	await prisma.apiAccessToken.create({
		data: {
			organizationId,
			name: 'Seed — démo API',
			tokenPrefix: SEED_API_TOKEN_PLAIN.slice(0, 16),
			tokenHash,
			permissions: JSON.stringify([
				'clients.read',
				'clients.write',
				'produits.read',
				'produits.write',
				'factures.read',
				'factures.write',
				'factures.send',
				'factures.refund',
				'devis.read',
				'devis.write',
				'devis.send',
			]),
		},
	});
	console.log(`   Jeton API démo : ${SEED_API_TOKEN_PLAIN}`);
}

/**
 * Supprime les données des tables pour permettre un seed propre.
 * Ignore les erreurs si une table n'existe pas (ex. Pack sans migration dédiée).
 */
export async function purgeAll(prisma: PrismaClient): Promise<void> {
	await prisma.apiAccessToken.deleteMany();
	// D'abord les tables liées aux factures (FK Invoice) et paiements
	await prisma.refund.deleteMany();
	await prisma.taxDeduction.deleteMany();
	await prisma.avoirApplication.deleteMany();
	await prisma.avoirLine.deleteMany();
	await prisma.avoir.deleteMany();
	await prisma.quoteView.deleteMany();
	await prisma.emailEvent.deleteMany();
	await prisma.quoteLine.deleteMany();
	await prisma.quote.deleteMany();
	await prisma.invoiceLine.deleteMany();
	await prisma.payment.deleteMany();
	await prisma.invoice.deleteMany();
	// Journal comptable (peut référencer des avoirs, etc.)
	await prisma.journalLine.deleteMany();
	await prisma.journalEntry.deleteMany();
	await prisma.filingLine.deleteMany();
	await prisma.authorityPayment.deleteMany();
	await prisma.filing.deleteMany();
	await prisma.subscription.deleteMany();
	await prisma.plan.deleteMany();
	await prisma.product.deleteMany();
	await deleteManyIfTableExists(prisma, 'pack', () => prisma.pack.deleteMany());
	await prisma.counter.deleteMany();
	// On garde Client, TaxRate, Account, Journal pour les seeds
}

/**
 * Exécute une suppression uniquement si la table existe (évite P2021 après reset sans migration Pack).
 */
async function deleteManyIfTableExists(_prisma: PrismaClient, tableName: string, deleteFn: () => Promise<unknown>): Promise<void> {
	try {
		await deleteFn();
	} catch (e: any) {
		const modelName = tableName.charAt(0).toUpperCase() + tableName.slice(1);
		if (e?.code === 'P2021' && (e?.meta?.modelName === modelName || e?.meta?.table?.endsWith(modelName))) {
			return;
		}
		throw e;
	}
}

