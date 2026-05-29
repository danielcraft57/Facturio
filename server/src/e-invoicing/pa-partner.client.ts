import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';

export type PaConnectionStatus = {
	configured: boolean;
	baseUrl: string | null;
	provider: string;
	mode: 'mock' | 'api';
};

export type PaSubmitPayload = {
	invoiceId: string;
	invoiceNumber: string;
	sellerSiret?: string | null;
	buyerSiren?: string | null;
	facturXXml: string;
	idempotencyKey: string;
};

export type PaSubmitResult = {
	provider: string;
	mode: 'mock' | 'api';
	status: 'accepted' | 'rejected';
	externalId: string;
	message: string;
	raw?: unknown;
};

@Injectable()
export class PaPartnerClient {
	constructor(private readonly config: ConfigService) {}

	getStatus(): PaConnectionStatus {
		return {
			configured: this.config.paPartnerConfigured,
			baseUrl: this.config.paPartnerBaseUrl || null,
			provider: this.config.paPartnerProvider,
			mode: this.config.paPartnerConfigured ? 'api' : 'mock',
		};
	}

	async testConnection(): Promise<{ ok: boolean; mode: 'mock' | 'api'; message: string }> {
		const status = this.getStatus();
		if (!status.configured) {
			return {
				ok: true,
				mode: 'mock',
				message:
					'PA non configurée : mode mock actif. Configurez PA_PARTNER_BASE_URL et PA_PARTNER_API_KEY.',
			};
		}
		try {
			const res = await fetch(`${status.baseUrl}/health`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${this.config.paPartnerApiKey}`,
				},
			});
			if (!res.ok) {
				return {
					ok: false,
					mode: 'api',
					message: `PA indisponible (${res.status})`,
				};
			}
			return { ok: true, mode: 'api', message: 'Connexion PA OK' };
		} catch (e) {
			return {
				ok: false,
				mode: 'api',
				message: `Erreur connexion PA: ${e instanceof Error ? e.message : 'inconnue'}`,
			};
		}
	}

	async submitInvoice(payload: PaSubmitPayload): Promise<PaSubmitResult> {
		const status = this.getStatus();
		if (!status.configured) {
			return {
				provider: status.provider,
				mode: 'mock',
				status: 'accepted',
				externalId: `mock-${payload.invoiceNumber}`,
				message: 'Soumission simulée en mode mock (PA non configurée).',
				raw: {
					invoiceId: payload.invoiceId,
					idempotencyKey: payload.idempotencyKey,
				},
			};
		}

		const body = {
			invoiceId: payload.invoiceId,
			invoiceNumber: payload.invoiceNumber,
			sellerSiret: payload.sellerSiret ?? null,
			buyerSiren: payload.buyerSiren ?? null,
			facturXXml: payload.facturXXml,
		};

		const res = await fetch(`${status.baseUrl}/invoices/submit`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${this.config.paPartnerApiKey}`,
				'Idempotency-Key': payload.idempotencyKey,
			},
			body: JSON.stringify(body),
		});

		const raw = await res.json().catch(() => ({}));
		if (!res.ok) {
			return {
				provider: status.provider,
				mode: 'api',
				status: 'rejected',
				externalId: String((raw as { externalId?: string }).externalId || ''),
				message: String((raw as { message?: string }).message || `PA reject (${res.status})`),
				raw,
			};
		}

		return {
			provider: status.provider,
			mode: 'api',
			status: 'accepted',
			externalId: String((raw as { externalId?: string }).externalId || `${payload.invoiceNumber}`),
			message: String((raw as { message?: string }).message || 'Soumission PA acceptée'),
			raw,
		};
	}
}

