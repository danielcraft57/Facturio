import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BillingService } from './billing.service';
import { BetaTesterService } from './beta-tester.service';
import { PlatformStripeService } from './platform-stripe.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { RedeemBetaInviteDto } from './dto/redeem-beta-invite.dto';
import { ValidateBetaInviteDto } from './dto/validate-beta-invite.dto';

@Controller('billing')
export class BillingController {
	constructor(
		private readonly billing: BillingService,
		private readonly betaTester: BetaTesterService,
		private readonly platformStripe: PlatformStripeService,
	) {}

	@Get('usage')
	getUsage(@CurrentUser() user: { organizationId: number }) {
		return this.billing.getUsage(user.organizationId);
	}

	/** Statistiques publiques du programme beta (places restantes, codes campagne). */
	@Get('beta-program/stats')
	getBetaProgramStats() {
		return this.betaTester.getPublicStats();
	}

	/** Vérifie un code beta sans authentification (inscription). */
	@Get('beta-invite/validate')
	validateBetaInvite(@Query() query: ValidateBetaInviteDto) {
		return this.betaTester.validateCode(query.code);
	}

	/** Active un code beta pour l'organisation connectée (compte Free uniquement). */
	@Post('beta-invite/redeem')
	redeemBetaInvite(
		@CurrentUser() user: { organizationId: number },
		@Body() body: RedeemBetaInviteDto,
	) {
		return this.betaTester.redeemCode(body.code, user.organizationId);
	}

	/** Checkout Stripe plateforme (.env) — abonnement PrestaFacture Pro */
	@Post('checkout')
	async createCheckout(
		@CurrentUser() user: { organizationId: number; email: string },
		@Body() body: CreateCheckoutDto,
	) {
		return this.platformStripe.createCheckoutSession(user.organizationId, user.email, body.plan, {
			billingSchedule: body.billingSchedule ?? 'MONTHLY',
		});
	}

	@Get('platform-stripe-publishable-key')
	getPlatformPublishableKey() {
		return { publishableKey: this.platformStripe.getPlatformPublishableKey() };
	}

	/** Portail client Stripe (gérer CB, annuler, factures plateforme). */
	@Post('portal')
	createPortal(@CurrentUser() user: { organizationId: number }) {
		return this.platformStripe.createPortalSession(user.organizationId);
	}

	/** Synchronise plan + résiliation depuis Stripe (retour checkout, portail, ouverture page). */
	@Post('sync-subscription')
	syncSubscription(@CurrentUser() user: { organizationId: number }) {
		return this.platformStripe.syncOrganizationFromStripe(user.organizationId);
	}

	/** Alias historique — même comportement que sync-subscription. */
	@Post('sync-after-checkout')
	syncAfterCheckout(@CurrentUser() user: { organizationId: number }) {
		return this.platformStripe.syncOrganizationFromStripe(user.organizationId);
	}
}
