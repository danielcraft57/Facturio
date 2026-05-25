import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiAccessTokenService } from './api-access-token.service';
import { CreateApiTokenDto } from './dto/create-api-token.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { API_ACCESS_SCOPE_LABELS, API_ACCESS_SCOPES } from './api-access-permissions';
import { BillingService } from '../billing/billing.service';

@Controller('api-access/tokens')
export class ApiAccessTokenController {
	constructor(
		private readonly tokens: ApiAccessTokenService,
		private readonly billing: BillingService,
	) {}

	@Get('catalog')
	async catalog(@CurrentUser() user: { organizationId: number }) {
		await this.billing.assertCanUsePublicApi(user.organizationId);
		return {
			scopes: API_ACCESS_SCOPES.map((id) => ({
				id,
				label: API_ACCESS_SCOPE_LABELS[id],
			})),
			docsUrl: '/parametres/api-docs',
			tokensUrl: '/parametres/tokens',
		};
	}

	@Get()
	async list(@CurrentUser() user: { organizationId: number }) {
		await this.billing.assertCanUsePublicApi(user.organizationId);
		return this.tokens.listForOrganization(user.organizationId);
	}

	@Post()
	async create(@Body() dto: CreateApiTokenDto, @CurrentUser() user: { organizationId: number }) {
		await this.billing.assertCanUsePublicApi(user.organizationId);
		return this.tokens.create(user.organizationId, dto);
	}

	@Delete(':id')
	async revoke(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { organizationId: number }) {
		await this.billing.assertCanUsePublicApi(user.organizationId);
		return this.tokens.revoke(id, user.organizationId);
	}
}
