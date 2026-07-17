import type {
	FilingCalculationResult,
	FilingCalculatorContext,
} from './filing-calculation.types';

/**
 * Contrat d'un calculateur de déclaration fiscale.
 * Chaque type (VAT_CA3, IS, CFE…) implémente cette interface.
 */
export interface FilingCalculator {
	/** Types de FilingType supportés par ce calculateur */
	readonly supportedTypes: readonly string[];

	/**
	 * Calcule le montant dû et le détail pour une déclaration.
	 * @param ctx - Contexte (filing, org, période, options)
	 */
	calculate(ctx: FilingCalculatorContext): Promise<FilingCalculationResult>;
}
