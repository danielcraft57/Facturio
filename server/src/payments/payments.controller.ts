import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { PaymentsService, CreatePaymentDto, UpdatePaymentDto } from './payments.service';

@Controller('payments')
export class PaymentsController {
	constructor(private readonly payments: PaymentsService) {}

	@Post()
	create(@Body() data: CreatePaymentDto) {
		return this.payments.create(data);
	}

	@Get()
	findAll(@Query('invoiceId') invoiceId?: string) {
		return this.payments.findAll(invoiceId ? Number(invoiceId) : undefined);
	}

	@Get(':id')
	findOne(@Param('id', ParseIntPipe) id: number) {
		return this.payments.findOne(id);
	}

	@Patch(':id')
	update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdatePaymentDto) {
		return this.payments.update(id, data);
	}

	@Delete(':id')
	remove(@Param('id', ParseIntPipe) id: number) {
		return this.payments.remove(id);
	}
}




