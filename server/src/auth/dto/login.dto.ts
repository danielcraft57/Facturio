import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO pour la connexion
 * 
 * Validation stricte avec sanitization pour prévenir XSS et injections.
 */
export class LoginDto {
	@IsEmail({}, { message: 'Email invalide' })
	@IsNotEmpty({ message: 'Email requis' })
	@MaxLength(255, { message: 'Email trop long' })
	@Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
	email!: string;

	@IsString({ message: 'Mot de passe invalide' })
	@IsNotEmpty({ message: 'Mot de passe requis' })
	@MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
	@MaxLength(128, { message: 'Mot de passe trop long' })
	@Matches(/^[\x20-\x7E]*$/, { message: 'Le mot de passe contient des caractères non autorisés' })
	password!: string;
}

