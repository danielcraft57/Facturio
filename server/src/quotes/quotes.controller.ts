import { BadRequestException, Body, Controller, Delete, Get, Header, Param, Patch, Post, Query, Req, Res } from '@nestjs/common';
import { ParseEntityIdPipe } from '../common/pipes/parse-entity-id.pipe';
import { QuoteListQueryDto, UpdateQuoteDocumentFlagsDto } from './dto/quote-document-folder.dto';
import { CreateQuoteDto, QuotesService, UpdateQuoteDto } from './quotes.service';
import { QuoteStatus } from '@prisma/client';
import { Request, Response } from 'express';
import { PdfService } from '../common/pdf.service';
import { EmailService } from '../common/email.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { InvoicesService } from '../invoices/invoices.service';
import type { PublicAcceptDepositDto } from './quotes.service';
import type { PayQuoteDto } from './quotes.service';
import { QuoteSendService } from './quote-send.service';
import { SendDocumentEmailDto } from '../common/dto/send-document-email.dto';
import { buildEmailClickTrackUrl, buildEmailOpenTrackUrl } from '../common/email-track.util';

@Controller(['quotes', 'devis'])
export class QuotesController {
	constructor(
		private readonly quotes: QuotesService,
		private readonly pdfService: PdfService,
		private readonly email: EmailService,
		private readonly organizations: OrganizationsService,
		private readonly invoices: InvoicesService,
		private readonly quoteSend: QuoteSendService,
	) {}

	@Post()
	create(@Body() data: CreateQuoteDto, @CurrentUser() user: any) {
		return this.quotes.create(data, user.organizationId);
	}

	@Get()
	findAll(@Query() query: QuoteListQueryDto, @CurrentUser() user: any) {
		return this.quotes.findAll(user.organizationId, query);
	}

	@Get('folder-counts')
	getFolderCounts(@CurrentUser() user: any) {
		return this.quotes.getFolderCounts(user.organizationId);
	}

	@Get('archives')
	findArchived(@CurrentUser() user: any) {
		return this.quotes.findArchivedGrouped(user.organizationId);
	}

	@Get(':id')
	findOne(@Param('id', ParseEntityIdPipe) id: string, @CurrentUser() user: any) {
		return this.quotes.findOne(id, user.organizationId);
	}

	@Get(':id/deposit-context')
	getDepositContext(@Param('id', ParseEntityIdPipe) id: string, @CurrentUser() user: any) {
		return this.quotes.getDepositContextForQuote(id, user.organizationId);
	}

	@Patch(':id')
	update(
		@Param('id', ParseEntityIdPipe) id: string,
		@Body() data: UpdateQuoteDto,
		@CurrentUser() user: any
	) {
		return this.quotes.update(id, data, user.organizationId);
	}

	@Patch(':id/document-flags')
	updateDocumentFlags(
		@Param('id', ParseEntityIdPipe) id: string,
		@Body() body: UpdateQuoteDocumentFlagsDto,
		@CurrentUser() user: any,
	) {
		return this.quotes.updateDocumentFlags(id, body, user.organizationId);
	}

	@Post(':id/archive')
	archive(@Param('id', ParseEntityIdPipe) id: string, @CurrentUser() user: any) {
		return this.quotes.archive(id, user.organizationId);
	}

	@Post(':id/restore')
	restore(@Param('id', ParseEntityIdPipe) id: string, @CurrentUser() user: any) {
		return this.quotes.restore(id, user.organizationId);
	}

	@Delete(':id')
	remove(@Param('id', ParseEntityIdPipe) id: string, @CurrentUser() user: any) {
		return this.quotes.archive(id, user.organizationId);
	}

	@Post(':id/accept')
	async accept(@Param('id', ParseEntityIdPipe) id: string, @CurrentUser() user: any) {
		return this.quotes.acceptQuote(id, user.organizationId);
	}

	@Post(':id/reject')
	async reject(@Param('id', ParseEntityIdPipe) id: string, @CurrentUser() user: any) {
		return this.quotes.rejectQuote(id, user.organizationId);
	}

	/**
	 * Relance l'acompte (facture split) si celui-ci n'est pas encore payé.
	 */
	@Post(':id/remind-deposit')
	async remindDeposit(
		@Param('id', ParseEntityIdPipe) id: string,
		@CurrentUser() user: any,
	) {
		// Vérifie que le devis existe bien et appartient à l'organisation.
		const quote = await this.quotes.findOne(id, user.organizationId);
		if (quote.status !== QuoteStatus.ACCEPTED && quote.status !== QuoteStatus.SENT) {
			// On autorise SENT par robustesse (selon transitions).
			throw new BadRequestException('Devis non éligible à la relance d’acompte');
		}

		const depositInvoice = await this.quotes.findDepositInvoiceForQuote(id, user.organizationId);
		if (!depositInvoice) {
			throw new BadRequestException('Aucun acompte trouvé pour ce devis');
		}

		const { invoice, daysOverdue, publicUrl } = await this.invoices.prepareReminder(
			depositInvoice.id,
			user.organizationId,
		);
		const organization = await this.organizations.getProfile(user.organizationId).catch(() => undefined);
		const pdf = await this.pdfService.generateInvoicePdf(invoice, organization);
		const client = invoice.client as { email?: string; name?: string; companyName?: string };

		if (!client?.email) {
			throw new BadRequestException('Le client n’a pas d’adresse email');
		}

		const token = invoice.publicToken;
		const trackOpenUrl = token ? buildEmailOpenTrackUrl('invoice', token) : undefined;
		const paymentUrl = token
			? buildEmailClickTrackUrl('invoice', token, 'pay')
			: publicUrl;

		await this.email.sendReminder({
			to: client.email,
			invoiceNumber: invoice.number,
			invoiceDate: invoice.date,
			clientName: client.name || client.companyName || '',
			amount: Number(invoice.total),
			daysOverdue,
			paymentUrl,
			trackOpenUrl,
			pdfBuffer: pdf,
			organization,
		});

		return { success: true, invoiceId: invoice.id, daysOverdue: daysOverdue ?? null };
	}

	@Post(':id/convert-to-invoice')
	async convertToInvoice(@Param('id', ParseEntityIdPipe) id: string, @CurrentUser() user: any) {
		const quote = await this.quotes.findOne(id, user.organizationId);
		if (quote.status === QuoteStatus.SENT) {
			await this.quotes.acceptQuote(id, user.organizationId);
		}
		return this.quotes.convertQuoteToInvoice(id, user.organizationId);
	}

	/**
	 * Paye un devis (100% ou acompte).
	 * - valide le devis (acceptation)
	 * - convertit en facture (statut SENT)
	 * - enregistre un paiement sur la facture
	 */
	@Post(':id/pay')
	async pay(
		@Param('id', ParseEntityIdPipe) id: string,
		@Body() body: PayQuoteDto,
		@CurrentUser() user: any,
	) {
		return this.quotes.payQuote(id, body, user.organizationId);
	}

	@Post(':id/send')
	async sendQuote(
		@Param('id', ParseEntityIdPipe) id: string,
		@Body() body: SendDocumentEmailDto,
		@CurrentUser() user: any,
	) {
		return this.quoteSend.sendByEmail(id, user.organizationId, body, user.email);
	}

	@Get(':id/pdf')
	@Header('Content-Type', 'application/pdf')
	async downloadPdf(@Param('id', ParseEntityIdPipe) id: string, @Res() res: Response, @CurrentUser() user: any) {
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

	@Post(':token/accept-pay')
	async acceptPay(
		@Param('token') token: string,
		@Body() body: PublicAcceptDepositDto,
		@Req() req: Request,
	) {
		return this.quotes.publicAcceptWithDeposit(token, body, req.ip);
	}

	@Post(':token/reset-payment-choice')
	async resetPaymentChoice(@Param('token') token: string) {
		return this.quotes.publicResetPaymentChoice(token);
	}

	@Post(':token/reject')
	async reject(@Param('token') token: string) {
		return this.quotes.publicReject(token);
	}
}


