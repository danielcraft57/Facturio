import { PrismaClient, Prisma, ProductKind } from '@prisma/client';

/**
 * Produits alignés sur V6 (danielcraft.fr) : transformation d'identité web (multi-supports),
 * SEO classique et SEO pour ChatGPT / IA, plus forfaits techniques et maintenance.
 */
export async function seedProducts(prisma: PrismaClient, taxIds: { def20Id: number; def10Id: number }): Promise<{
	productSaas: any;
	productService: any;
	productApp: any;
	productGood: any;
	siteVitrine: any;
	automatisation: any;
	auditOptim: any;
}> {
	const products = [
		// --- Forfaits V6 (ordre fixe pour le return) ---
		{
			name: 'Site Vitrine',
			sku: 'SITE-VITRINE',
			kind: 'SERVICE' as ProductKind,
			defaultTaxRateId: taxIds.def20Id,
			unitPrice: 490,
			category: 'THEME',
			languages: ['HTML', 'CSS', 'JavaScript', 'PHP'] as unknown as Prisma.JsonArray,
			estimatedHours: 40,
			description: 'Site vitrine responsive qui porte votre identité : design, intégration, contenu de base, formulaire de contact. Base propre pour une identité web cohérente. Hébergement et nom de domaine non inclus.'
		},
		{
			name: 'Applications métier & automatisation',
			sku: 'AUTO-METIER',
			kind: 'SERVICE' as ProductKind,
			defaultTaxRateId: taxIds.def20Id,
			unitPrice: 750,
			category: 'DEV',
			languages: ['TypeScript', 'React', 'NestJS', 'Node.js'] as unknown as Prisma.JsonArray,
			estimatedHours: 60,
			description: 'Développement d\'une application ou d\'outils d\'automatisation sur mesure (workflows, scripts, intégrations API).'
		},
		{
			name: 'Audit & Optimisation',
			sku: 'AUDIT-OPTIM',
			kind: 'SERVICE' as ProductKind,
			defaultTaxRateId: taxIds.def20Id,
			unitPrice: 650,
			category: 'SEO',
			languages: [] as unknown as Prisma.JsonArray,
			estimatedHours: 16,
			description: 'Audit de votre présence web (site ou application) : identité technique, performances, SEO, sécurité, UX. Rapport détaillé et plan d\'action pour une visibilité et une cohérence renforcées.'
		},
		{
			name: 'Support / Abonnement',
			sku: 'SUPPORT-ABO',
			kind: 'SAAS' as ProductKind,
			defaultTaxRateId: taxIds.def20Id,
			unitPrice: 25,
			category: 'MAINTENANCE',
			languages: [] as unknown as Prisma.JsonArray,
			estimatedHours: null,
			description: 'Abonnement support : assistance par email, mises à jour mineures, suivi technique mensuel.'
		},
		// --- Maintenance & hébergement ---
		{
			name: 'Maintenance site (mensuelle)',
			sku: 'MAINT-MENSUEL',
			kind: 'SERVICE' as ProductKind,
			defaultTaxRateId: taxIds.def20Id,
			unitPrice: 39,
			category: 'MAINTENANCE',
			languages: [] as unknown as Prisma.JsonArray,
			estimatedHours: 2,
			description: 'Maintenance mensuelle : mises à jour de sécurité, sauvegardes, surveillance et corrections mineures.'
		},
		{
			name: 'Hébergement + nom de domaine (annuel)',
			sku: 'HEBERG-DOMAIN',
			kind: 'SERVICE' as ProductKind,
			defaultTaxRateId: taxIds.def20Id,
			unitPrice: 79,
			category: 'HOSTING',
			languages: [] as unknown as Prisma.JsonArray,
			estimatedHours: 1,
			description: 'Hébergement web annuel + enregistrement ou renouvellement d\'un nom de domaine (.fr, .com, etc.).'
		},
		{
			name: 'Backup & sécurisation',
			sku: 'BACKUP-SECU',
			kind: 'SERVICE' as ProductKind,
			defaultTaxRateId: taxIds.def20Id,
			unitPrice: 99,
			category: 'MAINTENANCE',
			languages: [] as unknown as Prisma.JsonArray,
			estimatedHours: 4,
			description: 'Mise en place de sauvegardes automatiques, renforcement de la sécurité (SSL, headers, bonnes pratiques).'
		},
		// --- Évolutions site ---
		{
			name: 'Page supplémentaire (site vitrine)',
			sku: 'PAGE-SUPP',
			kind: 'SERVICE' as ProductKind,
			defaultTaxRateId: taxIds.def20Id,
			unitPrice: 65,
			category: 'CONTENT',
			languages: ['HTML', 'CSS'] as unknown as Prisma.JsonArray,
			estimatedHours: 2,
			description: 'Ajout d\'une page au site vitrine (structure, contenu, mise en forme).'
		},
		{
			name: 'Formulaire avancé / intégration',
			sku: 'FORM-AVANCE',
			kind: 'SERVICE' as ProductKind,
			defaultTaxRateId: taxIds.def20Id,
			unitPrice: 99,
			category: 'DEV',
			languages: ['JavaScript', 'PHP'] as unknown as Prisma.JsonArray,
			estimatedHours: 4,
			description: 'Création ou intégration d\'un formulaire avancé (validation, envoi par email, export, CRM).'
		},
		{
			name: 'Refonte visuelle légère',
			sku: 'REFONTE-LEGERE',
			kind: 'SERVICE' as ProductKind,
			defaultTaxRateId: taxIds.def20Id,
			unitPrice: 330,
			category: 'THEME',
			languages: ['HTML', 'CSS', 'JavaScript'] as unknown as Prisma.JsonArray,
			estimatedHours: 12,
			description: 'Refonte du design (couleurs, typo, mise en page) sans changement de structure ni de contenu.'
		},
		// --- Intégrations & technique ---
		{
			name: 'Intégration API / webhook',
			sku: 'INTEG-API',
			kind: 'SERVICE' as ProductKind,
			defaultTaxRateId: taxIds.def20Id,
			unitPrice: 150,
			category: 'API',
			languages: ['TypeScript', 'Node.js'] as unknown as Prisma.JsonArray,
			estimatedHours: 6,
			description: 'Connexion à une API tierce ou mise en place de webhooks (synchronisation données, automatisations).'
		},
		{
			name: 'Rapport de performances (one-shot)',
			sku: 'RAPPORT-PERF',
			kind: 'SERVICE' as ProductKind,
			defaultTaxRateId: taxIds.def20Id,
			unitPrice: 120,
			category: 'SEO',
			languages: [] as unknown as Prisma.JsonArray,
			estimatedHours: 3,
			description: 'Analyse des performances (Core Web Vitals, temps de chargement) et rapport avec recommandations.'
		},
		{
			name: 'SEO basique (audit + corrections)',
			sku: 'SEO-BASIQUE',
			kind: 'SERVICE' as ProductKind,
			defaultTaxRateId: taxIds.def20Id,
			unitPrice: 290,
			category: 'SEO',
			languages: [] as unknown as Prisma.JsonArray,
			estimatedHours: 8,
			description: 'Audit SEO (balises, structure, contenu) et corrections ciblées pour renforcer votre visibilité sur Google et la cohérence de votre identité en ligne.'
		},
		{
			name: 'Transformation d\'identité web (multi-supports)',
			sku: 'IDENTITE-MULTI',
			kind: 'SERVICE' as ProductKind,
			defaultTaxRateId: taxIds.def20Id,
			unitPrice: 990,
			category: 'THEME',
			languages: ['HTML', 'CSS', 'JavaScript'] as unknown as Prisma.JsonArray,
			estimatedHours: 24,
			description: 'Refonte cohérente de votre identité sur plusieurs supports : site web, pages réseaux sociaux, documents (charte, gabarits). Une identité unifiée et professionnelle partout où vous êtes visible.'
		},
		{
			name: 'SEO pour ChatGPT / découvrabilité IA',
			sku: 'SEO-CHATGPT',
			kind: 'SERVICE' as ProductKind,
			defaultTaxRateId: taxIds.def20Id,
			unitPrice: 490,
			category: 'SEO',
			languages: [] as unknown as Prisma.JsonArray,
			estimatedHours: 10,
			description: 'Optimisation pour que ChatGPT et autres assistants IA puissent citer et recommander votre marque : données structurées (Schema.org), contenus clairs, FAQ et formulations adaptées à la découverte par l\'IA.'
		},
		{
			name: 'Pack SEO (Google + ChatGPT)',
			sku: 'PACK-SEO-GOOGLE-CHATGPT',
			kind: 'SERVICE' as ProductKind,
			defaultTaxRateId: taxIds.def20Id,
			unitPrice: 699,
			category: 'SEO',
			languages: [] as unknown as Prisma.JsonArray,
			estimatedHours: 16,
			description: 'Pack visibilité : SEO basique (audit + corrections Google) + SEO pour ChatGPT / découvrabilité IA. Idéal pour commerces et artisans qui veulent être trouvés sur Google et recommandés par les assistants IA.'
		},
		// --- Formation & accompagnement ---
		{
			name: 'Formation à l\'outil (demi-journée)',
			sku: 'FORMATION-DEMI',
			kind: 'SERVICE' as ProductKind,
			defaultTaxRateId: taxIds.def20Id,
			unitPrice: 200,
			category: 'CONTENT',
			languages: [] as unknown as Prisma.JsonArray,
			estimatedHours: 4,
			description: 'Session de formation (demi-journée) à la prise en main de votre outil ou site (back-office, publication, bonnes pratiques).'
		},
		{
			name: 'Accompagnement technique (heure)',
			sku: 'ACCOMP-H',
			kind: 'SERVICE' as ProductKind,
			defaultTaxRateId: taxIds.def20Id,
			unitPrice: 60,
			category: 'MAINTENANCE',
			languages: ['TypeScript', 'React', 'NestJS'] as unknown as Prisma.JsonArray,
			estimatedHours: 1,
			description: 'Accompagnement technique à l\'heure : conseil, débogage, revue de code, aide à la mise en place d\'une fonctionnalité.'
		},
		{
			name: 'Support prioritaire (heure)',
			sku: 'SUPPORT-H',
			kind: 'SERVICE' as ProductKind,
			defaultTaxRateId: taxIds.def20Id,
			unitPrice: 70,
			category: 'MAINTENANCE',
			languages: [] as unknown as Prisma.JsonArray,
			estimatedHours: 1,
			description: 'Support prioritaire à l\'heure : réponse rapide, intervention ciblée, résolution de blocage.'
		},
		// --- Dépannage & contenu ---
		{
			name: 'Dépannage / intervention (forfait 2h)',
			sku: 'DEPANNAGE-2H',
			kind: 'SERVICE' as ProductKind,
			defaultTaxRateId: taxIds.def20Id,
			unitPrice: 120,
			category: 'MAINTENANCE',
			languages: [] as unknown as Prisma.JsonArray,
			estimatedHours: 2,
			description: 'Forfait 2 heures pour dépannage ou intervention technique (bug, correctif, petite évolution).'
		},
		{
			name: 'Mise à jour de contenu (pack 5h)',
			sku: 'MAJ-CONTENU-5H',
			kind: 'SERVICE' as ProductKind,
			defaultTaxRateId: taxIds.def20Id,
			unitPrice: 170,
			category: 'CONTENT',
			languages: [] as unknown as Prisma.JsonArray,
			estimatedHours: 5,
			description: 'Pack 5 heures pour mises à jour de contenu (textes, images, pages) sur votre site.'
		},
		{
			name: 'Certificat SSL + configuration',
			sku: 'SSL-CONFIG',
			kind: 'SERVICE' as ProductKind,
			defaultTaxRateId: taxIds.def20Id,
			unitPrice: 45,
			category: 'HOSTING',
			languages: [] as unknown as Prisma.JsonArray,
			estimatedHours: 1,
			description: 'Installation et configuration d\'un certificat SSL (HTTPS) sur votre hébergement.'
		},
		// --- Intelligence Artificielle & ChatGPT ---
		{
			name: 'Assistant IA FAQ pour site web',
			sku: 'IA-FAQ-SITE',
			kind: 'SERVICE' as ProductKind,
			defaultTaxRateId: taxIds.def20Id,
			unitPrice: 990,
			category: 'CONTENT',
			languages: ['JavaScript', 'TypeScript', 'ChatGPT API'] as unknown as Prisma.JsonArray,
			estimatedHours: 20,
			description: 'Mise en place d\'un assistant conversationnel (chatbot) sur votre site web qui répond automatiquement aux questions fréquentes de vos visiteurs. L\'assistant utilise ChatGPT pour comprendre les questions et fournir des réponses pertinentes basées sur vos contenus (FAQ, pages produits, documentation). Installation, configuration, personnalisation et formation incluses.'
		},
		{
			name: 'Assistant IA support client / email',
			sku: 'IA-SUPPORT-EMAIL',
			kind: 'SERVICE' as ProductKind,
			defaultTaxRateId: taxIds.def20Id,
			unitPrice: 1200,
			category: 'DEV',
			languages: ['Python', 'ChatGPT API', 'IMAP/SMTP'] as unknown as Prisma.JsonArray,
			estimatedHours: 25,
			description: 'Automatisation de vos réponses emails clients avec un assistant IA qui analyse les demandes et génère des réponses professionnelles. L\'assistant apprend de vos emails existants et s\'améliore au fil du temps. Configuration, analyse de vos emails, création de templates, intégration avec votre boîte email et formation incluses.'
		},
		{
			name: 'Générateur de contenus web par IA',
			sku: 'IA-CONTENUS-WEB',
			kind: 'SERVICE' as ProductKind,
			defaultTaxRateId: taxIds.def20Id,
			unitPrice: 650,
			category: 'CONTENT',
			languages: ['ChatGPT API', 'Python'] as unknown as Prisma.JsonArray,
			estimatedHours: 12,
			description: 'Création automatisée de contenus pour votre site web (articles de blog, descriptions produits, pages de service) grâce à l\'IA. Vous fournissez les sujets et l\'IA génère des textes optimisés SEO, adaptés à votre secteur. Génération de 10-15 contenus, optimisation SEO, adaptation au ton de votre marque, révision et corrections manuelles incluses.'
		},
		{
			name: 'Assistant IA rédaction commerciale',
			sku: 'IA-REDACTION-COMMERCIALE',
			kind: 'SERVICE' as ProductKind,
			defaultTaxRateId: taxIds.def20Id,
			unitPrice: 490,
			category: 'CONTENT',
			languages: ['ChatGPT API', 'JavaScript'] as unknown as Prisma.JsonArray,
			estimatedHours: 10,
			description: 'Mise en place d\'un outil personnalisé qui génère automatiquement vos emails commerciaux, devis, propositions commerciales et messages LinkedIn. L\'assistant connaît votre offre et adapte le ton selon le contexte. Configuration avec vos offres et tarifs, création de templates, formation à l\'utilisation et accès à l\'interface web inclus.'
		},
		{
			name: 'Analyse de données avec IA / Insights automatiques',
			sku: 'IA-ANALYSE-DONNEES',
			kind: 'SERVICE' as ProductKind,
			defaultTaxRateId: taxIds.def20Id,
			unitPrice: 1450,
			category: 'DEV',
			languages: ['Python', 'ChatGPT API', 'Pandas', 'NumPy'] as unknown as Prisma.JsonArray,
			estimatedHours: 30,
			description: 'Création d\'un système d\'analyse automatique de vos données métier (ventes, clients, performances) avec génération de rapports intelligents et recommandations par l\'IA. L\'outil identifie des tendances, anomalies et opportunités. Analyse de vos données existantes, création d\'un tableau de bord avec insights IA, génération automatique de rapports mensuels et formation incluses.'
		},
		{
			name: 'Chatbot IA pour e-commerce / vente assistée',
			sku: 'IA-CHATBOT-ECOMMERCE',
			kind: 'SERVICE' as ProductKind,
			defaultTaxRateId: taxIds.def20Id,
			unitPrice: 1600,
			category: 'ECOMMERCE',
			languages: ['JavaScript', 'ChatGPT API', 'TypeScript'] as unknown as Prisma.JsonArray,
			estimatedHours: 35,
			description: 'Assistant conversationnel intelligent pour votre boutique en ligne qui guide les visiteurs, répond aux questions produits, propose des recommandations et peut même aider à finaliser une commande. Installation sur votre site e-commerce, connexion à votre catalogue produits, configuration des scénarios de vente assistée, personnalisation et formation incluses.'
		},
		{
			name: 'Automatisation de tâches répétitives avec IA',
			sku: 'IA-AUTOMATISATION-TACHES',
			kind: 'SERVICE' as ProductKind,
			defaultTaxRateId: taxIds.def20Id,
			unitPrice: 1200,
			category: 'DEV',
			languages: ['Python', 'ChatGPT API', 'TypeScript'] as unknown as Prisma.JsonArray,
			estimatedHours: 25,
			description: 'Automatisation de vos tâches répétitives (tri d\'emails, classification de documents, extraction d\'informations, génération de rapports) grâce à l\'IA. Audit de vos processus, développement des automatisations avec IA, tests et validation, formation à l\'utilisation, documentation technique et support inclus.'
		},
		{
			name: 'Maintenance mensuelle assistant IA',
			sku: 'IA-MAINTENANCE-MENSUEL',
			kind: 'SAAS' as ProductKind,
			defaultTaxRateId: taxIds.def20Id,
			unitPrice: 75,
			category: 'MAINTENANCE',
			languages: [] as unknown as Prisma.JsonArray,
			estimatedHours: 2,
			description: 'Maintenance et amélioration continue de votre assistant IA : ajustement des réponses, ajout de nouvelles connaissances, optimisation des performances, suivi des métriques. Abonnement mensuel.'
		},
		{
			name: 'Ajout de nouvelles fonctionnalités IA',
			sku: 'IA-EVOLUTION-FEATURE',
			kind: 'SERVICE' as ProductKind,
			defaultTaxRateId: taxIds.def20Id,
			unitPrice: 330,
			category: 'DEV',
			languages: ['ChatGPT API', 'JavaScript', 'Python'] as unknown as Prisma.JsonArray,
			estimatedHours: 6,
			description: 'Ajout d\'une nouvelle fonctionnalité à votre assistant IA existant (ex: intégration avec un outil tiers, nouvelle source de données, nouveau type de réponse).'
		},
		{
			name: 'Audit de votre utilisation IA',
			sku: 'IA-AUDIT-USAGE',
			kind: 'SERVICE' as ProductKind,
			defaultTaxRateId: taxIds.def20Id,
			unitPrice: 400,
			category: 'SEO',
			languages: [] as unknown as Prisma.JsonArray,
			estimatedHours: 8,
			description: 'Audit de votre utilisation actuelle de l\'IA (ChatGPT, outils existants) pour identifier les opportunités d\'amélioration et de nouveaux cas d\'usage rentables. Rapport détaillé avec recommandations concrètes.'
		},
		// --- Autres prestations (conseil, intégration, migration) ---
		{
			name: 'Conseil technique / architecture',
			sku: 'CONSEIL-ARCHI',
			kind: 'SERVICE' as ProductKind,
			defaultTaxRateId: taxIds.def20Id,
			unitPrice: 380,
			category: 'DEV',
			languages: [] as unknown as Prisma.JsonArray,
			estimatedHours: 8,
			description: 'Étude de faisabilité et recommandations techniques avant un projet : choix des technologies, architecture cible, estimation des coûts et des délais. Livrable : rapport de conseil avec plan d\'action priorisé.'
		},
		{
			name: 'Intégration CRM ou outil métier',
			sku: 'INTEG-CRM',
			kind: 'SERVICE' as ProductKind,
			defaultTaxRateId: taxIds.def20Id,
			unitPrice: 290,
			category: 'API',
			languages: ['TypeScript', 'Python', 'Node.js'] as unknown as Prisma.JsonArray,
			estimatedHours: 10,
			description: 'Connexion de votre site ou application à un CRM, outil de facturation, logiciel métier ou base de données externe. Synchronisation des données, webhooks ou API sur mesure selon vos besoins.'
		},
		{
			name: 'Script de migration de données',
			sku: 'MIGRATION-DONNEES',
			kind: 'SERVICE' as ProductKind,
			defaultTaxRateId: taxIds.def20Id,
			unitPrice: 330,
			category: 'DEV',
			languages: ['Python', 'TypeScript', 'Node.js'] as unknown as Prisma.JsonArray,
			estimatedHours: 12,
			description: 'Migration de vos données d\'un système vers un autre (Excel vers base de données, ancien CMS vers nouveau, export/import entre outils). Script sécurisé, traçabilité et vérification des données.'
		}
	];

	const created: any[] = [];
	for (const p of products) {
		const existing = await prisma.product.findFirst({ where: { sku: p.sku } });
		if (!existing) {
			created.push(await prisma.product.create({ data: p as any }));
		} else {
			const updated = await prisma.product.update({
				where: { id: existing.id },
				data: {
					category: (p as any).category ?? undefined,
					languages: (p as any).languages ?? undefined,
					estimatedHours: (p as any).estimatedHours ?? undefined,
					description: (p as any).description ?? undefined
				} as Prisma.ProductUncheckedUpdateInput
			});
			created.push(updated);
		}
	}

	return {
		productSaas: created[3],
		productService: created[0],
		productApp: created[1],
		productGood: created[2],
		siteVitrine: created[0],
		automatisation: created[1],
		auditOptim: created[2]
	};
}

/**
 * Plans d'abonnement (Support) pour les seeds d'abonnements.
 */
export async function seedPlans(prisma: PrismaClient, productSaas: any): Promise<{ planMonthly: any; planYearly: any; planEnterprise: any }> {
	const plans = [
		{
			productId: productSaas.id,
			name: 'Support mensuel',
			amount: 29,
			currency: 'EUR',
			interval: 'MONTH',
			trialDays: 14
		},
		{
			productId: productSaas.id,
			name: 'Support annuel',
			amount: 290,
			currency: 'EUR',
			interval: 'YEAR',
			trialDays: 30
		},
		{
			productId: productSaas.id,
			name: 'Support prioritaire',
			amount: 99,
			currency: 'EUR',
			interval: 'MONTH',
			metered: true
		}
	];

	const created: any[] = [];
	for (const p of plans) {
		const existing = await prisma.plan.findFirst({
			where: { productId: productSaas.id, name: p.name }
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
