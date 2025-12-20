import { PrismaClient } from '@prisma/client';
import type { SeedContext } from './base.seed';

export async function seedPacks(prisma: PrismaClient, products: any): Promise<void> {
	const packs = [
		{
			name: 'Pack Site Web Basique',
			type: 'WEBSITE',
			description: 'Site web vitrine avec 5 pages',
			details: 'Inclut design, développement, hébergement 1 an, formation',
			products: JSON.stringify([String(products.productSaas.id), String(products.productService.id)]),
			totalHours: 40,
			totalPrice: 2500,
			isTemplate: true,
			features: JSON.stringify(['5 pages', 'Design responsive', 'Formulaire de contact', 'Hébergement 1 an', 'Formation']),
			deliveryTime: 30
		},
		{
			name: 'Pack E-commerce Standard',
			type: 'ECOMMERCE',
			description: 'Boutique en ligne complète',
			details: 'Catalogue produits, panier, paiement, gestion commandes, dashboard admin',
			products: JSON.stringify([String(products.productSaas.id), String(products.productService.id)]),
			totalHours: 120,
			totalPrice: 8000,
			isTemplate: true,
			features: JSON.stringify(['Catalogue illimité', 'Panier', 'Paiement sécurisé', 'Gestion commandes', 'Tableau de bord', 'Multi-langues']),
			deliveryTime: 60
		},
		{
			name: 'Pack SaaS Starter',
			type: 'SAAS',
			description: 'Application SaaS de base',
			details: 'Authentification, base de données, API REST, dashboard, documentation',
			products: JSON.stringify([String(products.productSaas.id), String(products.productApp.id)]),
			totalHours: 200,
			totalPrice: 15000,
			isTemplate: true,
			features: JSON.stringify(['Authentification', 'Base de données', 'API REST', 'Dashboard admin', 'Documentation', 'Tests']),
			deliveryTime: 90
		},
		{
			name: 'Pack Premium E-commerce',
			type: 'ECOMMERCE',
			description: 'Solution e-commerce avancée',
			details: 'Toutes les fonctionnalités du pack standard + marketplace, multi-vendeurs, analytics avancés',
			products: JSON.stringify([String(products.productSaas.id), String(products.productService.id), String(products.productApp.id)]),
			totalHours: 300,
			totalPrice: 25000,
			isTemplate: false,
			features: JSON.stringify(['Marketplace', 'Multi-vendeurs', 'Analytics', 'CRM intégré', 'Support prioritaire']),
			deliveryTime: 120
		},
		{
			name: 'Pack Application Mobile',
			type: 'SAAS',
			description: 'Application mobile iOS et Android',
			details: 'App native iOS et Android avec backend, API, notifications push',
			products: JSON.stringify([String(products.productApp.id), String(products.productService.id)]),
			totalHours: 400,
			totalPrice: 35000,
			isTemplate: false,
			features: JSON.stringify(['iOS et Android', 'Backend API', 'Notifications push', 'Analytics', 'Store optimization']),
			deliveryTime: 150
		}
	];

	for (const pack of packs) {
		await prisma.pack.create({
			data: pack as any
		});
	}
}

