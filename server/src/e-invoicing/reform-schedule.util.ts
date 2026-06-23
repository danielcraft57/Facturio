export type CompanySizeCategory = 'micro' | 'pme' | 'eti' | 'ge';

export type ReformObligationKind = 'reception' | 'emission' | 'ereporting';

export type ReformMilestone = {
	kind: ReformObligationKind;
	date: string;
	label: string;
	description: string;
	active: boolean;
};

export type ReformScheduleResult = {
	companySize: CompanySizeCategory;
	companySizeLabel: string;
	receptionDate: string;
	emissionDate: string;
	ereportingDate: string;
	milestones: ReformMilestone[];
	summary: string;
	recommendation: string;
};

const RECEPTION = '2026-09-01';
const EMISSION_ETI_GE = '2026-09-01';
const EMISSION_PME_MICRO = '2027-09-01';

const SIZE_LABELS: Record<CompanySizeCategory, string> = {
	micro: 'Micro-entreprise / auto-entrepreneur',
	pme: 'PME / TPE',
	eti: 'Entreprise de taille intermédiaire (ETI)',
	ge: 'Grande entreprise',
};

function parseSize(input?: string): CompanySizeCategory {
	const v = (input ?? 'micro').toLowerCase();
	if (v === 'pme' || v === 'tpe') return 'pme';
	if (v === 'eti') return 'eti';
	if (v === 'ge' || v === 'grande') return 'ge';
	return 'micro';
}

function emissionDateFor(size: CompanySizeCategory): string {
	return size === 'eti' || size === 'ge' ? EMISSION_ETI_GE : EMISSION_PME_MICRO;
}

/** Calendrier réglementaire simplifié (réforme FR facturation électronique B2B). */
export function computeReformSchedule(companySizeInput?: string): ReformScheduleResult {
	const companySize = parseSize(companySizeInput);
	const emissionDate = emissionDateFor(companySize);
	const today = new Date();
	const todayIso = today.toISOString().slice(0, 10);

	const milestone = (
		kind: ReformObligationKind,
		date: string,
		label: string,
		description: string,
	): ReformMilestone => ({
		kind,
		date,
		label,
		description,
		active: todayIso >= date,
	});

	const milestones: ReformMilestone[] = [
		milestone(
			'reception',
			RECEPTION,
			'Réception des factures électroniques',
			'Toutes les entreprises assujetties à la TVA en France doivent pouvoir recevoir des factures B2B via une Plateforme Agréée.',
		),
		milestone(
			'emission',
			emissionDate,
			'Émission des factures électroniques',
			companySize === 'eti' || companySize === 'ge'
				? 'Obligation d’émettre en format structuré requis par la réforme pour vos factures B2B.'
				: 'Obligation d’émettre pour les PME, TPE et micro-entreprises — vos clients ETI peuvent exiger du électronique plus tôt.',
		),
		milestone(
			'ereporting',
			emissionDate,
			'E-reporting',
			'Transmission des données de transactions et paiements (B2C, international, encaissements) selon le même calendrier que l’émission pour votre catégorie.',
		),
	];

	const summary =
		companySize === 'eti' || companySize === 'ge'
			? `En tant qu’${SIZE_LABELS[companySize]}, vous devez recevoir ET émettre des e-factures dès le 1er septembre 2026.`
			: `En tant que ${SIZE_LABELS[companySize]}, réception obligatoire au 1er septembre 2026 ; émission au 1er septembre 2027.`;

	const recommendation =
		todayIso < RECEPTION
			? 'Choisissez une PA et complétez votre profil émetteur (SIRET, SIREN clients B2B) avant septembre 2026.'
			: todayIso < emissionDate
				? 'Vous devez déjà recevoir des e-factures. Préparez l’émission et le palier Pro + e-facture PrestaFacture.'
				: 'Vérifiez que vos émissions B2B passent par une PA et que votre e-reporting est actif.';

	return {
		companySize,
		companySizeLabel: SIZE_LABELS[companySize],
		receptionDate: RECEPTION,
		emissionDate,
		ereportingDate: emissionDate,
		milestones,
		summary,
		recommendation,
	};
}
