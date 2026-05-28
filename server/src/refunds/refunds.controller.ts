import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ParseEntityIdPipe } from '../common/pipes/parse-entity-id.pipe';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RefundsService } from './refunds.service';
import { CancelDepositDto, CreateRefundDto } from './dto/create-refund.dto';

@Controller('refunds')
export class RefundsController {
	constructor(private readonly refunds: RefundsService) {}

	@Get()
	list(
		@Query('start') start: string | undefined,
		@Query('end') end: string | undefined,
		@Query('page') page: string | undefined,
		@Query('pageSize') pageSize: string | undefined,
		@CurrentUser() user: { organizationId: number },
	) {
		return this.refunds.findAll(user.organizationId, {
			start,
			end,
			page: page ? parseInt(page, 10) : undefined,
			pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
		});
	}

	@Post('payments/:paymentId')
	refundPayment(
		@Param('paymentId', ParseIntPipe) paymentId: number,
		@Body() dto: CreateRefundDto,
		@CurrentUser() user: { organizationId: number },
	) {
		return this.refunds.createForPayment(paymentId, dto, user.organizationId);
	}
}
