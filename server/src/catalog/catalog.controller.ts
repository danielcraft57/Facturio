import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ParseEntityIdPipe } from '../common/pipes/parse-entity-id.pipe';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { getTechStackChoices } from './catalog-data';
import { listCatalogPacks } from './catalog-packs';
import { CatalogPersonalizationService } from './catalog-personalization.service';
import { UpdateOrganizationCatalogDto } from './dto/update-organization-catalog.dto';

@Controller('catalog')
export class CatalogController {
	constructor(
		private readonly catalog: CatalogPersonalizationService,
		private readonly prisma: PrismaService,
	) {}

	/** Choix tech-stack pour l'inscription (public via JwtAuthGuard). */
	@Get('tech-choices')
	getTechChoices() {
		return getTechStackChoices();
	}

	/** Packs métier importables (marketing + onboarding). */
	@Get('packs')
	listPacks() {
		return { packs: listCatalogPacks() };
	}

	@Post('packs/:packId/install')
	installPack(
		@Param('packId') packId: string,
		@CurrentUser() user: { organizationId: number },
	) {
		return this.catalog.installCatalogPack(user.organizationId, packId);
	}

	@Get('organization')
	async getOrganizationCatalog(@CurrentUser() user: { organizationId: number }) {
		const productIds = await this.catalog.getOrganizationCatalogProductIds(user.organizationId);
		const org = await this.prisma.organization.findUnique({
			where: { id: user.organizationId },
			select: { preferredTechnologies: true },
		});
		return {
			productIds,
			preferredTechnologies: org?.preferredTechnologies ?? [],
		};
	}

	@Post('organization/regenerate')
	async regenerateOrganizationCatalog(
		@CurrentUser() user: { organizationId: number },
		@Body() body: UpdateOrganizationCatalogDto,
	) {
		const result = await this.catalog.assignOrganizationCatalog(
			user.organizationId,
			body.technologyIds,
			'manual',
		);
		return { ...result, message: 'Catalogue organisation mis à jour' };
	}

	@Get('clients/:clientId')
	async getClientCatalog(
		@Param('clientId', ParseEntityIdPipe) clientId: string,
		@CurrentUser() user: { organizationId: number },
	) {
		const client = await this.prisma.client.findFirst({
			where: { id: clientId, organizationId: user.organizationId },
			select: { preferredTechnologies: true },
		});
		if (!client) {
			throw new NotFoundException('Client introuvable');
		}
		const productIds = await this.catalog.getClientCatalogProductIds(clientId);
		return {
			productIds,
			preferredTechnologies: client.preferredTechnologies ?? [],
		};
	}
}
