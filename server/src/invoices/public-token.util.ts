import { BadRequestException } from '@nestjs/common';

/** Token public : 48 à 64 caractères hexadécimaux (randomBytes 24–32). */
const PUBLIC_TOKEN_PATTERN = /^[a-f0-9]{48,64}$/i;

export function assertValidPublicToken(token: string | undefined): string {
	if (!token || typeof token !== 'string') {
		throw new BadRequestException('Lien invalide');
	}
	const normalized = token.trim();
	if (!PUBLIC_TOKEN_PATTERN.test(normalized)) {
		throw new BadRequestException('Lien invalide');
	}
	return normalized;
}
