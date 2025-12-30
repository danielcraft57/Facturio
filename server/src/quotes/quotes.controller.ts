import { Body, Controller, Delete, Get, Header, Param, ParseIntPipe, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { CreateQuoteDto, QuotesService, UpdateQuoteDto } from './quotes.service';
import { InvoicesService } from '../invoices/invoices.service';
import { Request, Response } from 'express';
import { PdfService } from '../common/pdf.service';
import { EmailService } from '../common/email.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('quotes')
@UseGuards(JwtAuthGuard)
export class QuotesController {
	constructor(
		private readonly quotes: QuotesService,
		private readonly invoices: InvoicesService,
		private readonly pdfService: PdfService,
		private readonly email: EmailService
	) {}

	@Post()
	create(@Body() data: CreateQuoteDto, @CurrentUser() user: any) {
		return this.quotes.create(data, user.organizationId);
	}

	@Get()
	findAll(@CurrentUser() user: any) {
		return this.quotes.findAll(user.organizationId);
	}

	@Get(':id')
	findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
		return this.quotes.findOne(id, user.organizationId);
	}

	@Patch(':id')
	update(
		@Param('id', ParseIntPipe) id: number,
		@Body() data: UpdateQuoteDto,
		@CurrentUser() user: any
	) {
		return this.quotes.update(id, data, user.organizationId);
	}

	@Delete(':id')
	remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
		return this.quotes.remove(id, user.organizationId);
	}

	@Post(':id/convert-to-invoice')
	async convertToInvoice(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
		const quote = await this.quotes.findOne(id, user.organizationId);
		return this.invoices.create({
			clientId: quote.clientId,
			lines: quote.lines.map((l: any) => ({ description: l.description, quantity: l.quantity, unitPrice: Number(l.unitPrice), taxRate: Number(l.taxRate) }))
		}, user.organizationId);
	}

	@Post(':id/send')
	async sendQuote(@Param('id') id: string, @CurrentUser() user: any) {
		const quote = await this.quotes.sendQuote(Number(id), user.organizationId);
		const pdf = await this.pdfService.generateQuotePdf(quote);
		if (quote.client?.email) {
			await this.email.sendQuote({
				to: quote.client.email,
				quoteNumber: quote.number,
				quoteDate: quote.createdAt,
				clientName: quote.client.name || quote.client.companyName || '',
				total: Number(quote.total),
				expiryDate: quote.expiryDate || undefined,
				pdfBuffer: pdf
			});
		}
		return quote;
	}

	@Get(':id/pdf')
	@Header('Content-Type', 'application/pdf')
	async downloadPdf(@Param('id', ParseIntPipe) id: number, @Res() res: Response, @CurrentUser() user: any) {
		const quote = await this.quotes.findOne(id, user.organizationId);
		const buf = this.pdfService.generateQuotePdf(quote);
		res.setHeader('Content-Disposition', `inline; filename=quote-${quote.number}.pdf`);
		return res.send(buf);
	}
}

@Controller('public/quotes')
export class PublicQuotesController {
	constructor(private readonly quotes: QuotesService) {}

	@Get(':token')
	async view(@Param('token') token: string, @Req() req: Request) {
		return this.quotes.publicView(token, req.ip, req.get('user-agent') || '');
	}

	@Post(':token/accept')
	async accept(@Param('token') token: string, @Req() req: Request) {
		return this.quotes.publicAccept(token, req.ip);
	}

	@Post(':token/reject')
	async reject(@Param('token') token: string) {
		return this.quotes.publicReject(token);
	}
}


