import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

/**
 * DTO pour la mise à jour d'un produit
 * Tous les champs sont optionnels
 */
export class UpdateProductDto extends PartialType(CreateProductDto) {}

