import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CatalogPersonalizationService } from '../catalog/catalog-personalization.service';
import { getTechStackChoices } from '../catalog/catalog-data';
import {
	getOnboardingProfilesFile,
	normalizeOnboardingProfileId,
} from '../catalog/onboarding-profiles';

export type OnboardingStatus = {
	completed: boolean;
	onboardingCompletedAt: string | null;
	preferredTechnologies: string[];
	devProfile: string | null;
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
				devProfile: true,
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
			devProfile: normalizeOnboardingProfileId(org.devProfile) ?? org.devProfile ?? null,
			productCount,
		};
	}

	getTechChoices() {
		return getTechStackChoices();
	}

	getProfiles() {
		return getOnboardingProfilesFile();
	}

	async previewInstall(organizationId: number, technologyIds: string[]) {
		return this.catalog.buildCatalogPreview(technologyIds);
	}

	async install(
		organizationId: number,
		technologyIds: string[],
		devProfile?: string,
		templateProductIds?: number[],
	) {
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
			{
				...(devProfile
					? { devProfile: normalizeOnboardingProfileId(devProfile) ?? devProfile }
					: {}),
				...(templateProductIds?.length ? { templateProductIds } : {}),
			},
		);

		return {
			message: 'Catalogue installé sur votre compte',
			clonedCount: result.clonedCount,
			productIds: result.productIds,
			skus: result.skus,
			deliverablesIndexed: result.deliverablesIndexed,
		};
	}
}
