import { BadRequestException, Body, Controller, Get, Header, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GdprService } from './gdpr.service';
import { DeleteAccountDto } from './dto/delete-account.dto';

function resolveUserContext(user: {
	id?: number;
	organizationId?: number;
	organization?: { id?: number };
}) {
	const id = Number(user?.id);
	const organizationId = Number(user?.organizationId ?? user?.organization?.id);
	if (!id || !organizationId || Number.isNaN(id) || Number.isNaN(organizationId)) {
		throw new BadRequestException('Contexte utilisateur invalide');
	}
	return { userId: id, organizationId };
}

@Controller('gdpr')
export class GdprController {
	constructor(private readonly gdpr: GdprService) {}

	@Get('export')
	@Header('Content-Type', 'application/json; charset=utf-8')
	async exportData(@CurrentUser() user: any, @Res() res: Response) {
		const { userId, organizationId } = resolveUserContext(user);
		this.gdpr.assertOrgAccess(organizationId, organizationId);
		const payload = await this.gdpr.exportOrganizationData(userId, organizationId);
		const filename = `facturio-export-org-${organizationId}-${new Date().toISOString().slice(0, 10)}.json`;
		res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
		res.send(JSON.stringify(payload, null, 2));
	}

	@Post('delete-account')
	async deleteAccount(@CurrentUser() user: any, @Body() body: DeleteAccountDto) {
		const { userId, organizationId } = resolveUserContext(user);
		this.gdpr.assertOrgAccess(organizationId, organizationId);
		return this.gdpr.deleteUserAccount(userId, organizationId, body.confirmEmail);
	}
}
