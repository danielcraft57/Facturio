import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SendDocumentEmailDto } from '../common/dto/send-document-email.dto';
import { CreatePayableCreditorDto } from './dto/create-payable-creditor.dto';
import { CreatePayableDebtDto } from './dto/create-payable-debt.dto';
import { CreatePayableDebtPaymentDto } from './dto/create-payable-debt-payment.dto';
import { SendPayableDebtPaymentNoticeDto } from './dto/send-payable-debt-payment-notice.dto';
import { buildPublicPayableDebtUrl } from '../common/public-app-url';
import { PayablesDebtSendService } from './payables-debt-send.service';
import { PayablesService } from './payables.service';

@Controller('payables')
export class PayablesController {
	constructor(
		private readonly payables: PayablesService,
		private readonly payablesSend: PayablesDebtSendService,
	) {}

	@Get()
	getSummary(@CurrentUser() user: { organizationId?: number }) {
		return this.payables.getSummary(user.organizationId);
	}

	@Get('creditors')
	listCreditors(@CurrentUser() user: { organizationId?: number }) {
		return this.payables.listCreditors(user.organizationId);
	}

	@Post('creditors')
	createCreditor(
		@Body() body: CreatePayableCreditorDto,
		@CurrentUser() user: { organizationId?: number },
	) {
		return this.payables.createCreditor(user.organizationId, body);
	}

	@Post('debts')
	createDebt(@Body() body: CreatePayableDebtDto, @CurrentUser() user: { organizationId?: number }) {
		return this.payables.createDebt(user.organizationId, body);
	}

	@Get('debts/:id')
	findDebt(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { organizationId?: number }) {
		return this.payables.findOneDebt(user.organizationId, id);
	}

	@Post('debts/:id/cancel')
	cancelDebt(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { organizationId?: number }) {
		return this.payables.cancelDebt(user.organizationId, id);
	}

	@Post('debts/:id/payments')
	recordPayment(
		@Param('id', ParseIntPipe) id: number,
		@Body() body: CreatePayableDebtPaymentDto,
		@CurrentUser() user: { organizationId?: number },
	) {
		return this.payables.recordPayment(user.organizationId, id, body);
	}

	@Post('debts/:id/public-link')
	async preparePublicLink(
		@Param('id', ParseIntPipe) id: number,
		@CurrentUser() user: { organizationId?: number },
	) {
		if (user.organizationId == null) {
			throw new BadRequestException('Organisation requise');
		}
		const publicToken = await this.payablesSend.ensurePublicToken(id, user.organizationId);
		return { publicToken, url: buildPublicPayableDebtUrl(publicToken) };
	}

	@Post('debts/:id/send')
	sendDebt(
		@Param('id', ParseIntPipe) id: number,
		@Body() body: SendDocumentEmailDto,
		@CurrentUser() user: { organizationId?: number; email?: string },
	) {
		return this.payablesSend.sendByEmail(id, user.organizationId, body, user.email);
	}

	@Post('debts/:id/send-payment-notice')
	sendPaymentNotice(
		@Param('id', ParseIntPipe) id: number,
		@Body() body: SendPayableDebtPaymentNoticeDto,
		@CurrentUser() user: { organizationId?: number; email?: string },
	) {
		return this.payablesSend.sendPaymentNoticeByEmail(id, user.organizationId, body, user.email);
	}
}
