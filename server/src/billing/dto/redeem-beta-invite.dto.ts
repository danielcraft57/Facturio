import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Corps de requête pour activer un code beta testeur.
 */
export class RedeemBetaInviteDto {
	@IsString({ message: 'Code invalide' })
	@IsNotEmpty({ message: 'Code d\'invitation requis' })
	@MaxLength(64, { message: 'Code trop long' })
	@Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
	code!: string;
}
