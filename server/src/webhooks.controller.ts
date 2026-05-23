import { BadRequestException, Body, Controller, Headers, Param, Post, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from './prisma/prisma.service';
import { StripeService } from './stripe/stripe.service';
import { PlatformStripeService } from './billing/platform-stripe.service';
import { StripeUnifiedWebhookService } from './stripe/stripe-unified-webhook.service';

@Controller('webhooks')
export class WebhooksController {
	constructor(
		private readonly prisma: PrismaService,
		private readonly stripeService: StripeService,
		private readonly platformStripe: PlatformStripeService,
		private readonly stripeUnifiedWebhook: StripeUnifiedWebhookService,
	) {}

	@Post('email')
	async email(@Body() event: any) {
		const type = String(event?.RecordType || event?.type || 'unknown').toLowerCase();
		const providerId = event?.MessageID || event?.id || null;
		const quoteId = event?.quoteId ?? event?.Metadata?.quoteId ?? null;
		const invoiceId = event?.invoiceId ?? event?.Metadata?.invoiceId ?? null;
		await this.prisma.emailEvent.create({
			data: {
				quoteId: quoteId ? String(quoteId) : undefined,
				invoiceId: invoiceId ? String(invoiceId) : undefined,
				type,
				providerId,
				meta: event,
			},
		});
		return { ok: true };
	}

	/**
	 * Webhook Stripe unifié — abonnement Facturio (.env) + factures clients payées (clés org).
	 * Même URL à enregistrer dans le Dashboard Stripe (compte plateforme et/ou prestataire).
	 */
	@Post('stripe')
	async stripeUnified(
		@Req() req: RawBodyRequest<Request>,
		@Headers('stripe-signature') signature: string | undefined,
	) {
		const rawBody = req.rawBody;
		if (!rawBody) {
			throw new BadRequestException('Corps brut requis pour le webhook Stripe');
		}
		return this.stripeUnifiedWebhook.handle(rawBody, signature ?? '');
	}

	/** Alias — même handler que POST /webhooks/stripe */
	@Post('stripe/platform')
	async stripePlatform(
		@Req() req: RawBodyRequest<Request>,
		@Headers('stripe-signature') signature: string | undefined,
	) {
		return this.stripeUnified(req, signature);
	}

	/** @deprecated Même URL que /webhooks/stripe — conservé pour compatibilité */
	@Post('stripe/invoices/:organizationId')
	async stripeInvoiceOrg(
		@Param('organizationId') organizationId: string,
		@Req() req: RawBodyRequest<Request>,
		@Headers('stripe-signature') signature: string | undefined,
	) {
		const rawBody = req.rawBody;
		if (!rawBody) {
			throw new BadRequestException('Corps brut requis pour le webhook Stripe');
		}
		const orgId = Number(organizationId);
		if (!orgId || Number.isNaN(orgId)) {
			throw new BadRequestException('organizationId invalide');
		}
		return this.stripeUnifiedWebhook.handle(rawBody, signature ?? '', {
			organizationIdHint: orgId,
		});
	}
}
