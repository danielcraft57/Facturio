import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReceivablesQueryDto } from './dto/receivables-query.dto';
import { ReceivablesService } from './receivables.service';

@Controller('receivables')
export class ReceivablesController {
	constructor(private readonly receivables: ReceivablesService) {}

	@Get()
	getReceivables(@Query() query: ReceivablesQueryDto, @CurrentUser() user: { organizationId?: number }) {
		return this.receivables.getReceivables(user.organizationId, query);
	}
}
