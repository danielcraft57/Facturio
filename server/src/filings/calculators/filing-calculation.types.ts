/**
 * Types partagés pour le calcul des déclarations fiscales.
 * Un calculateur = un type de déclaration (TVA, IS, CFE…).
 */

export type FilingLineDraft = {
	taxRate: number;
	taxableBase: number;
	taxAmount: number;
};

/**
 * Résultat normalisé d'un calculateur de déclaration.
 */
export type FilingCalculationResult = {
	/** Montant dû à l'autorité */
	amountDue: number;
	/** Lignes de détail (tranches, collectée/déductible…) */
	lines: FilingLineDraft[];
	/** Notes affichables sur la déclaration */
	notes: string;
	/** Snapshot JSON pour audit / UI */
	snapshot: Record<string, unknown>;
};

/**
 * Options optionnelles passées au calcul (surcharge des prefs org).
 */
export type FilingCalculateOptions = {
	isPME?: boolean;
	capitalHeldByIndividuals?: number;
	propertyValue?: number;
	communalRate?: number;
	activity?: 'SERVICE' | 'COMMERCE' | 'INDUSTRIE' | 'ARTISANAT';
	isFirstYear?: boolean;
	revenue?: number;
	expenses?: number;
	amortizations?: number;
	fiscalDeductions?: number;
	fiscalReintegrations?: number;
	lossCarryForward?: number;
};

/**
 * Contexte fourni à chaque calculateur.
 */
export type FilingCalculatorContext = {
	filingId: number;
	organizationId: number;
	type: string;
	periodStart: Date;
	periodEnd: Date;
	options?: FilingCalculateOptions;
};
