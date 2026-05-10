import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ConfigService } from '../config/config.service';
import { PrismaService } from '../prisma/prisma.service';

const PROSPECTLAB_TOKENS_URL = 'https://prospectlab.danielcraft.fr/tokens';
const PROSPECTLAB_PUBLIC_API_BASE = '/api/public';

/**
 * Réponse typée possible de l'API ProspectLab (entreprises).
 * On accepte plusieurs formats pour rester compatible.
 */
interface ProspectLabCompany {
	id?: number | string;
	nom?: string;
	raison_sociale?: string;
	name?: string;
	companyName?: string;
	industry?: string;
	secteur?: string;
	statut?: string;
	website?: string;
	email?: string;
	phone?: string;
	address?: string;
	city?: string;
	country?: string;
	description?: string;
	createdAt?: string;
	updatedAt?: string;
	/** Champs fréquents côté ProspectLab / APIs françaises */
	courriel?: string;
	telephone?: string;
	tel?: string;
	contact_email?: string;
	contact_principal?: Record<string, unknown>;
	decision_maker?: Record<string, unknown>;
	contacts?: unknown[];
	emails?: unknown[];
	[key: string]: unknown;
}

@Injectable()
export class ProspectionService {
	constructor(
		private readonly config: ConfigService,
		private readonly prisma: PrismaService
	) {}

	getTokensUrl(): string {
		return PROSPECTLAB_TOKENS_URL;
	}

	private async getOrganizationProspectLabConfig(organizationId: number): Promise<{ apiUrl?: string; apiKey?: string }> {
		// Identifiants entre guillemets : obligatoire sur PostgreSQL avec les tables Prisma ("Organization", camelCase colonnes).
		const rows = await this.prisma.$queryRaw<{ prospectLabApiUrl: string | null; prospectLabApiKey: string | null }[]>(
			Prisma.sql`SELECT "prospectLabApiUrl", "prospectLabApiKey" FROM "Organization" WHERE id = ${organizationId} LIMIT 1`
		);
		const row = rows?.[0];
		return {
			apiUrl: row?.prospectLabApiUrl ?? undefined,
			apiKey: row?.prospectLabApiKey ?? undefined
		};
	}

	async getConfig(organizationId: number) {
		const org = await this.getOrganizationProspectLabConfig(organizationId);
		const apiUrl = (org.apiUrl || this.config.prospectLabApiUrl || 'https://prospectlab.danielcraft.fr').replace(/\/$/, '');
		const hasToken = !!(org.apiKey && org.apiKey.trim().length > 0);
		// Back-up env (compat)
		const envHasToken = this.config.prospectLabConfigured;
		return {
			configured: hasToken || envHasToken,
			hasToken,
			apiUrl,
			tokensUrl: this.getTokensUrl()
		};
	}

	async updateConfig(
		organizationId: number,
		payload: { apiUrl?: string; apiKey?: string }
	) {
		if (payload.apiUrl !== undefined) {
			const v = payload.apiUrl?.trim();
			const url = v ? v.replace(/\/$/, '') : null;
			await this.prisma.$executeRaw(
				Prisma.sql`UPDATE "Organization" SET "prospectLabApiUrl" = ${url} WHERE id = ${organizationId}`
			);
		}
		if (payload.apiKey !== undefined) {
			const v = payload.apiKey?.trim();
			const key = v && v.length > 0 ? v : null;
			await this.prisma.$executeRaw(
				Prisma.sql`UPDATE "Organization" SET "prospectLabApiKey" = ${key} WHERE id = ${organizationId}`
			);
		}

		return this.getConfig(organizationId);
	}

	async isConfigured(organizationId: number): Promise<boolean> {
		const cfg = await this.getConfig(organizationId);
		return cfg.configured;
	}

	private async request<T>(
		endpointPath: string,
		query?: Record<string, string | number | undefined>,
		organizationId?: number
	): Promise<T> {
		let apiUrl = this.config.prospectLabApiUrl;
		let apiKey = this.config.prospectLabApiKey;

		if (organizationId) {
			const org = await this.getOrganizationProspectLabConfig(organizationId);
			if (org.apiUrl) apiUrl = org.apiUrl;
			if (org.apiKey) apiKey = org.apiKey;
		}

		if (!apiKey || !apiKey.trim()) {
			throw new UnauthorizedException(
				'ProspectLab non configuré. Ajoutez un token (voir ' + PROSPECTLAB_TOKENS_URL + ') dans la page Prospection.'
			);
		}

		const baseUrl = (apiUrl || 'https://prospectlab.danielcraft.fr').replace(/\/$/, '');
		const url = new URL(baseUrl + endpointPath);

		if (query) {
			for (const [k, v] of Object.entries(query)) {
				if (v === undefined || v === null || v === '') continue;
				url.searchParams.set(k, String(v));
			}
		}

		const res = await fetch(url.toString(), {
			headers: {
				Accept: 'application/json',
				Authorization: `Bearer ${apiKey}`
			}
		});

		if (!res.ok) {
			if (res.status === 401) {
				throw new UnauthorizedException(
					'Clé API ProspectLab invalide ou expirée. Générez un nouveau token sur ' + PROSPECTLAB_TOKENS_URL
				);
			}
			const text = await res.text().catch(() => '');
			throw new Error(`ProspectLab: ${res.status} ${res.statusText}${text ? ` - ${text}` : ''}`);
		}

		return (await res.json()) as T;
	}

	// ==========================
	// API publique ProspectLab
	// ==========================

	async listEntreprises(params: {
		limit?: number;
		offset?: number;
		secteur?: string;
		statut?: string;
		search?: string;
	}, organizationId?: number): Promise<{ data: ProspectLabCompany[]; total?: number; limit?: number; offset?: number } | ProspectLabCompany[]> {
		return this.request(`${PROSPECTLAB_PUBLIC_API_BASE}/entreprises`, params, organizationId);
	}

	async getEntreprise(id: string, organizationId?: number): Promise<ProspectLabCompany> {
		return this.request(`${PROSPECTLAB_PUBLIC_API_BASE}/entreprises/${encodeURIComponent(id)}`, undefined, organizationId);
	}

	async getEntrepriseEmails(id: string, organizationId?: number): Promise<any> {
		return this.request(`${PROSPECTLAB_PUBLIC_API_BASE}/entreprises/${encodeURIComponent(id)}/emails`, undefined, organizationId);
	}

	async listEmails(params: { limit?: number; offset?: number; entreprise_id?: number | string }, organizationId?: number): Promise<any> {
		return this.request(`${PROSPECTLAB_PUBLIC_API_BASE}/emails`, params as any, organizationId);
	}

	async getStatistics(organizationId?: number): Promise<any> {
		return this.request(`${PROSPECTLAB_PUBLIC_API_BASE}/statistics`, undefined, organizationId);
	}

	async listCampagnes(params: { limit?: number; offset?: number; statut?: string }, organizationId?: number): Promise<any> {
		return this.request(`${PROSPECTLAB_PUBLIC_API_BASE}/campagnes`, params, organizationId);
	}

	async getCampagne(id: string, organizationId?: number): Promise<any> {
		return this.request(`${PROSPECTLAB_PUBLIC_API_BASE}/campagnes/${encodeURIComponent(id)}`, undefined, organizationId);
	}

	async getCampagneEmails(id: string, params: { limit?: number; offset?: number; statut?: string }, organizationId?: number): Promise<any> {
		return this.request(`${PROSPECTLAB_PUBLIC_API_BASE}/campagnes/${encodeURIComponent(id)}/emails`, params, organizationId);
	}

	async getCampagneStatistics(id: string, organizationId?: number): Promise<any> {
		return this.request(`${PROSPECTLAB_PUBLIC_API_BASE}/campagnes/${encodeURIComponent(id)}/statistics`, undefined, organizationId);
	}

	/**
	 * Récupère les prospects depuis l'API ProspectLab (entreprises).
	 * Retourne un format compatible avec le frontend Facturio (Prospect[]).
	 */
	async getProspects(
		page = 1,
		pageSize = 20,
		search?: string,
		secteur?: string,
		statut?: string,
		organizationId?: number
	): Promise<{
		data: any[];
		total: number;
		page: number;
		pageSize: number;
		source: 'prospectlab';
	}> {
		const limit = pageSize;
		const offset = (page - 1) * pageSize;

		const json = await this.listEntreprises({ limit, offset, search, secteur, statut }, organizationId);
		const rawList = Array.isArray(json) ? json : (json as any)?.data ?? (json as any)?.entreprises ?? [];
		const total =
			typeof (json as any)?.total === 'number'
				? (json as any).total
				: typeof (json as any)?.count === 'number'
					? (json as any).count
					: Array.isArray(rawList)
						? rawList.length
						: 0;

		const data = (Array.isArray(rawList) ? rawList : []).map((c: ProspectLabCompany) => this.mapToProspect(c));
		return { data, total, page, pageSize, source: 'prospectlab' };
	}

	private pickFirstEmailFromList(list: unknown[]): string | undefined {
		for (const item of list) {
			if (!item || typeof item !== 'object') continue;
			const o = item as Record<string, unknown>;
			const e = o.email ?? o.courriel ?? o.adresse_email ?? o.mail;
			if (typeof e === 'string' && e.includes('@')) return e.trim();
		}
		return undefined;
	}

	private pickCompanyEmail(c: ProspectLabCompany): string | undefined {
		const direct = [c.email, c.courriel, c.contact_email]
			.find((v) => typeof v === 'string' && (v as string).includes('@')) as string | undefined;
		if (direct) return direct.trim();

		const lists = [c.contacts, c.emails].filter(Array.isArray) as unknown[][];
		for (const list of lists) {
			const found = this.pickFirstEmailFromList(list);
			if (found) return found;
		}
		return undefined;
	}

	private pickCompanyPhone(c: ProspectLabCompany): string | undefined {
		const p = c.phone ?? c.telephone ?? c.tel;
		return typeof p === 'string' && p.trim() ? p.trim() : undefined;
	}

	private pickDecisionMaker(c: ProspectLabCompany): {
		name: string;
		position: string;
		email?: string;
		phone?: string;
		linkedin?: string;
		isDecisionMaker: true;
	} | undefined {
		const raw = (c.contact_principal ?? c.decision_maker) as Record<string, unknown> | undefined;
		if (raw && typeof raw === 'object') {
			const nom = [raw.prenom, raw.nom].filter((x) => typeof x === 'string').join(' ').trim();
			const name =
				(typeof raw.name === 'string' && raw.name) ||
				(typeof raw.nom_complet === 'string' && raw.nom_complet) ||
				nom ||
				(typeof raw.email === 'string' ? raw.email.split('@')[0] : '');
			const email =
				typeof raw.email === 'string'
					? raw.email
					: typeof raw.courriel === 'string'
						? raw.courriel
						: undefined;
			const phone = typeof raw.phone === 'string' ? raw.phone : typeof raw.telephone === 'string' ? raw.telephone : undefined;
			const position = typeof raw.poste === 'string' ? raw.poste : typeof raw.fonction === 'string' ? raw.fonction : '';
			const linkedin =
				typeof raw.linkedin === 'string'
					? raw.linkedin
					: typeof raw.linkedin_url === 'string'
						? raw.linkedin_url
						: undefined;
			if (name || email) {
				return {
					name: name || 'Contact',
					position: position || '',
					email,
					phone,
					linkedin,
					isDecisionMaker: true
				};
			}
		}

		const contacts = Array.isArray(c.contacts) ? c.contacts : [];
		const first = contacts.find((x) => x && typeof x === 'object') as Record<string, unknown> | undefined;
		if (first) {
			const nom = [first.prenom, first.nom].filter((x) => typeof x === 'string').join(' ').trim();
			const name =
				(typeof first.name === 'string' && first.name) ||
				nom ||
				(typeof first.email === 'string' ? String(first.email).split('@')[0] : '');
			const email =
				typeof first.email === 'string'
					? first.email
					: typeof first.courriel === 'string'
						? first.courriel
						: undefined;
			if (name || email) {
				return {
					name: name || 'Contact',
					position:
						(typeof first.poste === 'string' && first.poste) ||
						(typeof first.fonction === 'string' && first.fonction) ||
						'',
					email,
					phone:
						typeof first.phone === 'string'
							? first.phone
							: typeof first.telephone === 'string'
								? first.telephone
								: undefined,
					isDecisionMaker: true
				};
			}
		}

		return undefined;
	}

	private mapToProspect(c: ProspectLabCompany): any {
		const name = c.companyName ?? c.name ?? c.nom ?? c.raison_sociale ?? 'Sans nom';
		const id = c.id != null ? String(c.id) : `pl-${Math.random().toString(36).slice(2, 11)}`;
		const email = this.pickCompanyEmail(c);
		const phone = this.pickCompanyPhone(c);
		const decisionMaker = this.pickDecisionMaker(c);
		return {
			id,
			companyName: name,
			industry: c.industry ?? c.secteur ?? '',
			size: 'medium',
			website: c.website,
			email: email ?? decisionMaker?.email,
			phone: phone ?? decisionMaker?.phone,
			address: c.address,
			city: c.city,
			country: c.country ?? 'France',
			description: c.description,
			decisionMaker,
			status: (c.statut as any) ?? 'new',
			source: { id: 'prospectlab', name: 'ProspectLab', type: 'direct' },
			score: 50,
			priority: 'medium',
			notes: [],
			tags: [],
			createdAt: c.createdAt ?? new Date().toISOString(),
			updatedAt: c.updatedAt ?? new Date().toISOString()
		};
	}
}
