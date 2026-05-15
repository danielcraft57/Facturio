import { BadRequestException, Body, Controller, Param, Post } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { assertValidPublicToken } from '../invoices/public-token.util';

@Controller('public/invoices')
export class StripePublicController {
	constructor(private readonly stripe: StripeService) {}

	@Post(':token/create-payment-intent')
	createPaymentIntent(@Param('token') token: string) {
		assertValidPublicToken(token);
		return this.stripe.createPaymentIntentForInvoice(token);
	}

	@Post(':token/confirm-payment')
	confirmPayment(
		@Param('token') token: string,
		@Body() body: { paymentIntentId: string }
	) {
		assertValidPublicToken(token);
		if (!body?.paymentIntentId || typeof body.paymentIntentId !== 'string') {
			throw new BadRequestException('paymentIntentId requis');
		}
		return this.stripe.confirmPaymentIntentForInvoice(token, body.paymentIntentId);
	}
}
