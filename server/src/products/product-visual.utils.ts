import { CreateProductDto } from './dto/create-product.dto';

/** Noms d’icônes Font Awesome (slug) — alignés sur frontend/productIconOptions.ts */
export const PRODUCT_ICON_NAMES = [
	'box',
	'cloud',
	'code',
	'cart-shopping',
	'credit-card',
	'database',
	'globe',
	'image',
	'layer-group',
	'mobile-screen',
	'palette',
	'pen-nib',
	'plug',
	'rocket',
	'screwdriver-wrench',
	'server',
	'store',
	'tag',
	'wrench',
	'window-maximize',
	'magnifying-glass',
	'shield-halved',
	'chart-line',
	'users',
	'file-code',
	'gear',
	'lock',
	'bell',
	'envelope',
	'calendar',
	'truck',
	'headset',
	'briefcase',
	'lightbulb',
	'puzzle-piece',
	'robot',
	'gauge-high',
	'comments',
	'chart-pie',
	'file-invoice',
	'arrows-rotate',
	'satellite-dish',
	'envelope-open-text',
	'calendar-check',
	'wand-magic-sparkles',
	'react',
	'node-js',
	'stripe',
	'shopify',
	'aws',
] as const;

/** Clés bibliothèque — alignées sur frontend/productVisualLibrary.ts */
export const PRODUCT_LIBRARY_IDS = [
	'library:saas',
	'library:web',
	'library:ecommerce',
	'library:mobile',
	'library:api',
	'library:design',
	'library:hosting',
	'library:seo',
	'library:payment',
	'library:support',
	'library:security',
	'library:analytics',
	'library:ai-assistant',
	'library:automation',
	'library:crm',
	'library:newsletter',
	'library:booking',
	'library:monitoring',
	'library:migration',
	'library:dashboard',
	'library:forms',
	'library:marketplace',
] as const;

export const PRODUCT_ICON_GRADIENTS: ReadonlyArray<[string, string]> = [
	['#4f46e5', '#7c3aed'],
	['#0ea5e9', '#06b6d4'],
	['#059669', '#10b981'],
	['#db2777', '#f43f5e'],
	['#d97706', '#f59e0b'],
	['#7c3aed', '#ec4899'],
	['#1e3a8a', '#3b82f6'],
	['#047857', '#34d399'],
	['#4338ca', '#6366f1'],
	['#b45309', '#fbbf24'],
	['#991b1b', '#ef4444'],
	['#0f766e', '#2dd4bf'],
	['#4c1d95', '#8b5cf6'],
	['#1f2937', '#334155'],
	['#0f766e', '#14b8a6'],
	['#1d4ed8', '#38bdf8'],
	['#be123c', '#fb7185'],
	['#7f1d1d', '#ef4444'],
	['#0f172a', '#1d4ed8'],
	['#0369a1', '#22d3ee'],
	['#166534', '#4ade80'],
	['#854d0e', '#facc15'],
];

export const ICON_GRADIENT_PREFIX = 'icon-gradient:';

export type ProductIconName = (typeof PRODUCT_ICON_NAMES)[number];

export function pickRandomProductIconName(): ProductIconName {
	const index = Math.floor(Math.random() * PRODUCT_ICON_NAMES.length);
	return PRODUCT_ICON_NAMES[index]!;
}

export function pickRandomLibraryId(): (typeof PRODUCT_LIBRARY_IDS)[number] {
	const index = Math.floor(Math.random() * PRODUCT_LIBRARY_IDS.length);
	return PRODUCT_LIBRARY_IDS[index]!;
}

export function pickRandomIconGradient(): [string, string] {
	const index = Math.floor(Math.random() * PRODUCT_ICON_GRADIENTS.length);
	return PRODUCT_ICON_GRADIENTS[index]!;
}

export function formatIconGradient(gradient: [string, string]): string {
	return `${ICON_GRADIENT_PREFIX}${gradient[0]},${gradient[1]}`;
}

export function parseIconGradient(imageData?: string | null): [string, string] | null {
	if (!imageData?.startsWith(ICON_GRADIENT_PREFIX)) return null;
	const parts = imageData.slice(ICON_GRADIENT_PREFIX.length).split(',');
	if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
	return [parts[0], parts[1]];
}

export function isKnownProductIconName(name: string): name is ProductIconName {
	return (PRODUCT_ICON_NAMES as readonly string[]).includes(name);
}

export function isKnownLibraryId(id: string): boolean {
	return (PRODUCT_LIBRARY_IDS as readonly string[]).includes(id);
}

export type ResolvedProductVisual = {
	visualType: string;
	iconName: string | null;
	imageData: string | null;
};

export function resolveVisualOnCreate(data: CreateProductDto): ResolvedProductVisual {
	const explicitType = data.visualType?.trim();

	if (explicitType === 'library') {
		const imageData = data.imageData?.trim();
		return {
			visualType: 'library',
			iconName: null,
			imageData: imageData && isKnownLibraryId(imageData) ? imageData : pickRandomLibraryId(),
		};
	}

	if (explicitType === 'custom') {
		return {
			visualType: 'custom',
			iconName: data.iconName?.trim() || null,
			imageData: data.imageData ?? null,
		};
	}

	if (explicitType === 'icon') {
		const gradient = parseIconGradient(data.imageData) ?? pickRandomIconGradient();
		return {
			visualType: 'icon',
			iconName: data.iconName?.trim() || pickRandomProductIconName(),
			imageData: data.imageData?.trim() || formatIconGradient(gradient),
		};
	}

	// Visuel aléatoire : icône + dégradé (~55 %) ou bibliothèque (~45 %)
	if (Math.random() < 0.55) {
		return {
			visualType: 'icon',
			iconName: pickRandomProductIconName(),
			imageData: formatIconGradient(pickRandomIconGradient()),
		};
	}

	return {
		visualType: 'library',
		iconName: null,
		imageData: pickRandomLibraryId(),
	};
}
