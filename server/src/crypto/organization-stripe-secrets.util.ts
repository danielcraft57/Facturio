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
	},
): Partial<OrgStripeSecretFields> {
	const out: Partial<OrgStripeSecretFields> = {};
	if (data.invoiceStripeSecretKey !== undefined) {
		const plain = data.invoiceStripeSecretKey?.trim() || null;
		out.invoiceStripeSecretKey = plain ? crypto.encrypt(plain) : null;
	}
	if (data.invoiceStripeWebhookSecret !== undefined) {
		const plain = data.invoiceStripeWebhookSecret?.trim() || null;
		out.invoiceStripeWebhookSecret = plain ? crypto.encrypt(plain) : null;
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
