import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { PlatformStripeService } from '../billing/platform-stripe.service';
import { decryptOrgStripeSecrets } from '../crypto/organization-stripe-secrets.util';
import { SecretsCryptoService } from '../crypto/secrets-crypto.service';
import { PrismaService } from '../prisma/prisma.service';
import { createStripeClient } from './stripe-client';
import { StripeService, type StripePaymentIntentPayload } from './stripe.service';
import {
	buildUnifiedStripeWebhookUrl,
	isPlatformBillingEventType,
	peekWebhookPayload,
} from './stripe-webhook.util';

type StripeEvent = {
	id: string;
	type: string;
	data: { object: Record<string, unknown> };
};

@Injectable()
export class StripeUnifiedWebhookService {
	private readonly logger = new Logger(StripeUnifiedWebhookService.name);

	constructor(
		private readonly config: ConfigService,
		private readonly platformStripe: PlatformStripeService,
		private readonly stripeService: StripeService,
		private readonly prisma: PrismaService,
		private readonly secretsCrypto: SecretsCryptoService,
	) {}

	getWebhookUrl(): string {
		return buildUnifiedStripeWebhookUrl();
	}

	/**
	 * Webhook unique : abonnement Facturio (clés .env) + paiements factures clients (clés org).
	 * Même URL à configurer dans le Dashboard Stripe (plateforme et/ou compte prestataire).
	 */
	async handle(
		rawBody: Buffer,
		signature: string,
		options?: { organizationIdHint?: number },
	): Promise<{ received: boolean }> {
		if (!signature?.trim()) {
			throw new BadRequestException('En-tête stripe-signature manquant');
		}

		const peek = peekWebhookPayload(rawBody);

		if (options?.organizationIdHint) {
			const orgResult = await this.tryVerifyWithOrgSecret(
				rawBody,
				signature,
				options.organizationIdHint,
			);
			if (orgResult) return orgResult;
		}

		const platformResult = await this.tryVerifyWithPlatformSecret(rawBody, signature, peek);
		if (platformResult) return platformResult;

		if (peek.organizationId) {
			const orgResult = await this.tryVerifyWithOrgSecret(rawBody, signature, peek.organizationId);
			if (orgResult) return orgResult;
		}

		this.logger.warn(
			`Webhook Stripe : signature invalide (type=${peek.type ?? '?'}, org=${peek.organizationId ?? '?'})`,
		);
		throw new BadRequestException('Signature webhook invalide');
	}

	private async tryVerifyWithPlatformSecret(
		rawBody: Buffer,
		signature: string,
		peek: ReturnType<typeof peekWebhookPayload>,
	): Promise<{ received: boolean } | null> {
		const secret = this.config.stripeWebhookSecret?.trim();
		const platformKey = this.config.stripeSecretKey?.trim();
		if (!secret || !platformKey) return null;

		try {
			const stripe = createStripeClient(platformKey);
			const event = stripe.webhooks.constructEvent(
				rawBody,
				signature,
				secret,
			) as unknown as StripeEvent;

			if (event.type === 'payment_intent.succeeded' && peek.invoiceId) {
				await this.stripeService.fulfillPaymentIntent(
					event.data.object as unknown as StripePaymentIntentPayload,
				);
				this.logger.log(`Facture ${peek.invoiceId} réglée via webhook (compte plateforme)`);
				return { received: true };
			}

			if (isPlatformBillingEventType(event.type)) {
				return this.platformStripe.processVerifiedPlatformEvent(
					event as Parameters<PlatformStripeService['processVerifiedPlatformEvent']>[0],
				);
			}

			return { received: true };
		} catch {
			return null;
		}
	}

	private async tryVerifyWithOrgSecret(
		rawBody: Buffer,
		signature: string,
		organizationId: number,
	): Promise<{ received: boolean } | null> {
		const org = await this.prisma.organization.findUnique({
			where: { id: organizationId },
			select: {
				invoiceStripeSecretKey: true,
				invoiceStripePublishableKey: true,
				invoiceStripeWebhookSecret: true,
			},
		});
		if (!org) return null;

		const { secretKey, webhookSecret } = decryptOrgStripeSecrets(this.secretsCrypto, org);
		if (!secretKey?.trim() || !webhookSecret?.trim()) return null;

		try {
			const stripe = createStripeClient(secretKey.trim());
			const event = stripe.webhooks.constructEvent(
				rawBody,
				signature,
				webhookSecret.trim(),
			) as unknown as StripeEvent;

			if (event.type === 'payment_intent.succeeded') {
				await this.stripeService.fulfillPaymentIntent(
					event.data.object as unknown as StripePaymentIntentPayload,
				);
				this.logger.log(`Paiement facture enregistré (webhook org ${organizationId})`);
			}

			return { received: true };
		} catch {
			return null;
		}
	}
}
