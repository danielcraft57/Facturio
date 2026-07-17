import { PartialType } from '@nestjs/mapped-types';
import { CreateSupplierDto } from './create-supplier.dto';

/**
 * DTO de mise à jour d'un fournisseur (tous champs optionnels).
 */
export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {}
