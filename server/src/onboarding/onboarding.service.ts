import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CatalogPersonalizationService } from '../catalog/catalog-personalization.service';
import { EmailService } from '../common/email.service';
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
	private readonly logger = new Logger(OnboardingService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly catalog: CatalogPersonalizationService,
		private readonly email: EmailService,
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

	/**
	 * Marque l'onboarding comme terminé sans installer de catalogue (parcours « configurer plus tard »).
	 *
	 * @param organizationId - Organisation cible
	 * @returns Message de confirmation pour l'utilisateur
	 */
	async skipInstall(organizationId: number): Promise<{ message: string }> {
		const org = await this.prisma.organization.findUnique({
			where: { id: organizationId },
			select: { onboardingCompletedAt: true },
		});
		if (!org) {
			throw new BadRequestException('Organisation introuvable');
		}
		if (!org.onboardingCompletedAt) {
			await this.prisma.organization.update({
				where: { id: organizationId },
				data: { onboardingCompletedAt: new Date() },
			});
		}
		return {
			message:
				'Vous pourrez configurer votre catalogue plus tard depuis Produits ou relancer l\'assistant.',
		};
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

		const normalizedProfile = devProfile
			? normalizeOnboardingProfileId(devProfile) ?? devProfile
			: undefined;

		const result = await this.catalog.provisionOrganizationFromStack(
			organizationId,
			technologyIds,
			'onboarding',
			{
				...(normalizedProfile ? { devProfile: normalizedProfile } : {}),
				...(templateProductIds?.length ? { templateProductIds } : {}),
			},
		);

		void this.sendOnboardingRecapEmail(organizationId, technologyIds, result, normalizedProfile).catch(
			(err) => {
				this.logger.warn(
					`Email récap installation non envoyé (org ${organizationId})`,
					err instanceof Error ? err.message : err,
				);
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

	/**
	 * Envoie le récap marketing post-installation (catalogue + stack).
	 */
	private async sendOnboardingRecapEmail(
		organizationId: number,
		technologyIds: string[],
		result: { clonedCount: number; productIds: number[] },
		devProfile?: string,
	): Promise<void> {
		if (result.clonedCount <= 0) return;

		const admin = await this.prisma.user.findFirst({
			where: { organizationId, role: 'ADMIN' },
			orderBy: { id: 'asc' },
			select: { email: true, firstName: true },
		});
		if (!admin?.email?.trim()) return;

		const products = await this.prisma.product.findMany({
			where: { id: { in: result.productIds }, organizationId },
			select: { name: true },
			orderBy: { id: 'asc' },
		});

		const appBase = (
			process.env.FRONTEND_URL?.trim() ||
			process.env.PUBLIC_APP_URL?.trim() ||
			'https://prestafacture.com'
		).replace(/\/$/, '');

		await this.email.sendOnboardingRecap({
			to: admin.email.trim(),
			firstName: admin.firstName,
			productCount: result.clonedCount,
			productNames: products.map((p) => p.name),
			techLabels: this.resolveTechLabels(technologyIds),
			devProfileLabel: devProfile ? this.resolveProfileLabel(devProfile) : null,
			productsUrl: `${appBase}/produits`,
			createInvoiceUrl: `${appBase}/factures/inbox?create=1`,
			dashboardUrl: `${appBase}/dashboard`,
		});
	}

	private resolveTechLabels(technologyIds: string[]): string[] {
		const choices = getTechStackChoices();
		const labels: string[] = [];
		for (const id of technologyIds) {
			for (const cat of choices.categories) {
				const opt = cat.options.find((o) => o.id === id);
				if (opt) {
					labels.push(opt.label);
					break;
				}
			}
		}
		return labels;
	}

	private resolveProfileLabel(profileId: string): string | null {
		const file = getOnboardingProfilesFile();
		const profile = file.profiles.find((p) => p.id === profileId);
		return profile?.label ?? null;
	}
}
