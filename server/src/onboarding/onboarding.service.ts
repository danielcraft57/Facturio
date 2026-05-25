import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CatalogPersonalizationService } from '../catalog/catalog-personalization.service';
import { getTechStackChoices } from '../catalog/catalog-data';

export type OnboardingStatus = {
	completed: boolean;
	onboardingCompletedAt: string | null;
	preferredTechnologies: string[];
	productCount: number;
};

@Injectable()
export class OnboardingService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly catalog: CatalogPersonalizationService,
	) {}

	async getStatus(organizationId: number): Promise<OnboardingStatus> {
		const org = await this.prisma.organization.findUnique({
			where: { id: organizationId },
			select: {
				onboardingCompletedAt: true,
				preferredTechnologies: true,
			},
		});
		if (!org) {
			throw new BadRequestException('Organisation introuvable');
		}

		const productCount = await this.prisma.product.count({
			where: { organizationId },
		});

		return {
			completed: !!org.onboardingCompletedAt,
			onboardingCompletedAt: org.onboardingCompletedAt?.toISOString() ?? null,
			preferredTechnologies: (org.preferredTechnologies as string[]) ?? [],
			productCount,
		};
	}

	getTechChoices() {
		return getTechStackChoices();
	}

	async previewInstall(organizationId: number, technologyIds: string[]) {
		this.catalog.validateSelection(technologyIds);
		const computed = await this.catalog.computeCatalog(technologyIds);
		const templates = await this.prisma.product.findMany({
			where: { id: { in: computed.productIds }, organizationId: null },
			select: {
				id: true,
				name: true,
				sku: true,
				unitPrice: true,
				languages: true,
				description: true,
			},
		});
		return {
			technologyIds,
			products: templates,
			total: templates.length,
		};
	}

	async install(organizationId: number, technologyIds: string[]) {
		const org = await this.prisma.organization.findUnique({
			where: { id: organizationId },
		});
		if (!org) {
			throw new BadRequestException('Organisation introuvable');
		}

		const result = await this.catalog.provisionOrganizationFromStack(
			organizationId,
			technologyIds,
			'onboarding',
		);

		return {
			message: 'Catalogue installé sur votre compte',
			clonedCount: result.clonedCount,
			productIds: result.productIds,
			skus: result.skus,
		};
	}
}
