import {
	type InvoiceStripePaymentMethodId,
	INVOICE_STRIPE_PAYMENT_METHOD_IDS,
} from './invoice-stripe-payment-methods';

/** Moyens BNPL (Buy Now Pay Later) pris en charge sur les factures clients via Stripe. */
export const INVOICE_BNPL_PAYMENT_METHOD_IDS = ['klarna', 'alma'] as const;

export type InvoiceBnplPaymentMethodId = (typeof INVOICE_BNPL_PAYMENT_METHOD_IDS)[number];

const BNPL_SET = new Set<string>(INVOICE_BNPL_PAYMENT_METHOD_IDS);

/**
 * Plafonds indicatifs en EUR pour la France (Stripe / fournisseurs BNPL).
 * Stripe peut proposer d'autres options selon le profil client ; on évite surtout
 * d'envoyer un moyen BNPL hors fourchette au PaymentIntent (erreur API).
 */
export const BNPL_AMOUNT_LIMITS_EUR: Record<InvoiceBnplPaymentMethodId, { min: number; max: number }> =
	{
		/** Klarna — paiement en 3x sans frais (France), fourchette Stripe doc. */
		klarna: { min: 1, max: 1_500 },
		/** Alma — 2x / 3x / 4x sans frais (France). */
		alma: { min: 50, max: 5_000 },
	};

/**
 * Indique si l'identifiant correspond à un moyen BNPL (fractionné côté client).
 *
 * @param id - Identifiant Stripe (`klarna`, `alma`, …)
 */
export function isInvoiceBnplPaymentMethod(id: string): id is InvoiceBnplPaymentMethodId {
	return BNPL_SET.has(id);
}

/**
 * Filtre les moyens BNPL selon le montant et la devise.
 * Les moyens non BNPL sont conservés tels quels.
 *
 * @param configured - Moyens activés par l'organisation
 * @param amountEur - Montant restant à payer (EUR)
 * @param currency - Devise de la facture (BNPL FR = EUR uniquement)
 * @returns Liste utilisable pour `payment_method_types` sur le PaymentIntent
 */
export function filterBnplPaymentMethodsForAmount(
	configured: InvoiceStripePaymentMethodId[],
	amountEur: number,
	currency: string,
): InvoiceStripePaymentMethodId[] {
	const normalizedCurrency = currency.trim().toLowerCase();
	const isEur = normalizedCurrency === 'eur';

	return configured.filter((id) => {
		if (!isInvoiceBnplPaymentMethod(id)) return true;
		if (!isEur) return false;
		const limits = BNPL_AMOUNT_LIMITS_EUR[id];
		return amountEur >= limits.min && amountEur <= limits.max;
	});
}

/**
 * Retourne les moyens BNPL effectivement proposés pour un montant donné.
 *
 * @param configured - Moyens activés par l'organisation
 * @param amountEur - Montant restant à payer
 * @param currency - Devise de la facture
 */
export function resolveActiveBnplPaymentMethods(
	configured: InvoiceStripePaymentMethodId[],
	amountEur: number,
	currency: string,
): InvoiceBnplPaymentMethodId[] {
	return filterBnplPaymentMethodsForAmount(configured, amountEur, currency).filter(
		isInvoiceBnplPaymentMethod,
	);
}

/**
 * Garantit au moins un moyen de paiement pour Stripe.
 *
 * @param methods - Liste après filtrage BNPL
 */
export function ensureInvoicePaymentMethodTypes(
	methods: InvoiceStripePaymentMethodId[],
): InvoiceStripePaymentMethodId[] {
	if (methods.length > 0) return methods;
	return ['card'];
}

/** Vérifie que tous les ids BNPL sont déclarés dans la liste globale des moyens facture. */
export function assertBnplMethodsRegistered(): void {
	for (const id of INVOICE_BNPL_PAYMENT_METHOD_IDS) {
		if (!INVOICE_STRIPE_PAYMENT_METHOD_IDS.includes(id)) {
			throw new Error(`Moyen BNPL manquant dans INVOICE_STRIPE_PAYMENT_METHOD_IDS: ${id}`);
		}
	}
}
