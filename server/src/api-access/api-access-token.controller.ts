import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiAccessTokenService } from './api-access-token.service';
import { CreateApiTokenDto } from './dto/create-api-token.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { API_ACCESS_SCOPE_LABELS, API_ACCESS_SCOPES } from './api-access-permissions';

@Controller('api-access/tokens')
export class ApiAccessTokenController {
	constructor(private readonly tokens: ApiAccessTokenService) {}

	@Get('catalog')
	catalog() {
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
	list(@CurrentUser() user: { organizationId: number }) {
		return this.tokens.listForOrganization(user.organizationId);
	}

	@Post()
	create(@Body() dto: CreateApiTokenDto, @CurrentUser() user: { organizationId: number }) {
		return this.tokens.create(user.organizationId, dto);
	}

	@Delete(':id')
	revoke(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { organizationId: number }) {
		return this.tokens.revoke(id, user.organizationId);
	}
}
