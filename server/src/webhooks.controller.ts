import { BadRequestException, Body, Controller, Headers, Post, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from './prisma/prisma.service';
import { StripeService } from './stripe/stripe.service';

@Controller('webhooks')
export class WebhooksController {
	constructor(
		private readonly prisma: PrismaService,
		private readonly stripeService: StripeService
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
				meta: event
			}
		});
		return { ok: true };
	}

	@Post('stripe')
	async stripe(
		@Req() req: RawBodyRequest<Request>,
		@Headers('stripe-signature') signature: string | undefined
	) {
		if (!signature) {
			throw new BadRequestException('En-tête stripe-signature manquant');
		}
		const rawBody = req.rawBody;
		if (!rawBody) {
			throw new BadRequestException('Corps brut requis pour le webhook Stripe');
		}
		return this.stripeService.handleWebhook(rawBody, signature);
	}
}
