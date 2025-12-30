import { PartialType } from '@nestjs/mapped-types';
import { CreateProspectDto } from './create-prospect.dto';
import { IsDateString, IsOptional, IsString } from 'class-validator';

/**
 * DTO pour la mise à jour d'un prospect
 * Tous les champs sont optionnels, avec des champs supplémentaires pour les dates
 */
export class UpdateProspectDto extends PartialType(CreateProspectDto) {
	@IsOptional()
	@IsString()
	status?: string;

	@IsOptional()
	@IsDateString()
	lastContact?: string | Date;

	@IsOptional()
	@IsDateString()
	nextFollowUp?: string | Date;
}

