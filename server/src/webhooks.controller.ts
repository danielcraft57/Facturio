import { BadRequestException, Body, Controller, Headers, Param, Post, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from './prisma/prisma.service';
import { StripeService } from './stripe/stripe.service';
import { PlatformStripeService } from './billing/platform-stripe.service';

@Controller('webhooks')
export class WebhooksController {
	constructor(
		private readonly prisma: PrismaService,
		private readonly stripeService: StripeService,
		private readonly platformStripe: PlatformStripeService,
	) {}

	@Post('email')
	async email(@Body() event: any) {
		const type = String(event?.RecordType || event?.type || 'unknown').toLowerCase();
		const providerId = event?.MessageID || event?.id || null;
		const quoteId = event?.quoteId ?? (event?.Metadata?.quoteId ? Number(event.Metadata.quoteId) : null);
		const invoiceId = event?.invoiceId ?? (event?.Metadata?.invoiceId ? Number(event.Metadata.invoiceId) : null);
		await this.prisma.emailEvent.create({
			data: {
				quoteId: quoteId ? Number(quoteId) : undefined,
				invoiceId: invoiceId ? Number(invoiceId) : undefined,
				type,
				providerId,
				meta: event,
			},
		});
		return { ok: true };
	}

	/** Webhook Stripe plateforme — abonnement Facturio (clés .env) */
	@Post('stripe/platform')
	async stripePlatform(
		@Req() req: RawBodyRequest<Request>,
		@Headers('stripe-signature') signature: string | undefined,
	) {
		if (!signature) {
			throw new BadRequestException('En-tête stripe-signature manquant');
		}
		const rawBody = req.rawBody;
		if (!rawBody) {
			throw new BadRequestException('Corps brut requis pour le webhook Stripe');
		}
		return this.platformStripe.handlePlatformWebhook(rawBody, signature);
	}

	/** Webhook Stripe prestataire — paiement facture client (clés BDD par organisation) */
	@Post('stripe/invoices/:organizationId')
	async stripeInvoiceOrg(
		@Param('organizationId') organizationId: string,
		@Req() req: RawBodyRequest<Request>,
		@Headers('stripe-signature') signature: string | undefined,
	) {
		if (!signature) {
			throw new BadRequestException('En-tête stripe-signature manquant');
		}
		const rawBody = req.rawBody;
		if (!rawBody) {
			throw new BadRequestException('Corps brut requis pour le webhook Stripe');
		}
		const orgId = Number(organizationId);
		if (!orgId || Number.isNaN(orgId)) {
			throw new BadRequestException('organizationId invalide');
		}
		return this.stripeService.handleOrgWebhook(orgId, rawBody, signature);
	}

	/** @deprecated Utiliser /webhooks/stripe/platform ou /webhooks/stripe/invoices/:orgId */
	@Post('stripe')
	async stripeLegacy(
		@Req() req: RawBodyRequest<Request>,
		@Headers('stripe-signature') signature: string | undefined,
	) {
		return this.stripePlatform(req, signature);
	}
}
