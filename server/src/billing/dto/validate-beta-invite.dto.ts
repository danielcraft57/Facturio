import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Paramètres de validation d'un code beta (endpoint public).
 */
export class ValidateBetaInviteDto {
	@IsString({ message: 'Code invalide' })
	@IsNotEmpty({ message: 'Code d\'invitation requis' })
	@MaxLength(64, { message: 'Code trop long' })
	@Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
	code!: string;
}
