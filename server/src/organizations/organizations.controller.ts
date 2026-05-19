import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { SireneLookupService } from './sirene-lookup.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateInvoiceStripeDto } from './dto/update-invoice-stripe.dto';

@Controller('organization')
export class OrganizationsController {
	constructor(
		private readonly organizationsService: OrganizationsService,
		private readonly sireneLookup: SireneLookupService,
	) {}

	@Get('profile')
	getProfile(@CurrentUser() user: any) {
		return this.organizationsService.getProfile(user.organizationId);
	}

	@Patch('profile')
	updateProfile(@CurrentUser() user: any, @Body() data: any) {
		return this.organizationsService.updateProfile(user.organizationId, data);
	}

	/** Données publiques INSEE / RNE (proxy sécurisé, utilisateur authentifié). */
	@Get('siret-lookup/:siretOrSiren')
	lookupSiret(@CurrentUser() _user: { organizationId: number }, @Param('siretOrSiren') siretOrSiren: string) {
		return this.sireneLookup.lookup(siretOrSiren);
	}

	/** Clés Stripe du prestataire (paiements factures) — distinct du Stripe plateforme .env */
	@Patch('invoice-stripe')
	updateInvoiceStripe(@CurrentUser() user: any, @Body() data: UpdateInvoiceStripeDto) {
		return this.organizationsService.updateInvoiceStripe(user.organizationId, data);
	}

	@Get('invoice-stripe/webhook-url')
	getInvoiceStripeWebhookUrl(@CurrentUser() user: { organizationId: number }) {
		return {
			webhookUrl: this.organizationsService.getInvoiceStripeWebhookUrl(user.organizationId),
		};
	}
}

