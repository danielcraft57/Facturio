import { PrismaClient, ProductKind } from '@prisma/client';
import type { SeedContext } from './base.seed';

export async function seedProducts(prisma: PrismaClient, taxIds: { def20Id: number; def10Id: number }): Promise<{ productSaas: any; productService: any; productApp: any; productGood: any }> {
	const products = [
		{
			name: 'Facturio Pro',
			sku: 'FF-PRO',
			kind: 'SAAS' as ProductKind,
			defaultTaxRateId: taxIds.def20Id,
			unitPrice: 49
		},
		{
			name: 'Audit fiscal',
			sku: 'AUDIT-SERV',
			kind: 'SERVICE' as ProductKind,
			defaultTaxRateId: taxIds.def10Id,
			unitPrice: 150
		},
		{
			name: 'Application mobile iOS',
			sku: 'APP-IOS',
			kind: 'APP' as ProductKind,
			defaultTaxRateId: taxIds.def20Id,
			unitPrice: 5000
		},
		{
			name: 'Licence logiciel',
			sku: 'LIC-SOFT',
			kind: 'GOOD' as ProductKind,
			defaultTaxRateId: taxIds.def20Id,
			unitPrice: 299
		},
		{
			name: 'Conseil stratégie',
			sku: 'CONS-STRAT',
			kind: 'SERVICE' as ProductKind,
			defaultTaxRateId: taxIds.def10Id,
			unitPrice: 200
		},
		{
			name: 'Formation sur site',
			sku: 'FORM-ONSITE',
			kind: 'SERVICE' as ProductKind,
			defaultTaxRateId: taxIds.def10Id,
			unitPrice: 800
		},
		{
			name: 'Maintenance annuelle',
			sku: 'MAINT-ANNUEL',
			kind: 'SERVICE' as ProductKind,
			defaultTaxRateId: taxIds.def20Id,
			unitPrice: 1200
		},
		{
			name: 'Support premium',
			sku: 'SUPP-PREM',
			kind: 'SERVICE' as ProductKind,
			defaultTaxRateId: taxIds.def20Id,
			unitPrice: 99
		}
	];

	const created = [];
	for (const p of products) {
		const existing = await prisma.product.findFirst({ where: { sku: p.sku } });
		if (!existing) {
			created.push(await prisma.product.create({ data: p }));
		} else {
			created.push(existing);
		}
	}

	return {
		productSaas: created[0],
		productService: created[1],
		productApp: created[2],
		productGood: created[3]
	};
}

export async function seedPlans(prisma: PrismaClient, productSaas: any): Promise<{ planMonthly: any; planYearly: any; planEnterprise: any }> {
	const plans = [
		{
			productId: productSaas.id,
			name: 'Pro mensuel',
			amount: 29,
			currency: 'EUR',
			interval: 'MONTH',
			trialDays: 14
		},
		{
			productId: productSaas.id,
			name: 'Pro annuel',
			amount: 290,
			currency: 'EUR',
			interval: 'YEAR',
			trialDays: 30
		},
		{
			productId: productSaas.id,
			name: 'Enterprise',
			amount: 99,
			currency: 'EUR',
			interval: 'MONTH',
			metered: true
		}
	];

	const created = [];
	for (const p of plans) {
		const existing = await prisma.plan.findFirst({
			where: { productId: p.productId, name: p.name }
		});
		if (!existing) {
			created.push(await prisma.plan.create({ data: p as any }));
		} else {
			created.push(existing);
		}
	}

	return {
		planMonthly: created[0],
		planYearly: created[1],
		planEnterprise: created[2]
	};
}
