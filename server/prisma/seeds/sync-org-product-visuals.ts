import type { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

type LegacyVisual = {
	visualType: string;
	imageData: string | null;
	iconName: string | null;
};

type LegacyMeta = { visuals: Record<string, LegacyVisual> };

function loadLegacyVisuals(): Record<string, LegacyVisual> {
	const path = join(process.cwd(), 'data/catalog/legacy-catalog-meta.json');
	const raw = readFileSync(path, 'utf8') as string;
	return (JSON.parse(raw) as LegacyMeta).visuals;
}

function needsVisualRepair(visualType: string | null, imageData: string | null): boolean {
	if (visualType === 'library' && imageData?.startsWith('library:')) return false;
	if (visualType === 'custom' && imageData) return false;
	if (visualType === 'icon' && imageData?.startsWith('icon-gradient:')) return false;
	return true;
}

/**
 * Répare visuels des produits org (clones v1 sans imageData) à partir des templates globaux ou legacy JSON.
 */
export async function syncOrganizationProductVisuals(prisma: PrismaClient): Promise<number> {
	const legacyVisuals = loadLegacyVisuals();
	const templates = await prisma.product.findMany({
		where: { organizationId: null, sku: { not: null } },
		select: { sku: true, visualType: true, iconName: true, imageData: true },
	});
	const templateBySku = new Map(templates.map((t) => [t.sku!, t]));

	const orgProducts = await prisma.product.findMany({
		where: { organizationId: { not: null }, sku: { not: null } },
		select: { id: true, sku: true, visualType: true, iconName: true, imageData: true },
	});

	let updated = 0;
	for (const product of orgProducts) {
		if (!needsVisualRepair(product.visualType, product.imageData)) continue;
		const sku = product.sku!;
		const source = templateBySku.get(sku) ?? legacyVisuals[sku];
		if (!source) continue;

		await prisma.product.update({
			where: { id: product.id },
			data: {
				visualType: source.visualType,
				iconName: source.iconName,
				imageData: source.imageData,
			},
		});
		updated++;
	}
	return updated;
}
