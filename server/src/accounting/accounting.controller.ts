import { Body, Controller, Get, Post } from '@nestjs/common';
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
}


