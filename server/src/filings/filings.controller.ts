import {
	BadRequestException,
	Body,
	Controller,
	Get,
	HttpCode,
	Param,
	ParseIntPipe,
	Patch,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import { FilingsService } from './filings.service';
import { FilingStatus } from '@prisma/client';
import { AccountingPlanGuard } from '../billing/guards/accounting-plan.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { FilingCalculateOptions } from './calculators/filing-calculation.types';

/**
 * Formate une période lisible selon le type de déclaration.
 */
function formatPeriodLabel(type: string, periodStart: Date): string {
	const y = periodStart.getFullYear();
	if (type === 'IS' || type === 'CFE') return `${y}`;
	if (type.startsWith('URSSAF_MONTHLY')) {
		const m = String(periodStart.getMonth() + 1).padStart(2, '0');
		return `${y}-M${m}`;
	}
	const q = Math.floor(periodStart.getMonth() / 3) + 1;
	return `${y}-Q${q}`;
}

@UseGuards(AccountingPlanGuard)
@Controller('filings')
export class FilingsController {
	constructor(private readonly filings: FilingsService) {}

	/**
	 * Crée une déclaration (TVA, IS, CFE, URSSAF…).
	 * Pour IS/CFE préférer period="2026".
	 */
	@Post()
	create(@Body() body: any, @CurrentUser() user: { organizationId?: number }) {
		const mapped: any = { ...body };
		if (body?.type === 'VAT') mapped.type = 'VAT_CA3';
		if (!mapped.authority) {
			mapped.authority = String(mapped.type || '').startsWith('URSSAF')
				? 'URSSAF'
				: 'DGFIP';
		}
		const allowed = [
			'VAT_CA3',
			'VAT_CA12',
			'URSSAF_MONTHLY',
			'URSSAF_QUARTERLY',
			'IS',
			'CFE',
		];
		if (mapped.type && !allowed.includes(mapped.type)) {
			throw new BadRequestException('Type de declaration invalide');
		}
		// Année par défaut pour IS / CFE si pas de période
		if ((mapped.type === 'IS' || mapped.type === 'CFE') && !mapped.period && !mapped.periodStart) {
			mapped.period = String(new Date().getFullYear() - 1);
		}
		mapped.organizationId = user?.organizationId;
		return this.filings.create(mapped).then((f: any) => ({
			...f,
			period: formatPeriodLabel(f.type, new Date(f.periodStart)),
			status: String(f.status).toLowerCase(),
		}));
	}

	@Get()
	findAll(@Query() query: any, @CurrentUser() user: { organizationId?: number }) {
		return this.filings.findAll(user?.organizationId).then((items: any[]) => {
			let filtered = items.map((f: any) => ({
				...f,
				period: formatPeriodLabel(f.type, new Date(f.periodStart)),
				status: String(f.status).toLowerCase(),
			}));
			if (query?.period) {
				filtered = filtered.filter((f) => f.period === String(query.period));
			}
			if (query?.status) {
				const s = String(query.status).toLowerCase();
				filtered = filtered.filter((f) => String(f.status).toLowerCase() === s);
			}
			if (query?.type) {
				filtered = filtered.filter((f) => f.type === String(query.type));
			}
			return filtered;
		});
	}

	@Get(':id')
	findOne(
		@Param('id', ParseIntPipe) id: number,
		@CurrentUser() user: { organizationId?: number },
	) {
		return this.filings.findOne(id, user?.organizationId).then((f: any) => ({
			...f,
			period: formatPeriodLabel(f.type, new Date(f.periodStart)),
			status: String(f.status).toLowerCase(),
		}));
	}

	@Patch(':id')
	update(
		@Param('id', ParseIntPipe) id: number,
		@Body() body: { status?: FilingStatus; notes?: string },
		@CurrentUser() user: { organizationId?: number },
	) {
		return this.filings.update(id, body, user?.organizationId);
	}

	/**
	 * Calcule TVA / IS / CFE selon le type.
	 * Body optionnel pour surcharger prefs (isPME, propertyValue…).
	 */
	@Post(':id/calculate')
	@HttpCode(200)
	calculate(
		@Param('id', ParseIntPipe) id: number,
		@Body() body: FilingCalculateOptions,
		@CurrentUser() user: { organizationId?: number },
	) {
		return this.filings.calculate(id, user?.organizationId, body || undefined).then((f: any) => ({
			...f,
			status: String(f.status).toLowerCase(),
		}));
	}

	@Post(':id/payments')
	addPayment(
		@Param('id', ParseIntPipe) id: number,
		@Body() body: { amount: number; date?: string | Date; reference?: string; notes?: string },
		@CurrentUser() user: { organizationId?: number },
	) {
		return this.filings.addAuthorityPayment(
			id,
			body.amount,
			body.date,
			body.reference,
			body.notes,
			user?.organizationId,
		);
	}
}
