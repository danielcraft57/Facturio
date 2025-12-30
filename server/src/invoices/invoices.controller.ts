import { Body, Controller, Delete, Get, Header, Param, ParseIntPipe, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { ListQueryDto } from '../common/dto/list-query.dto';
import { Response } from 'express';
import { PdfService } from '../common/pdf.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
	constructor(private readonly invoices: InvoicesService, private readonly pdfService: PdfService) {}

	@Post()
	create(@Body() data: CreateInvoiceDto, @CurrentUser() user: any) {
		return this.invoices.create(data, user.organizationId);
	}

	@Get()
	findAll(@Query() query: ListQueryDto, @CurrentUser() user: any) {
		return this.invoices.findAll(query, user.organizationId);
	}

	@Get(':id')
	findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
		return this.invoices.findOne(id, user.organizationId);
	}

	@Patch(':id')
	update(
		@Param('id', ParseIntPipe) id: number,
		@Body() data: UpdateInvoiceDto,
		@CurrentUser() user: any
	) {
		return this.invoices.update(id, data, user.organizationId);
	}

	@Delete(':id')
	remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
		return this.invoices.remove(id, user.organizationId);
	}

	@Get(':id/pdf')
	@Header('Content-Type', 'application/pdf')
	async downloadPdf(@Param('id', ParseIntPipe) id: number, @Res() res: Response, @CurrentUser() user: any) {
		const invoice = await this.invoices.findOne(id, user.organizationId);
		const buf = await this.pdfService.generateInvoicePdf(invoice);
		res.setHeader('Content-Disposition', `inline; filename=invoice-${invoice.number}.pdf`);
		return res.send(buf);
	}

	@Get(':id/payments')
	payments(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
		return this.invoices.listPayments(id, user.organizationId);
	}

	@Post(':id/payments')
	addPayment(
		@Param('id', ParseIntPipe) id: number,
		@Body() body: { amount: number; date?: string | Date; method?: string; notes?: string },
		@CurrentUser() user: any
	) {
		return this.invoices.addPayment(id, body.amount, body.date, body.method, body.notes, user.organizationId);
	}
}


