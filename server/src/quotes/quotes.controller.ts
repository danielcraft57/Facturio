import { Body, Controller, Delete, Get, Header, Param, ParseIntPipe, Patch, Post, Req, Res } from '@nestjs/common';
import { CreateQuoteDto, QuotesService, UpdateQuoteDto } from './quotes.service';
import { QuoteStatus } from '@prisma/client';
import { Request, Response } from 'express';
import { PdfService } from '../common/pdf.service';
import { EmailService } from '../common/email.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('quotes')
export class QuotesController {
	constructor(
		private readonly quotes: QuotesService,
		private readonly pdfService: PdfService,
		private readonly email: EmailService,
		private readonly organizations: OrganizationsService
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

	@Post(':id/accept')
	async accept(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
		return this.quotes.acceptQuote(id, user.organizationId);
	}

	@Post(':id/reject')
	async reject(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
		return this.quotes.rejectQuote(id, user.organizationId);
	}

	@Post(':id/convert-to-invoice')
	async convertToInvoice(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
		const quote = await this.quotes.findOne(id, user.organizationId);
		if (quote.status === QuoteStatus.SENT) {
			await this.quotes.acceptQuote(id, user.organizationId);
		}
		return this.quotes.convertQuoteToInvoice(id, user.organizationId);
	}

	@Post(':id/send')
	async sendQuote(@Param('id') id: string, @CurrentUser() user: any) {
		const result = await this.quotes.sendQuote(Number(id), user.organizationId);
		const token = result.publicToken;
		const organization = await this.organizations.getProfile(user.organizationId).catch(() => undefined);
		const pdf = await this.pdfService.generateQuotePdf(result, organization);
		if (result.client?.email && token) {
			const apiUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`;
			const baseUrl = process.env.PUBLIC_APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
			const trackOpenUrl = `${apiUrl}/api/track/opened/quote/${token}`;
			const acceptUrl = `${baseUrl}/public/devis/${token}/accepter`;
			const rejectUrl = `${baseUrl}/public/devis/${token}/refuser`;
			await this.email.sendQuote({
				to: result.client.email,
				quoteNumber: result.number,
				quoteDate: result.createdAt,
				clientName: result.client.name || result.client.companyName || '',
				total: Number(result.total),
				expiryDate: result.expiryDate || undefined,
				pdfBuffer: pdf,
				trackOpenUrl,
				acceptUrl,
				rejectUrl
			});
		}
		return result;
	}

	@Get(':id/pdf')
	@Header('Content-Type', 'application/pdf')
	async downloadPdf(@Param('id', ParseIntPipe) id: number, @Res() res: Response, @CurrentUser() user: any) {
		const quote = await this.quotes.findOne(id, user.organizationId);
		const organization = await this.organizations.getProfile(user.organizationId).catch(() => undefined);
		const buf = await this.pdfService.generateQuotePdf(quote, organization);
		res.setHeader('Content-Disposition', `inline; filename=quote-${quote.number}.pdf`);
		return res.send(buf);
	}
}

@Controller('public/quotes')
export class PublicQuotesController {
	constructor(
		private readonly quotes: QuotesService,
		private readonly pdfService: PdfService
	) {}

	@Get(':token')
	async view(@Param('token') token: string, @Req() req: Request) {
		return this.quotes.publicView(token, req.ip, req.get('user-agent') || '');
	}

	@Get(':token/pdf')
	@Header('Content-Type', 'application/pdf')
	async downloadPdf(@Param('token') token: string, @Res() res: Response) {
		const quote = await this.quotes.publicView(token);
		const buf = await this.pdfService.generateQuotePdf(quote);
		res.setHeader('Content-Disposition', `inline; filename=devis-${quote.number}.pdf`);
		return res.send(buf);
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


