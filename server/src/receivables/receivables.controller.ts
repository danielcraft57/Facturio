import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReceivablesQueryDto } from './dto/receivables-query.dto';
import { ReceivablesRemindDto } from './dto/receivables-remind.dto';
import { ReceivablesReminderService } from './receivables-reminder.service';
import { ReceivablesService } from './receivables.service';

@Controller('receivables')
export class ReceivablesController {
	constructor(
		private readonly receivables: ReceivablesService,
		private readonly reminders: ReceivablesReminderService,
	) {}

	@Get()
	getReceivables(@Query() query: ReceivablesQueryDto, @CurrentUser() user: { organizationId?: number }) {
		return this.receivables.getReceivables(user.organizationId, query);
	}

	/** Relance manuelle : factures sélectionnées ou toutes les créances en retard éligibles. */
	@Post('remind-overdue')
	remindOverdue(
		@Body() body: ReceivablesRemindDto,
		@CurrentUser() user: { organizationId?: number },
	) {
		if (user.organizationId == null) {
			return { sent: 0, skipped: 0, errors: ['Organisation requise'] };
		}
		return this.reminders.remindOverdueForOrganization(user.organizationId, {
			invoiceIds: body.invoiceIds,
		});
	}
}
