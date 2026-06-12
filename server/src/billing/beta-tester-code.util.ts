import { BadRequestException } from '@nestjs/common';

/** Longueur minimale d'un code beta (réseaux sociaux). */
export const BETA_CODE_MIN_LENGTH_DEFAULT = 3;

/** Longueur maximale d'un code beta (< 7 caractères). */
export const BETA_CODE_MAX_LENGTH_DEFAULT = 6;

/**
 * Normalise un code saisi (majuscules, alphanumérique uniquement).
 *
 * @param raw - Code brut
 * @returns Code normalisé
 */
export function normalizeBetaCode(raw: string): string {
	return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Valide le format d'un code beta.
 *
 * @param code - Code déjà normalisé
 * @param minLength - Longueur minimale
 * @param maxLength - Longueur maximale
 * @throws {BadRequestException} Si le format est invalide
 */
export function assertBetaCodeFormat(
	code: string,
	minLength: number,
	maxLength: number,
): void {
	if (!code) {
		throw new BadRequestException('Code d\'invitation requis.');
	}
	if (code.length < minLength || code.length > maxLength) {
		throw new BadRequestException(
			`Le code doit contenir entre ${minLength} et ${maxLength} caractères (lettres et chiffres).`,
		);
	}
	if (!/^[A-Z0-9]+$/.test(code)) {
		throw new BadRequestException('Le code ne peut contenir que des lettres et des chiffres.');
	}
}

/**
 * Vérifie le format sans lever d'exception (validation publique).
 */
export function isBetaCodeFormatValid(
	code: string,
	minLength: number,
	maxLength: number,
): boolean {
	if (!code || code.length < minLength || code.length > maxLength) return false;
	return /^[A-Z0-9]+$/.test(code);
}
