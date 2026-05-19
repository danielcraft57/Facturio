import type { SecretsCryptoService } from './secrets-crypto.service';

export type OrgStripeSecretFields = {
	invoiceStripeSecretKey?: string | null;
	invoiceStripeWebhookSecret?: string | null;
	invoiceStripePublishableKey?: string | null;
};

export function encryptOrgStripeFields(
	crypto: SecretsCryptoService,
	data: {
		invoiceStripeSecretKey?: string | null;
		invoiceStripeWebhookSecret?: string | null;
		clearInvoiceStripeSecretKey?: boolean;
		clearInvoiceStripeWebhookSecret?: boolean;
	},
): Partial<OrgStripeSecretFields> {
	const out: Partial<OrgStripeSecretFields> = {};

	if (data.clearInvoiceStripeSecretKey) {
		out.invoiceStripeSecretKey = null;
	} else if (data.invoiceStripeSecretKey !== undefined) {
		const plain = data.invoiceStripeSecretKey?.trim();
		if (plain) {
			out.invoiceStripeSecretKey = crypto.encrypt(plain);
		}
	}

	if (data.clearInvoiceStripeWebhookSecret) {
		out.invoiceStripeWebhookSecret = null;
	} else if (data.invoiceStripeWebhookSecret !== undefined) {
		const plain = data.invoiceStripeWebhookSecret?.trim();
		if (plain) {
			out.invoiceStripeWebhookSecret = crypto.encrypt(plain);
		}
	}

	return out;
}

export function decryptOrgStripeSecrets(
	crypto: SecretsCryptoService,
	org: OrgStripeSecretFields,
): { secretKey: string | null; webhookSecret: string | null; publishableKey: string | null } {
	return {
		secretKey: crypto.decrypt(org.invoiceStripeSecretKey),
		webhookSecret: crypto.decrypt(org.invoiceStripeWebhookSecret),
		publishableKey: org.invoiceStripePublishableKey?.trim() || null,
	};
}
