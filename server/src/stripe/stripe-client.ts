/**
 * Client Stripe compatible CommonJS (ts-node-dev) et build tsc.
 * `import Stripe from 'stripe'` casse au runtime : default n'est pas un constructeur.
 */
import Stripe = require('stripe');

export type StripeClient = InstanceType<typeof Stripe>;

export function createStripeClient(secretKey: string): StripeClient {
	return new Stripe(secretKey);
}
