import { BadRequestException, Controller, Get, Header, Param, Query, Res } from '@nestjs/common';
import { ParseEntityIdPipe } from '../common/pipes/parse-entity-id.pipe';
import { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { EInvoicingService } from './e-invoicing.service';
import { computeReformSchedule } from './reform-schedule.util';

function orgIdFromUser(user: { organizationId?: number; organization?: { id?: number } }): number {
	const id = Number(user?.organizationId ?? user?.organization?.id);
	if (!id || Number.isNaN(id)) throw new BadRequestException('Organisation introuvable');
	return id;
}

@Controller('e-invoicing')
export class EInvoicingController {
	constructor(private readonly eInvoicing: EInvoicingService) {}

	/** Calendrier réforme selon taille d'entreprise (public). */
	@Get('reform-schedule')
	getReformSchedule(@Query('companySize') companySize?: string) {
		return computeReformSchedule(companySize);
	}

	@Get('readiness')
	getOrganizationReadiness(@CurrentUser() user: any) {
		return this.eInvoicing.getOrganizationReadiness(orgIdFromUser(user));
	}

	@Get('invoices/:id/readiness')
	getInvoiceReadiness(@Param('id', ParseEntityIdPipe) id: string, @CurrentUser() user: any) {
		return this.eInvoicing.getInvoiceReadiness(id, orgIdFromUser(user));
	}

	@Get('invoices/:id/factur-x')
	@Header('Content-Type', 'application/xml; charset=utf-8')
	async downloadFacturX(
		@Param('id', ParseEntityIdPipe) id: string,
		@CurrentUser() user: any,
		@Res() res: Response,
	) {
		const { xml, filename } = await this.eInvoicing.generateFacturX(id, orgIdFromUser(user));
		res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
		res.send(xml);
	}
}
