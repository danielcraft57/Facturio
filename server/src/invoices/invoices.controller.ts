import { Body, Controller, Delete, Get, Header, Param, ParseIntPipe, Patch, Post, Query, Res } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoiceSendService } from './invoice-send.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { SendInvoiceDto } from './dto/send-invoice.dto';
import { InvoiceListQueryDto, UpdateInvoiceDocumentFlagsDto } from './dto/invoice-document-folder.dto';
import { Response } from 'express';
import { PdfService } from '../common/pdf.service';
import { EmailService } from '../common/email.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { StripeService } from '../stripe/stripe.service';
import { assertValidPublicToken } from './public-token.util';

@Controller(['invoices', 'factures'])
export class InvoicesController {
	constructor(
		private readonly invoices: InvoicesService,
		private readonly invoiceSend: InvoiceSendService,
		private readonly pdfService: PdfService,
		private readonly organizations: OrganizationsService,
		private readonly email: EmailService,
	) {}

	@Post()
	create(@Body() data: CreateInvoiceDto, @CurrentUser() user: any) {
		return this.invoices.create(data, user.organizationId);
	}

	@Get()
	findAll(@Query() query: InvoiceListQueryDto, @CurrentUser() user: any) {
		return this.invoices.findAll(query, user.organizationId);
	}

	@Get('folder-counts')
	getFolderCounts(@CurrentUser() user: any) {
		return this.invoices.getFolderCounts(user.organizationId);
	}

	@Get('archives')
	findArchived(@CurrentUser() user: any) {
		return this.invoices.findArchivedGrouped(user.organizationId);
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

	@Patch(':id/document-flags')
	updateDocumentFlags(
		@Param('id', ParseIntPipe) id: number,
		@Body() body: UpdateInvoiceDocumentFlagsDto,
		@CurrentUser() user: any,
	) {
		return this.invoices.updateDocumentFlags(id, body, user.organizationId);
	}

	@Post(':id/archive')
	archive(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
		return this.invoices.archive(id, user.organizationId);
	}

	@Post(':id/restore')
	restore(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
		return this.invoices.restore(id, user.organizationId);
	}

	@Delete(':id')
	remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
		return this.invoices.archive(id, user.organizationId);
	}

	@Get(':id/pdf')
	@Header('Content-Type', 'application/pdf')
	async downloadPdf(@Param('id', ParseIntPipe) id: number, @Res() res: Response, @CurrentUser() user: any) {
		const invoice = await this.invoices.findOne(id, user.organizationId);
		const organization = await this.organizations.getProfile(user.organizationId).catch(() => undefined);
		const buf = await this.pdfService.generateInvoicePdf(invoice, organization);
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
	async sendInvoice(
		@Param('id', ParseIntPipe) id: number,
		@Body() body: SendInvoiceDto,
		@CurrentUser() user: any,
	) {
		return this.invoiceSend.sendByEmail(id, user.organizationId, body);
	}

	@Post(':id/remind')
	async sendReminder(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
		const { invoice, daysOverdue, publicUrl } = await this.invoices.prepareReminder(id, user.organizationId);
		const organization = await this.organizations.getProfile(user.organizationId).catch(() => undefined);
		const pdf = await this.pdfService.generateInvoicePdf(invoice, organization);
		const client = invoice.client as { email?: string; name?: string; companyName?: string };
		await this.email.sendReminder({
			to: client.email!,
			invoiceNumber: invoice.number,
			invoiceDate: invoice.date,
			clientName: client.name || client.companyName || '',
			amount: Number(invoice.total),
			daysOverdue,
			paymentUrl: publicUrl,
			pdfBuffer: pdf
		});
		return { success: true, invoiceId: id, daysOverdue: daysOverdue ?? null };
	}
}

/**
 * Controller public pour les factures (accès par token, sans auth).
 * Routes publiques (accès par token, sans auth).
 */
@Controller('public/invoices')
export class PublicInvoicesController {
	constructor(
		private readonly invoices: InvoicesService,
		private readonly pdfService: PdfService,
		private readonly stripe: StripeService
	) {}

	@Get(':token/checkout')
	async checkout(@Param('token') token: string) {
		assertValidPublicToken(token);
		const invoice = await this.invoices.publicView(token);
		let payment: {
			clientSecret: string;
			amount: number;
			currency: string;
			stripePublishableKey: string;
		} | null = null;
		if (invoice.canPayOnline) {
			payment = await this.stripe.createPaymentIntentForInvoice(token);
		}
		return { invoice, payment };
	}

	@Get(':token')
	async view(@Param('token') token: string) {
		return this.invoices.publicView(token);
	}

	@Get(':token/pdf')
	@Header('Content-Type', 'application/pdf')
	async downloadPdf(@Param('token') token: string, @Res() res: Response) {
		assertValidPublicToken(token);
		const invoice = await this.invoices.findByPublicTokenForPdf(token);
		const buf = await this.pdfService.generateInvoicePdf(invoice);
		res.setHeader('Content-Disposition', `inline; filename=facture-${invoice.number}.pdf`);
		return res.send(buf);
	}
}


