/**
 * Vérifie la connexion Stripe (clés .env) sans effectuer de paiement réel.
 * Usage : node scripts/test-stripe-config.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const Stripe = require('stripe');

async function main() {
	const secret = process.env.STRIPE_SECRET_KEY;
	if (!secret) {
		console.error('STRIPE_SECRET_KEY manquant dans server/.env');
		process.exit(1);
	}
	const stripe = new Stripe(secret);
	const account = await stripe.accounts.retrieve();
	console.log('Stripe OK — compte:', account.id, account.email || account.business_profile?.name || '');
	process.exit(0);
}

main().catch((err) => {
	console.error('Stripe erreur:', err.message);
	process.exit(1);
});
