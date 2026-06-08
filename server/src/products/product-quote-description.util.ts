import type { TechAssemblyCategory, TechStackAssembly } from '../catalog/tech-assembly.types';
import {
	TECH_ASSEMBLY_CATEGORY_LABELS,
	TECH_ASSEMBLY_CATEGORY_ORDER,
} from '../catalog/tech-assembly.types';
import { flattenTechAssembly } from '../catalog/tech-assembly.utils';
import {
	type ProductDeliverable,
	deliverablesHaveAmounts,
	parseProductDeliverables,
	sumDeliverableAmounts,
} from './product-deliverables.util';

export type QuoteLineDeliverable = {
	label: string;
	amount?: number;
	hours?: number;
};

export type QuoteLineTechItem = {
	label: string;
	explain: string;
};

export type QuoteLineTechLayer = {
	category: string;
	categoryHelp: string;
	items: QuoteLineTechItem[];
};

export type QuoteLineDisplay = {
	title: string;
	summary?: string;
	deliverables?: QuoteLineDeliverable[];
	/** Somme des montants par livrable (si toutes les lignes ont un montant). */
	priceBreakdownTotal?: number;
	techLayers?: QuoteLineTechLayer[];
};

type ProductLike = {
	name: string;
	description?: string | null;
	details?: unknown;
	techStack?: unknown;
	languages?: unknown;
};

const CATEGORY_HELP: Record<TechAssemblyCategory, string> = {
	languages: 'Langages utilisés pour le développement',
	frontend: 'Interface visible à l’écran',
	backend: 'Serveur et logique métier',
	cms: 'Gestion des contenus sans code',
	databases: 'Stockage des données',
	devops: 'Hébergement et déploiement',
	ai: 'Fonctions intelligentes',
	mobile: 'Application mobile',
	security: 'Sécurité',
};

/** Explications grand public pour les technos courantes (clé = nom normalisé). */
const TECH_LAY_EXPLAIN: Record<string, string> = {
	html: 'structure des pages web',
	css: 'mise en forme et design visuel',
	javascript: 'interactivité et animations sur le site',
	typescript: 'développement fiable et maintenable',
	react: 'interface web moderne et réactive',
	'next.js': 'site rapide avec bon référencement Google',
	'vue.js': 'interface web légère et performante',
	angular: 'application web structurée pour gros projets',
	nestjs: 'serveur robuste pour applications métier',
	'node.js': 'serveur web léger et rapide',
	graphql: 'échange de données optimisé entre services',
	postgresql: 'base de données professionnelle et sécurisée',
	supabase: 'base de données avec authentification intégrée',
	wordpress: 'site modifiable via un back-office',
	'html / css': 'structure et design des pages web',
	mysql: 'base de données pour le site',
	mariadb: 'base de données pour le site',
	php: 'langage serveur éprouvé pour sites et CMS',
	perl: 'scripts et traitements serveur historiques',
	'vb.net': 'applications métier Microsoft',
	jquery: 'interactivité web classique et compatible',
	bootstrap: 'mise en page responsive rapide',
	'asp.net': 'applications web Microsoft',
	'.net': 'écosystème Microsoft pour applications métier',
	laravel: 'framework PHP moderne et structuré',
	symfony: 'framework PHP robuste pour projets complexes',
	python: 'traitement de données et automatisation',
	fastapi: 'API rapide pour applications sur mesure',
	docker: 'déploiement reproductible et isolé',
	kubernetes: 'infrastructure scalable pour applications',
	vercel: 'hébergement rapide avec mises à jour automatiques',
	aws: 'infrastructure cloud professionnelle',
	nginx: 'serveur web performant et sécurisé',
	openai: 'intelligence artificielle (ChatGPT et assistants)',
	chatgpt: 'assistant conversationnel pour vos visiteurs',
	n8n: 'automatisation de tâches répétitives',
	owasp: 'audit des failles de sécurité courantes',
	linux: 'serveur stable pour héberger le site',
	stripe: 'paiement en ligne sécurisé par carte',
};

function normalizeTechKey(label: string): string {
	return label.trim().toLowerCase();
}

export function explainTechForLayperson(label: string): string {
	const key = normalizeTechKey(label);
	if (TECH_LAY_EXPLAIN[key]) return TECH_LAY_EXPLAIN[key];
	// Alias partiels (clé la plus longue en priorité)
	const partial = Object.entries(TECH_LAY_EXPLAIN)
		.filter(([k]) => key.includes(k) || k.includes(key))
		.sort(([a], [b]) => b.length - a.length)[0];
	return partial?.[1] ?? '';
}

function collectTechLabels(layers: QuoteLineTechLayer[]): Set<string> {
	const labels = new Set<string>();
	for (const layer of layers) {
		for (const item of layer.items) {
			labels.add(normalizeTechKey(item.label));
		}
	}
	return labels;
}

function dedupeDeliverables(
	deliverables: ProductDeliverable[],
	techLayers: QuoteLineTechLayer[],
	summary?: string,
): ProductDeliverable[] {
	const techLabels = collectTechLabels(techLayers);
	const summaryLower = summary?.toLowerCase() ?? '';
	return deliverables.filter((d) => {
		const key = normalizeTechKey(d.label);
		if (techLabels.has(key)) return false;
		if (summaryLower && summaryLower.includes(d.label.trim().toLowerCase())) return false;
		return true;
	});
}

function toQuoteDeliverables(items: ProductDeliverable[]): QuoteLineDeliverable[] {
	return items.map((d) => ({
		label: d.label,
		...(d.amount != null && !Number.isNaN(d.amount) ? { amount: d.amount } : {}),
		...(d.hours != null && !Number.isNaN(d.hours) ? { hours: d.hours } : {}),
	}));
}

function parseTechStack(raw: unknown): TechStackAssembly | null {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
	return raw as TechStackAssembly;
}

function parseLanguages(raw: unknown): string[] {
	if (Array.isArray(raw)) return raw.map((l) => String(l).trim()).filter(Boolean);
	if (typeof raw === 'string') {
		return raw.split(',').map((s) => s.trim()).filter(Boolean);
	}
	return [];
}

function buildTechLayers(product: ProductLike): QuoteLineTechLayer[] {
	const assembly = parseTechStack(product.techStack);
	const layers: QuoteLineTechLayer[] = [];

	if (assembly) {
		for (const cat of TECH_ASSEMBLY_CATEGORY_ORDER) {
			const items = assembly[cat];
			if (!items?.length) continue;
			layers.push({
				category: TECH_ASSEMBLY_CATEGORY_LABELS[cat],
				categoryHelp: CATEGORY_HELP[cat],
				items: items.map((label) => ({
					label,
					explain: explainTechForLayperson(label),
				})),
			});
		}
	}

	if (layers.length === 0) {
		const flat = parseLanguages(product.languages);
		if (flat.length) {
			layers.push({
				category: 'Technologies',
				categoryHelp: 'Outils et langages utilisés pour réaliser la prestation',
				items: flat.map((label) => ({
					label,
					explain: explainTechForLayperson(label),
				})),
			});
		}
	}

	return layers;
}

export function buildProductQuoteLineDisplay(product: ProductLike): QuoteLineDisplay {
	const techLayers = buildTechLayers(product);
	const summary = product.description?.trim() || undefined;
	const parsed = dedupeDeliverables(
		parseProductDeliverables(product.details),
		techLayers,
		summary,
	);
	const deliverables = toQuoteDeliverables(parsed);
	const priceBreakdownTotal = sumDeliverableAmounts(parsed);

	return {
		title: product.name.trim(),
		...(summary ? { summary } : {}),
		...(deliverables.length ? { deliverables } : {}),
		...(priceBreakdownTotal != null && deliverablesHaveAmounts(parsed)
			? { priceBreakdownTotal }
			: {}),
		...(techLayers.length ? { techLayers } : {}),
	};
}

/** Texte brut (fallback email / aperçu simple). */
export function formatQuoteLineDisplayAsText(display: QuoteLineDisplay): string {
	const parts: string[] = [display.title];
	if (display.summary) parts.push('', display.summary);
	if (display.deliverables?.length) {
		parts.push('', 'Ce qui est inclus :');
		for (const d of display.deliverables) {
			const amount =
				d.amount != null ? ` — ${d.amount.toLocaleString('fr-FR')} € HT` : '';
			parts.push(`• ${d.label}${amount}`);
		}
		if (display.priceBreakdownTotal != null) {
			parts.push(
				`Total répartition : ${display.priceBreakdownTotal.toLocaleString('fr-FR')} € HT`,
			);
		}
	}
	if (display.techLayers?.length) {
		parts.push('', 'Technologies (en termes simples) :');
		for (const layer of display.techLayers) {
			parts.push(`${layer.category} — ${layer.categoryHelp}`);
			for (const item of layer.items) {
				parts.push(`  • ${item.label} : ${item.explain}`);
			}
		}
	}
	return parts.join('\n');
}

export function buildProductQuoteLineDescription(product: ProductLike): string {
	return formatQuoteLineDisplayAsText(buildProductQuoteLineDisplay(product));
}

/** Hauteur utile pour estimer la place dans le tableau PDF. */
export function estimateQuoteLineDisplayHeight(
	display: QuoteLineDisplay,
	lineGap = 2,
): number {
	let lines = 1; // title
	if (display.summary) lines += 2;
	if (display.deliverables?.length) {
		lines += 1 + display.deliverables.length;
		if (display.priceBreakdownTotal != null) lines += 1;
	}
	if (display.techLayers?.length) {
		lines += 1;
		for (const layer of display.techLayers) {
			lines += 1 + layer.items.length * (layer.items.length > 1 ? 1 : 0);
		}
	}
	return lines * (9 + lineGap) + 8;
}

export function productHasEnrichableContent(product: ProductLike): boolean {
	const deliverables = parseProductDeliverables(product.details);
	const tech = flattenTechAssembly(parseTechStack(product.techStack) ?? undefined);
	const langs = parseLanguages(product.languages);
	return Boolean(
		product.description?.trim() ||
			deliverables.length > 0 ||
			tech.length ||
			langs.length,
	);
}
