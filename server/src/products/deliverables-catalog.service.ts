import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeDeliverableLabelKey } from './deliverables-catalog.util';
import type { ProductDeliverable } from './product-deliverables.util';

export type DeliverableCatalogItemDto = {
	id: number;
	label: string;
	defaultAmount: number | null;
	defaultHours: number | null;
};

@Injectable()
export class DeliverablesCatalogService {
	constructor(private readonly prisma: PrismaService) {}

	async search(
		organizationId: number,
		q?: string,
		limit = 25,
	): Promise<DeliverableCatalogItemDto[]> {
		const trimmed = q?.trim() ?? '';
		const where: Prisma.DeliverableCatalogItemWhereInput = {
			organizationId,
			...(trimmed
				? {
						OR: [
							{ label: { contains: trimmed } },
							{ labelKey: { contains: normalizeDeliverableLabelKey(trimmed) } },
						],
					}
				: {}),
		};

		const items = await this.prisma.deliverableCatalogItem.findMany({
			where,
			orderBy: [{ updatedAt: 'desc' }, { label: 'asc' }],
			take: limit,
		});

		return items.map(toDto);
	}

	/** Enregistre ou met à jour les livrables saisis sur un produit. */
	async syncFromDeliverables(
		organizationId: number,
		deliverables: ProductDeliverable[],
	): Promise<void> {
		for (const d of deliverables) {
			const label = d.label?.trim();
			if (!label) continue;

			const labelKey = normalizeDeliverableLabelKey(label);
			const defaultAmount =
				d.amount != null && !Number.isNaN(d.amount) ? d.amount : undefined;
			const defaultHours =
				d.hours != null && !Number.isNaN(d.hours) ? Math.round(d.hours) : undefined;

			await this.prisma.deliverableCatalogItem.upsert({
				where: { organizationId_labelKey: { organizationId, labelKey } },
				create: {
					organizationId,
					label,
					labelKey,
					defaultAmount: defaultAmount ?? null,
					defaultHours: defaultHours ?? null,
				},
				update: {
					label,
					...(defaultAmount != null ? { defaultAmount } : {}),
					...(defaultHours != null ? { defaultHours } : {}),
				},
			});
		}
	}
}

function toDto(item: {
	id: number;
	label: string;
	defaultAmount: Prisma.Decimal | null;
	defaultHours: number | null;
}): DeliverableCatalogItemDto {
	return {
		id: item.id,
		label: item.label,
		defaultAmount: item.defaultAmount != null ? Number(item.defaultAmount) : null,
		defaultHours: item.defaultHours,
	};
}
