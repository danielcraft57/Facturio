import { BadRequestException, Body, Controller, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { FilingsService } from './filings.service';
import { AuthorityType, FilingStatus, FilingType } from '@prisma/client';
import { Request } from 'express';
import { AccountingPlanGuard } from '../billing/guards/accounting-plan.guard';

@UseGuards(AccountingPlanGuard)
@Controller('filings')
export class FilingsController {
	constructor(private readonly filings: FilingsService) {}

	@Post()
	create(@Body() body: any) {
		const mapped: any = { ...body };
		if (body?.type === 'VAT') {
			mapped.type = 'VAT_CA3';
		}
		if (!mapped.authority) {
			mapped.authority = 'DGFIP';
		}
		const allowed = ['VAT_CA3','VAT_CA12','URSSAF_MONTHLY','URSSAF_QUARTERLY','IS','CFE'];
		if (mapped.type && !allowed.includes(mapped.type)) {
			throw new BadRequestException('Type de declaration invalide');
		}
		return this.filings.create(mapped).then((f: any) => ({ ...f, period: body?.period, status: String(f.status).toLowerCase() }));
	}

	@Get()
	findAll(@Query() query: any) {
		return this.filings.findAll().then((items: any[]) => {
			// Ajouter period derivee
			const withPeriod = items.map((f: any) => {
				const start = new Date(f.periodStart);
				const y = start.getFullYear();
				const q = Math.floor(start.getMonth() / 3) + 1;
				return { ...f, period: `${y}-Q${q}`, status: String(f.status).toLowerCase() };
			});
			let filtered = withPeriod;
			if (query?.period) {
				filtered = filtered.filter(f => f.period === String(query.period));
			}
			if (query?.status) {
				const s = String(query.status).toLowerCase();
				filtered = filtered.filter(f => String(f.status).toLowerCase() === s);
			}
			// dedupe par periode: garder le plus recent, meme quand period filtree
			const map = new Map<string, any>();
			for (const f of filtered) {
				const key = f.period;
				const prev = map.get(key);
				if (!prev || new Date(f.createdAt).getTime() > new Date(prev.createdAt).getTime()) {
					map.set(key, f);
				}
			}
			filtered = Array.from(map.values());
			return filtered;
		});
	}

	@Get(':id')
	findOne(@Param('id', ParseIntPipe) id: number) {
		return this.filings.findOne(id).then((f: any) => ({ ...f, status: String(f.status).toLowerCase() }));
	}

	@Patch(':id')
	update(@Param('id', ParseIntPipe) id: number, @Body() body: { status?: FilingStatus; notes?: string }) {
		return this.filings.update(id, body);
	}

	@Post(':id/calculate')
	@HttpCode(200)
	calculateVat(@Param('id', ParseIntPipe) id: number) {
		return this.filings.calculateVatReturn(id).then((f: any) => ({ ...f, status: String(f.status).toLowerCase() }));
	}

	@Post(':id/payments')
	addPayment(@Param('id', ParseIntPipe) id: number, @Body() body: { amount: number; date?: string | Date; reference?: string; notes?: string }) {
		return this.filings.addAuthorityPayment(id, body.amount, body.date, body.reference, body.notes);
	}
}


