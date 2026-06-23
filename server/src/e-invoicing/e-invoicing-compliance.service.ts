import { Injectable } from '@nestjs/common';
import { EInvoiceStatus } from '@prisma/client';

export type ComplianceCheck = {
	id: string;
	label: string;
	ok: boolean;
	hint?: string;
};

export type OrganizationReadiness = {
	ready: boolean;
	score: number;
	checks: ComplianceCheck[];
	planAllowsEInvoicing: boolean;
	paConnected: boolean;
	message: string;
};

export type InvoiceReadiness = {
	invoiceId: string;
	invoiceNumber: string;
	status: EInvoiceStatus;
	ready: boolean;
	score: number;
	checks: ComplianceCheck[];
	canGenerateFacturX: boolean;
};

@Injectable()
export class EInvoicingComplianceService {
	evaluateOrganization(org: {
		name: string | null;
		siret: string | null;
		siren: string | null;
		vatNumber: string | null;
		address: string | null;
		zipCode: string | null;
		city: string | null;
		countryCode: string | null;
		email: string | null;
	} | null): Omit<OrganizationReadiness, 'planAllowsEInvoicing' | 'paConnected'> {
		const checks: ComplianceCheck[] = [
			this.check('org_name', 'Raison sociale / nom', !!org?.name?.trim()),
			this.check('org_siret', 'SIRET émetteur (14 chiffres)', this.isValidSiret(org?.siret)),
			this.check('org_siren', 'SIREN émetteur (9 chiffres)', this.isValidSiren(org?.siren || this.siretToSiren(org?.siret))),
			this.check('org_address', 'Adresse complète', !!(org?.address?.trim() && org?.zipCode?.trim() && org?.city?.trim())),
			this.check('org_country', 'Pays (code ISO)', !!org?.countryCode?.trim()),
		];
		const score = this.score(checks);
		return {
			ready: checks.every((c) => c.ok),
			score,
			checks,
			message:
				score === 100
					? 'Profil émetteur prêt pour la facturation électronique.'
					: 'Complétez votre profil entreprise (Paramètres) pour préparer la facturation électronique.',
		};
	}

	evaluateClient(client: {
		name: string;
		isCompany: boolean;
		companyName: string | null;
		siren: string | null;
		vatNumber: string | null;
		address: string | null;
		countryCode: string | null;
	}): { ready: boolean; score: number; checks: ComplianceCheck[] } {
		const b2b = client.isCompany;
		const checks: ComplianceCheck[] = [
			this.check('client_name', 'Nom du client', !!client.name?.trim()),
			this.check(
				'client_b2b',
				'Client professionnel (B2B)',
				b2b,
				'Cochez « entreprise » pour un client assujetti B2B.',
			),
		];
		if (b2b) {
			checks.push(
				this.check('client_siren', 'SIREN client (9 chiffres)', this.isValidSiren(client.siren), 'Requis pour l’annuaire PA.'),
				this.check(
					'client_vat',
					'N° TVA intracommunautaire (si UE)',
					!client.countryCode || client.countryCode === 'FR' ? !!client.vatNumber?.trim() || true : !!client.vatNumber?.trim(),
					'Recommandé pour les clients UE.',
				),
				this.check('client_address', 'Adresse client', !!client.address?.trim()),
			);
		}
		const score = this.score(checks);
		return { ready: checks.filter((c) => c.id.startsWith('client_')).every((c) => c.ok || c.id === 'client_vat'), score, checks };
	}

	evaluateInvoice(
		invoice: { id: string; number: string; status: string; sentAt: Date | null; lines: { description: string }[] },
		orgReady: boolean,
		clientReady: boolean,
	): InvoiceReadiness {
		const checks: ComplianceCheck[] = [
			this.check('inv_sent', 'Facture envoyée (hors brouillon)', invoice.status !== 'DRAFT' && !!invoice.sentAt),
			this.check('inv_lines', 'Au moins une ligne', invoice.lines.length > 0),
			this.check('inv_org', 'Profil émetteur conforme', orgReady),
			this.check('inv_client', 'Client B2B renseigné', clientReady),
		];
		const score = this.score(checks);
		const ready = checks.every((c) => c.ok);
		return {
			invoiceId: invoice.id,
			invoiceNumber: invoice.number,
			status: ready ? EInvoiceStatus.READY : EInvoiceStatus.NOT_READY,
			ready,
			score,
			checks,
			canGenerateFacturX: ready,
		};
	}

	private check(id: string, label: string, ok: boolean, hint?: string): ComplianceCheck {
		return { id, label, ok, hint: ok ? undefined : hint };
	}

	private score(checks: ComplianceCheck[]): number {
		if (!checks.length) return 0;
		return Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
	}

	private digitsOnly(value?: string | null): string {
		return (value || '').replace(/\D/g, '');
	}

	isValidSiret(siret?: string | null): boolean {
		const d = this.digitsOnly(siret);
		return d.length === 14;
	}

	isValidSiren(siren?: string | null): boolean {
		const d = this.digitsOnly(siren);
		return d.length === 9;
	}

	siretToSiren(siret?: string | null): string | null {
		const d = this.digitsOnly(siret);
		return d.length >= 9 ? d.slice(0, 9) : null;
	}
}
