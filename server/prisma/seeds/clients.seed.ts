import { PrismaClient } from '@prisma/client';
import { withEntityId } from '../../src/common/entity-id';

export async function seedClients(prisma: PrismaClient, ctx: { def10Id: number; organizationId?: number }): Promise<any[]> {
	const { def10Id: taxDef10Id, organizationId } = ctx;
	const clients = [
		{
			name: 'ACME France',
			email: 'fr@acme.test',
			isCompany: true,
			companyName: 'ACME France SARL',
			vatNumber: 'FR12345678901',
			countryCode: 'FR',
			address: '10 Rue de la Paix',
			taxRateOverrideId: null
		},
		{
			name: 'EU GmbH',
			email: 'de@eu-b2b.test',
			isCompany: true,
			companyName: 'EU GmbH',
			vatNumber: 'DE123456789',
			countryCode: 'DE',
			address: 'Berliner Straße 42',
			taxRateOverrideId: null
		},
		{
			name: 'US Corp',
			email: 'us@export.test',
			isCompany: true,
			companyName: 'US Corporation',
			vatNumber: null,
			countryCode: 'US',
			address: '123 Main Street, New York',
			taxRateOverrideId: null
		},
		{
			name: 'Jean Client',
			email: 'b2c@home.test',
			isCompany: false,
			companyName: null,
			vatNumber: null,
			countryCode: 'FR',
			address: '5 Avenue des Fleurs',
			taxRateOverrideId: taxDef10Id
		},
		{
			name: 'Exempt SARL',
			email: 'exempt@company.test',
			isCompany: true,
			companyName: 'Exempt SARL',
			vatNumber: 'FR98765432109',
			countryCode: 'FR',
			address: '20 Boulevard Exemption',
			isVatExempt: true,
			taxRateOverrideId: null
		},
		{
			name: 'TechCorp Belgium',
			email: 'be@techcorp.test',
			isCompany: true,
			companyName: 'TechCorp Belgium SA',
			vatNumber: 'BE0123456789',
			countryCode: 'BE',
			address: 'Avenue Louise 123, Bruxelles',
			taxRateOverrideId: null
		},
		{
			name: 'Startup Innovante',
			email: 'startup@innov.test',
			isCompany: true,
			companyName: 'Startup Innovante SAS',
			vatNumber: 'FR11122233344',
			countryCode: 'FR',
			address: '15 Rue de l\'Innovation, Paris',
			taxRateOverrideId: null
		},
		{
			name: 'Marie Dupont',
			email: 'marie.dupont@example.com',
			isCompany: false,
			companyName: null,
			vatNumber: null,
			countryCode: 'FR',
			address: '8 Rue du Commerce, Lyon',
			taxRateOverrideId: null
		},
		// Clients orientés devis (PME / projets V6)
		{
			name: 'Boulangerie Martin',
			email: 'contact@boulangerie-martin.fr',
			isCompany: true,
			companyName: 'Boulangerie Martin SARL',
			vatNumber: 'FR55443322110',
			countryCode: 'FR',
			address: '12 Place du Marché, Metz',
			taxRateOverrideId: null
		},
		{
			name: 'Restaurant Le Gourmet',
			email: 'reservation@legourmet.fr',
			isCompany: true,
			companyName: 'Le Gourmet SAS',
			vatNumber: 'FR77889900112',
			countryCode: 'FR',
			address: '5 Rue des Chefs, Nancy',
			taxRateOverrideId: null
		},
		{
			name: 'Cabinet Compta Plus',
			email: 'direction@comptaplus.fr',
			isCompany: true,
			companyName: 'Compta Plus SARL',
			vatNumber: 'FR99887766554',
			countryCode: 'FR',
			address: '3 Avenue de la Gare, Strasbourg',
			taxRateOverrideId: null
		}
	];

	const created = [];
	for (const c of clients) {
		const data = { ...c, organizationId: organizationId ?? undefined };
		const existing = await prisma.client.findUnique({ where: { email: c.email } });
		if (!existing) {
			created.push(await prisma.client.create({ data: withEntityId(data) }));
		} else {
			await prisma.client.update({ where: { email: c.email }, data });
			created.push(existing);
		}
	}

	return created;
}

