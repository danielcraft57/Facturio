import { BadRequestException, Injectable, Logger } from '@nestjs/common';

const API_BASE = 'https://recherche-entreprises.api.gouv.fr/search';

export type SireneLookupResult = {
	siren: string;
	siret: string | null;
	legalName: string | null;
	name: string | null;
	legalForm: string | null;
	apeCode: string | null;
	address: string | null;
	zipCode: string | null;
	city: string | null;
	country: string;
	rcsCity: string | null;
	companyStatus: 'AUTO_ENTREPRENEUR' | 'MICRO_ENTERPRISE' | null;
	source: 'recherche-entreprises.api.gouv.fr';
	partial: boolean;
};

const NATURE_JURIDIQUE_LABELS: Record<string, string> = {
	'1000': 'Entrepreneur individuel',
	'5499': 'SARL',
	'5710': 'SAS',
	'5720': 'SASU',
	'6540': 'SCI',
};

function digitsOnly(value: string): string {
	return value.replace(/\D/g, '');
}

function usable(value: unknown): string | null {
	if (value == null) return null;
	const s = String(value).trim();
	if (!s || s === '[NON-DIFFUSIBLE]' || s.includes('[NON-DIFFUSIBLE]')) return null;
	return s;
}

function titleCase(value: string): string {
	return value
		.split(/\s+/)
		.filter(Boolean)
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
		.join(' ');
}

function buildAddress(siege: Record<string, unknown>): string | null {
	const numero = usable(siege.numero_voie);
	const typeVoie = usable(siege.type_voie);
	const libelleVoie = usable(siege.libelle_voie);
	const complement = usable(siege.complement_adresse);
	const geo = usable(siege.geo_adresse);

	if (geo) return geo;

	const parts = [
		[numero, typeVoie, libelleVoie].filter(Boolean).join(' ').trim(),
		complement,
	].filter(Boolean);
	return parts.length ? parts.join(', ') : null;
}

function passesLuhn(digits: string): boolean {
	if (!/^\d+$/.test(digits)) return false;
	let sum = 0;
	let alt = false;
	for (let i = digits.length - 1; i >= 0; i--) {
		let n = Number(digits[i]);
		if (alt) {
			n *= 2;
			if (n > 9) n -= 9;
		}
		sum += n;
		alt = !alt;
	}
	return sum % 10 === 0;
}

@Injectable()
export class SireneLookupService {
	private readonly logger = new Logger(SireneLookupService.name);

	async lookup(siretOrSiren: string): Promise<SireneLookupResult> {
		const digits = digitsOnly(siretOrSiren);
		if (digits.length !== 9 && digits.length !== 14) {
			throw new BadRequestException('Saisissez un SIREN (9 chiffres) ou un SIRET (14 chiffres) valide');
		}
		if (digits.length === 9 && !passesLuhn(digits)) {
			throw new BadRequestException('SIREN invalide');
		}
		if (digits.length === 14 && !passesLuhn(digits)) {
			throw new BadRequestException('SIRET invalide');
		}

		const query = digits.length === 14 ? digits : digits.slice(0, 9);
		const url = `${API_BASE}?q=${encodeURIComponent(query)}&per_page=1&limite_matching_etablissements=20`;

		let json: { results?: Record<string, unknown>[] };
		try {
			const res = await fetch(url, {
				headers: { Accept: 'application/json' },
				signal: AbortSignal.timeout(12_000),
			});
			if (!res.ok) {
				this.logger.warn(`API entreprises HTTP ${res.status}`);
				throw new BadRequestException('Registre des entreprises indisponible');
			}
			json = (await res.json()) as { results?: Record<string, unknown>[] };
		} catch (err) {
			if (err instanceof BadRequestException) throw err;
			this.logger.warn(`API entreprises: ${(err as Error).message}`);
			throw new BadRequestException('Impossible de joindre le registre des entreprises');
		}

		const row = json.results?.[0];
		if (!row) {
			throw new BadRequestException('Aucune entreprise trouvée pour ce numéro');
		}

		const siren = usable(row.siren) ?? digits.slice(0, 9);
		const siege = (row.siege as Record<string, unknown>) ?? {};

		let matchedSiret = digits.length === 14 ? digits : usable(siege.siret);
		const matching = (row.matching_etablissements as Record<string, unknown>[]) ?? [];
		if (digits.length === 14) {
			const hit = matching.find((e) => usable(e.siret) === digits);
			if (hit) {
				matchedSiret = digits;
				Object.assign(siege, hit);
			}
		}

		const complements = (row.complements as Record<string, unknown>) ?? {};
		const nature = usable(row.nature_juridique);
		let legalForm =
			(nature && NATURE_JURIDIQUE_LABELS[nature]) ||
			(complements.est_entrepreneur_individuel === true ? 'Entrepreneur individuel' : null);

		const nomRaison = usable(row.nom_raison_sociale) ?? usable(row.nom_complet);
		const nomCommercial =
			usable(siege.nom_commercial) ??
			(Array.isArray(siege.liste_enseignes)
				? usable((siege.liste_enseignes as unknown[]).find((e) => usable(e)))
				: null);

		const city = usable(siege.libelle_commune);
		const zipCode = usable(siege.code_postal);
		const address = buildAddress(siege);

		let companyStatus: SireneLookupResult['companyStatus'] = null;
		if (complements.est_entrepreneur_individuel === true) {
			companyStatus = 'AUTO_ENTREPRENEUR';
		}

		const partial =
			!nomRaison ||
			!address ||
			row.statut_diffusion === 'P' ||
			siege.statut_diffusion_etablissement === 'P';

		return {
			siren,
			siret: matchedSiret,
			legalName: nomRaison ? titleCase(nomRaison) : null,
			name: nomCommercial ? titleCase(nomCommercial) : null,
			legalForm,
			apeCode: usable(siege.activite_principale) ?? usable(row.activite_principale),
			address,
			zipCode,
			city: city ? titleCase(city) : null,
			country: 'FR',
			rcsCity: city ? titleCase(city) : null,
			companyStatus,
			source: 'recherche-entreprises.api.gouv.fr',
			partial,
		};
	}
}
