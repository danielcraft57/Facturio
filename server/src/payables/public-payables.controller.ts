import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { assertValidPublicToken } from '../invoices/public-token.util';
import { PayablesService } from './payables.service';

@Controller('public/dettes')
export class PublicPayablesController {
	constructor(private readonly payables: PayablesService) {}

	@Get(':token')
	async view(@Param('token') token: string) {
		const safe = assertValidPublicToken(token);
		const debt = await this.payables.publicViewByToken(safe);
		if (!debt) throw new NotFoundException('Document introuvable');
		return debt;
	}
}
