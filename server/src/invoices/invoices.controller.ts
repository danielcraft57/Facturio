import { Body, Controller, Delete, Get, Header, Param, ParseIntPipe, Patch, Post, Query, Res } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { ListQueryDto } from '../common/dto/list-query.dto';
import { Response } from 'express';
import { PdfService } from '../common/pdf.service';

@Controller('invoices')
export class InvoicesController {
	constructor(private readonly invoices: InvoicesService, private readonly pdfService: PdfService) {}

	@Post()
	create(@Body() data: CreateInvoiceDto) {
		return this.invoices.create(data);
	}

	@Get()
	findAll(@Query() query: ListQueryDto) {
		return this.invoices.findAll(query);
	}

	@Get(':id')
	findOne(@Param('id', ParseIntPipe) id: number) {
		return this.invoices.findOne(id);
	}

	@Patch(':id')
	update(
		@Param('id', ParseIntPipe) id: number,
		@Body() data: UpdateInvoiceDto
	) {
		return this.invoices.update(id, data);
	}

	@Delete(':id')
	remove(@Param('id', ParseIntPipe) id: number) {
		return this.invoices.remove(id);
	}

	@Get(':id/pdf')
	@Header('Content-Type', 'application/pdf')
	async downloadPdf(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
		const invoice = await this.invoices.findOne(id);
		const buf = await this.pdfService.generateInvoicePdf(invoice);
		res.setHeader('Content-Disposition', `inline; filename=invoice-${invoice.number}.pdf`);
		return res.send(buf);
	}

	@Get(':id/payments')
	payments(@Param('id', ParseIntPipe) id: number) {
		return this.invoices.listPayments(id);
	}

	@Post(':id/payments')
	addPayment(
		@Param('id', ParseIntPipe) id: number,
		@Body() body: { amount: number; date?: string | Date; method?: string; notes?: string }
	) {
		return this.invoices.addPayment(id, body.amount, body.date, body.method, body.notes);
	}
}


