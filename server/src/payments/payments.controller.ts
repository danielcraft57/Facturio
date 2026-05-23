import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { PaymentsService, CreatePaymentDto, UpdatePaymentDto } from './payments.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('payments')
export class PaymentsController {
	constructor(private readonly payments: PaymentsService) {}

	@Post()
	create(@Body() data: CreatePaymentDto, @CurrentUser() user: any) {
		return this.payments.create(data, user.organizationId);
	}

	@Get()
	findAll(@Query('invoiceId') invoiceId: string | undefined, @CurrentUser() user: any) {
		return this.payments.findAll(invoiceId || undefined, user.organizationId);
	}

	@Get(':id')
	findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
		return this.payments.findOne(id, user.organizationId);
	}

	@Patch(':id')
	update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdatePaymentDto, @CurrentUser() user: any) {
		return this.payments.update(id, data, user.organizationId);
	}

	@Delete(':id')
	remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
		return this.payments.remove(id, user.organizationId);
	}
}




