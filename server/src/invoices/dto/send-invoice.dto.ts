import { IsBoolean, IsEmail, IsOptional } from 'class-validator';

export class SendInvoiceDto {
	@IsOptional()
	@IsEmail()
	email?: string;

	/** Met à jour l’email du client en base si un email est fourni (défaut : true). */
	@IsOptional()
	@IsBoolean()
	updateClientEmail?: boolean;
}
