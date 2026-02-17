import { Body, Controller, Delete, Get, Header, Param, ParseIntPipe, Patch, Post, Query, Res } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { ListQueryDto } from '../common/dto/list-query.dto';
import { Response } from 'express';
import { PdfService } from '../common/pdf.service';
import { EmailService } from '../common/email.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('invoices')
export class InvoicesController {
	constructor(
		private readonly invoices: InvoicesService,
		private readonly pdfService: PdfService,
		private readonly email: EmailService
	) {}

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

	@Post(':id/send')
	async sendInvoice(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
		const result = await this.invoices.sendInvoice(id, user.organizationId);
		const invoice = await this.invoices.findOne(id, user.organizationId);
		const pdf = await this.pdfService.generateInvoicePdf(invoice);
		if (invoice.client?.email) {
			const apiUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`;
			const trackOpenUrl = `${apiUrl}/api/track/opened/invoice/${result.publicToken}`;
			await this.email.sendInvoice({
				to: invoice.client.email,
				invoiceNumber: invoice.number,
				invoiceDate: invoice.date,
				clientName: (invoice.client as any).name || (invoice.client as any).companyName || '',
				total: Number(invoice.total),
				pdfBuffer: pdf,
				trackOpenUrl
			});
		}
		return result;
	}
}

/**
 * Controller public pour les factures (accès par token, sans auth).
 * Routes exclues du guard local par préfixe /api/public.
 */
@Controller('public/invoices')
export class PublicInvoicesController {
	constructor(
		private readonly invoices: InvoicesService,
		private readonly pdfService: PdfService
	) {}

	@Get(':token')
	async view(@Param('token') token: string) {
		return this.invoices.publicView(token);
	}

	@Get(':token/pdf')
	@Header('Content-Type', 'application/pdf')
	async downloadPdf(@Param('token') token: string, @Res() res: Response) {
		const invoice = await this.invoices.publicView(token);
		const buf = await this.pdfService.generateInvoicePdf(invoice);
		res.setHeader('Content-Disposition', `inline; filename=facture-${invoice.number}.pdf`);
		return res.send(buf);
	}
}


