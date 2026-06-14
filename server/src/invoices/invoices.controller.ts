import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	Header,
	Logger,
	Param,
	ParseIntPipe,
	Patch,
	Post,
	Put,
	Query,
	Res,
} from '@nestjs/common';
import { ParseEntityIdPipe } from '../common/pipes/parse-entity-id.pipe';
import { InvoicesService } from './invoices.service';
import { InvoiceSendService } from './invoice-send.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { SendInvoiceDto } from './dto/send-invoice.dto';
import { buildEmailClickTrackUrl, buildEmailOpenTrackUrl } from '../common/email-track.util';
import { InvoiceListQueryDto, UpdateInvoiceDocumentFlagsDto } from './dto/invoice-document-folder.dto';
import { Response } from 'express';
import { PdfService } from '../common/pdf.service';
import { EmailService } from '../common/email.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { StripeService } from '../stripe/stripe.service';
import { assertValidPublicToken } from './public-token.util';
import { RefundsService } from '../refunds/refunds.service';
import { CreateRefundDto, CancelDepositDto } from '../refunds/dto/create-refund.dto';
import { InvoiceInstallmentsService } from './invoice-installments.service';
import {
	PreviewEqualInstallmentsDto,
	SetInvoiceInstallmentsDto,
} from './dto/set-invoice-installments.dto';
import { InvoiceInstallmentReminderService } from './invoice-installment-reminder.service';
import { InvoiceInstallmentReleaseService } from './invoice-installment-release.service';

@Controller(['invoices', 'factures'])
export class InvoicesController {
	constructor(
		private readonly invoices: InvoicesService,
		private readonly invoiceSend: InvoiceSendService,
		private readonly pdfService: PdfService,
		private readonly organizations: OrganizationsService,
		private readonly email: EmailService,
		private readonly refunds: RefundsService,
		private readonly installments: InvoiceInstallmentsService,
		private readonly installmentReminders: InvoiceInstallmentReminderService,
		private readonly installmentReleases: InvoiceInstallmentReleaseService,
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
	findOne(@Param('id', ParseEntityIdPipe) id: string, @CurrentUser() user: any) {
		return this.invoices.findOne(id, user.organizationId);
	}

	@Patch(':id')
	update(
		@Param('id', ParseEntityIdPipe) id: string,
		@Body() data: UpdateInvoiceDto,
		@CurrentUser() user: any
	) {
		return this.invoices.update(id, data, user.organizationId);
	}

	@Patch(':id/document-flags')
	updateDocumentFlags(
		@Param('id', ParseEntityIdPipe) id: string,
		@Body() body: UpdateInvoiceDocumentFlagsDto,
		@CurrentUser() user: any,
	) {
		return this.invoices.updateDocumentFlags(id, body, user.organizationId);
	}

	@Post(':id/archive')
	archive(@Param('id', ParseEntityIdPipe) id: string, @CurrentUser() user: any) {
		return this.invoices.archive(id, user.organizationId);
	}

	@Post(':id/restore')
	restore(@Param('id', ParseEntityIdPipe) id: string, @CurrentUser() user: any) {
		return this.invoices.restore(id, user.organizationId);
	}

	@Delete(':id')
	remove(@Param('id', ParseEntityIdPipe) id: string, @CurrentUser() user: any) {
		return this.invoices.archive(id, user.organizationId);
	}

	@Get(':id/pdf')
	@Header('Content-Type', 'application/pdf')
	async downloadPdf(@Param('id', ParseEntityIdPipe) id: string, @Res() res: Response, @CurrentUser() user: any) {
		const invoice = await this.invoices.findOne(id, user.organizationId);
		const organization = await this.organizations.getProfile(user.organizationId).catch(() => undefined);
		const buf = await this.pdfService.generateInvoicePdf(invoice, organization);
		res.setHeader('Content-Disposition', `inline; filename=invoice-${invoice.number}.pdf`);
		return res.send(buf);
	}

	@Get(':id/installments')
	listInstallments(@Param('id', ParseEntityIdPipe) id: string, @CurrentUser() user: any) {
		return this.installments.listForInvoiceWithFinance(id, user.organizationId);
	}

	@Put(':id/installments')
	setInstallments(
		@Param('id', ParseEntityIdPipe) id: string,
		@Body() body: SetInvoiceInstallmentsDto,
		@CurrentUser() user: any,
	) {
		return this.installments.setSchedule(id, body.installments, user.organizationId);
	}

	@Delete(':id/installments')
	clearInstallments(@Param('id', ParseEntityIdPipe) id: string, @CurrentUser() user: any) {
		return this.installments.clearSchedule(id, user.organizationId);
	}

	@Post(':id/installments/:installmentId/release')
	async releaseInstallment(
		@Param('id', ParseEntityIdPipe) id: string,
		@Param('installmentId', ParseIntPipe) installmentId: number,
		@CurrentUser() user: any,
	) {
		const rows = await this.installments.listForInvoice(id, user.organizationId);
		if (!rows.some((r) => r.id === installmentId)) {
			throw new BadRequestException('Échéance introuvable sur cette facture');
		}
		const sent = await this.installmentReleases.releaseInstallment(installmentId, {
			force: true,
			organizationId: user.organizationId,
		});
		if (!sent) {
			throw new BadRequestException(
				'Impossible d’envoyer cette mensualité (acompte non payé, échéance déjà active, etc.)',
			);
		}
		return { success: true, installmentId };
	}

	@Post(':id/installments/:installmentId/remind')
	async remindInstallment(
		@Param('id', ParseEntityIdPipe) id: string,
		@Param('installmentId', ParseIntPipe) installmentId: number,
		@CurrentUser() user: any,
	) {
		const rows = await this.installments.listForInvoice(id, user.organizationId);
		if (!rows.some((r) => r.id === installmentId)) {
			throw new BadRequestException('Échéance introuvable sur cette facture');
		}
		const sent = await this.installmentReminders.sendReminderForInstallment(installmentId, {
			kind: 'manual',
			force: true,
			organizationId: user.organizationId,
		});
		if (!sent) {
			throw new BadRequestException('Impossible d’envoyer la relance (facture non envoyée, client sans email, etc.)');
		}
		return { success: true, installmentId };
	}

	@Post(':id/installments/preview-equal')
	previewEqualInstallments(
		@Param('id', ParseEntityIdPipe) id: string,
		@Body() body: PreviewEqualInstallmentsDto,
		@CurrentUser() user: any,
	) {
		void id;
		void user;
		return this.installments.previewEqualSchedule(
			body.total,
			body.count,
			body.firstDueDate,
			body.intervalMonths ?? 1,
		);
	}

	@Get(':id/payments')
	payments(@Param('id', ParseEntityIdPipe) id: string, @CurrentUser() user: any) {
		return this.invoices.listPayments(id, user.organizationId);
	}

	@Post(':id/payments')
	addPayment(
		@Param('id', ParseEntityIdPipe) id: string,
		@Body() body: { amount: number; date?: string | Date; method?: string; notes?: string },
		@CurrentUser() user: any
	) {
		return this.invoices.addPayment(id, body.amount, body.date, body.method, body.notes, user.organizationId);
	}

	@Get(':id/refunds')
	listRefunds(@Param('id', ParseEntityIdPipe) id: string, @CurrentUser() user: any) {
		return this.refunds.findByInvoice(id, user.organizationId);
	}

	@Post(':id/refunds')
	createRefund(
		@Param('id', ParseEntityIdPipe) id: string,
		@Body() body: CreateRefundDto,
		@CurrentUser() user: any,
	) {
		return this.refunds.createForInvoice(id, body, user.organizationId);
	}

	@Post(':id/cancel')
	cancelInvoice(
		@Param('id', ParseEntityIdPipe) id: string,
		@Body() body: { reason?: string },
		@CurrentUser() user: any,
	) {
		return this.invoices.cancel(id, user.organizationId, body?.reason);
	}

	@Post(':id/cancel-deposit')
	cancelDeposit(
		@Param('id', ParseEntityIdPipe) id: string,
		@Body() body: CancelDepositDto,
		@CurrentUser() user: any,
	) {
		return this.refunds.cancelDepositEngagement(id, user.organizationId, body);
	}

	@Post(':id/send')
	async sendInvoice(
		@Param('id', ParseEntityIdPipe) id: string,
		@Body() body: SendInvoiceDto,
		@CurrentUser() user: any,
	) {
		return this.invoiceSend.sendByEmail(id, user.organizationId, body, user.email);
	}

	@Post(':id/remind')
	async sendReminder(@Param('id', ParseEntityIdPipe) id: string, @CurrentUser() user: any) {
		const { invoice, daysOverdue, publicUrl, reminderAmount } = await this.invoices.prepareReminder(
			id,
			user.organizationId,
		);
		const organization = await this.organizations.getProfile(user.organizationId).catch(() => undefined);
		const pdf = await this.pdfService.generateInvoicePdf(invoice, organization);
		const client = invoice.client as { email?: string; name?: string; companyName?: string };
		const token = invoice.publicToken;
		const trackOpenUrl = token ? buildEmailOpenTrackUrl('invoice', token) : undefined;
		const paymentUrl = token
			? buildEmailClickTrackUrl('invoice', token, 'pay')
			: publicUrl;
		await this.email.sendReminder({
			to: client.email!,
			invoiceNumber: invoice.number,
			invoiceDate: invoice.date,
			clientName: client.name || client.companyName || '',
			amount: reminderAmount,
			daysOverdue,
			paymentUrl,
			trackOpenUrl,
			pdfBuffer: pdf,
			organization,
		});
		return { success: true, invoiceId: id, daysOverdue: daysOverdue ?? null, amount: reminderAmount };
	}
}

/**
 * Controller public pour les factures (accès par token, sans auth).
 * Routes publiques (accès par token, sans auth).
 */
@Controller('public/invoices')
export class PublicInvoicesController {
	private readonly logger = new Logger(PublicInvoicesController.name);

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
		let paymentError: string | null = null;
		if (invoice.canPayOnline) {
			try {
				payment = await this.stripe.createPaymentIntentForInvoice(token);
			} catch (err) {
				paymentError = (err as Error).message || 'Paiement en ligne indisponible pour le moment';
				this.logger.warn(
					`Checkout public ${invoice.number} (${token.slice(0, 8)}...): ${paymentError}`,
				);
			}
		}
		return { invoice, payment, paymentError };
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

	@Get(':token/engagement-contract.pdf')
	@Header('Content-Type', 'application/pdf')
	async downloadEngagementContractPdf(@Param('token') token: string, @Res() res: Response) {
		assertValidPublicToken(token);
		const invoice = await this.invoices.findByPublicTokenForPdf(token);
		const buf = await this.pdfService.generateEngagementContractPdf(invoice);
		res.setHeader('Content-Disposition', `inline; filename=contrat-engagement-${invoice.number}.pdf`);
		return res.send(buf);
	}
}


