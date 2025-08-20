import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { AccountingService } from './accounting.service';

@Controller('accounting')
export class AccountingController {
	constructor(private readonly accounting: AccountingService) {}

	@Get('accounts')
	listAccounts() {
		return this.accounting.listAccounts();
	}

	@Post('accounts')
	createAccount(@Body() body: { code: string; name: string; type: string }) {
		return this.accounting.createAccount(body);
	}

	@Post('journals')
	createJournal(@Body() body: { code: string; name: string }) {
		return this.accounting.createJournal(body);
	}

	@Post('entries')
	postEntry(
		@Body()
		body: {
			journalCode: string;
			date?: string;
			reference?: string;
			memo?: string;
			lines: Array<{ accountCode: string; description?: string; debit?: number; credit?: number }>;
		}
	) {
		return this.accounting.postEntry(body);
	}

	// Rapports & exports
	@Get('exports/fec')
	async exportFEC(@Query('start') start: string, @Query('end') end: string, @Res({ passthrough: true }) res: Response) {
		const content = await this.accounting.exportFEC({ start, end });
		const safeStart = start ? start.split('T')[0] : '1970-01-01';
		const safeEnd = end ? end.split('T')[0] : '2999-12-31';
		res.setHeader('Content-Type', 'text/plain; charset=utf-8');
		res.setHeader('Content-Disposition', `attachment; filename=fec_${safeStart}_${safeEnd}.txt`);
		return content;
	}

	@Get('reports/balance')
	getTrialBalance(@Query('start') start: string, @Query('end') end: string) {
		return this.accounting.getTrialBalance({ start, end });
	}

	@Get('reports/general-ledger')
	getGeneralLedger(@Query('start') start: string, @Query('end') end: string, @Query('account') accountCode?: string) {
		return this.accounting.getGeneralLedger({ start, end, accountCode });
	}
}


