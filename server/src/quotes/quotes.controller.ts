import { Body, Controller, Delete, Get, Header, Param, ParseIntPipe, Patch, Post, Req, Res } from '@nestjs/common';
import { CreateQuoteDto, QuotesService, UpdateQuoteDto } from './quotes.service';
import { InvoicesService } from '../invoices/invoices.service';
import { Request, Response } from 'express';
import { PdfService } from '../common/pdf.service';
import { EmailService } from '../common/email.service';

@Controller('quotes')
export class QuotesController {
	constructor(
		private readonly quotes: QuotesService,
		private readonly invoices: InvoicesService,
		private readonly pdfService: PdfService,
		private readonly email: EmailService
	) {}

	@Post()
	create(@Body() data: CreateQuoteDto) {
		return this.quotes.create(data);
	}

	@Get()
	findAll() {
		return this.quotes.findAll();
	}

	@Get(':id')
	findOne(@Param('id', ParseIntPipe) id: number) {
		return this.quotes.findOne(id);
	}

	@Patch(':id')
	update(
		@Param('id', ParseIntPipe) id: number,
		@Body() data: UpdateQuoteDto
	) {
		return this.quotes.update(id, data);
	}

	@Delete(':id')
	remove(@Param('id', ParseIntPipe) id: number) {
		return this.quotes.remove(id);
	}

	@Post(':id/convert-to-invoice')
	async convertToInvoice(@Param('id', ParseIntPipe) id: number) {
		const quote = await this.quotes.findOne(id);
		return this.invoices.create({
			clientId: quote.clientId,
			lines: quote.lines.map(l => ({ description: l.description, quantity: l.quantity, unitPrice: Number(l.unitPrice), taxRate: Number(l.taxRate) }))
		});
	}

	@Post(':id/send')
	async sendQuote(@Param('id') id: string) {
		const quote = await this.quotes.sendQuote(Number(id));
		const pdf = await this.pdfService.generateQuotePdf(quote);
		if (quote.client?.email) {
			await this.email.send({
				to: quote.client.email,
				subject: `Devis ${quote.number}`,
				html: `<p>Bonjour,</p><p>Veuillez trouver ci-joint le devis ${quote.number}.</p>`,
				attachments: [{ filename: `Devis-${quote.number}.pdf`, content: pdf, contentType: 'application/pdf' }]
			});
		}
		return quote;
	}

	@Get(':id/pdf')
	@Header('Content-Type', 'application/pdf')
	async downloadPdf(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
		const quote = await this.quotes.findOne(id);
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


