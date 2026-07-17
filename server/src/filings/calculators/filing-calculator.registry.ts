import { BadRequestException, Injectable } from '@nestjs/common';
import type { FilingCalculator } from './filing-calculator';
import { VatFilingCalculator } from './vat-filing.calculator';
import { IsFilingCalculator } from './is-filing.calculator';
import { CfeFilingCalculator } from './cfe-filing.calculator';

/**
 * Registre des calculateurs de déclaration.
 * Ajouter un type = enregistrer un FilingCalculator ici.
 */
@Injectable()
export class FilingCalculatorRegistry {
	private readonly byType = new Map<string, FilingCalculator>();

	constructor(
		vat: VatFilingCalculator,
		isCalc: IsFilingCalculator,
		cfe: CfeFilingCalculator,
	) {
		for (const calc of [vat, isCalc, cfe]) {
			for (const type of calc.supportedTypes) {
				this.byType.set(type, calc);
			}
		}
	}

	/**
	 * Retourne le calculateur pour un type de déclaration.
	 * @param type - FilingType
	 * @throws BadRequestException si non supporté (ex. URSSAF via module dédié)
	 */
	get(type: string): FilingCalculator {
		const calc = this.byType.get(type);
		if (!calc) {
			throw new BadRequestException(
				`Calcul automatique non disponible pour le type ${type}. Utilisez le module URSSAF pour les cotisations.`,
			);
		}
		return calc;
	}

	/**
	 * Types calculables via ce registre.
	 */
	supportedTypes(): string[] {
		return [...this.byType.keys()];
	}
}
