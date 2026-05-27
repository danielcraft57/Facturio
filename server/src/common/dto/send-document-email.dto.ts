import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';

/** Options communes d’envoi facture / devis par email. */
export class SendDocumentEmailDto {
	@IsOptional()
	@IsEmail()
	email?: string;

	/** Alias frontend historique */
	@IsOptional()
	@IsEmail()
	to?: string;

	@IsOptional()
	@IsBoolean()
	updateClientEmail?: boolean;

	/** Envoyer une copie informative à l’utilisateur connecté (défaut : true si email connu). */
	@IsOptional()
	@IsBoolean()
	copyToSelf?: boolean;

	/** Autres destinataires (virgules, point-virgule ou retours ligne). */
	@IsOptional()
	@IsString()
	additionalRecipients?: string;
}
