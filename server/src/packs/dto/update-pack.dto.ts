import { PartialType } from '@nestjs/mapped-types';
import { CreatePackDto } from './create-pack.dto';

/**
 * DTO pour la mise à jour d'un pack
 * Tous les champs sont optionnels
 */
export class UpdatePackDto extends PartialType(CreatePackDto) {}

