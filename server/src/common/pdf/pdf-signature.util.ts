import * as fs from 'fs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PdfDoc = any;

/** Image (data URL ou chemin fichier) ou texte affiché sous « Signature ». */
export function tryEmbedSignatureImage(
	doc: PdfDoc,
	signature: string,
	x: number,
	y: number,
	maxWidth: number,
	maxHeight: number,
): boolean {
	try {
		if (signature.startsWith('data:image')) {
			const base64 = signature.split(',')[1];
			if (!base64) return false;
			doc.image(Buffer.from(base64, 'base64'), x, y, {
				fit: [maxWidth, maxHeight],
				align: 'left',
				valign: 'top',
			});
			return true;
		}
		if (fs.existsSync(signature)) {
			doc.image(signature, x, y, { fit: [maxWidth, maxHeight] });
			return true;
		}
	} catch {
		return false;
	}
	return false;
}

/** Vrai seulement pour une image (data URL ou fichier) — pas un simple prénom texte. */
export function hasRenderableSignature(signature?: string | null): boolean {
	const s = signature?.trim();
	if (!s) return false;
	if (s.startsWith('data:image')) return true;
	try {
		if (fs.existsSync(s)) return true;
	} catch {
		return false;
	}
	return false;
}

export function resolveSubscriptionSignature(): string | null {
	const raw =
		process.env.SUBSCRIPTION_SIGNATURE?.trim() ||
		process.env.PLATFORM_SIGNATURE?.trim() ||
		'';
	return raw || null;
}

/** Organisation « émetteur » pour les factures d'abonnement PrestaFacture (variables .env). */
export function buildPlatformIssuerOrganization(): Record<string, unknown> {
	return {
		name: process.env.COMPANY_NAME ?? 'PrestaFacture',
		legalName: process.env.COMPANY_NAME ?? 'PrestaFacture',
		address: process.env.COMPANY_ADDRESS ?? '',
		email: process.env.COMPANY_EMAIL ?? '',
		phone: process.env.COMPANY_PHONE ?? '',
		siret: process.env.COMPANY_SIRET ?? '',
		vatNumber: process.env.COMPANY_VAT ?? '',
		signature: resolveSubscriptionSignature(),
	};
}
