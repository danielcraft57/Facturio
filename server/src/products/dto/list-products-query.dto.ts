import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { ProductKind } from '@prisma/client';
import { ListQueryDto } from '../../common/dto/list-query.dto';

export class ListProductsQueryDto extends ListQueryDto {
	@IsOptional()
	@IsEnum(ProductKind)
	kind?: ProductKind;

	@IsOptional()
	@IsString()
	purpose?: string;

	@IsOptional()
	@IsString()
	category?: string;

	@IsOptional()
	@IsString()
	language?: string;

	@IsOptional()
	@IsIn(['icon', 'library', 'custom'])
	visualType?: 'icon' | 'library' | 'custom';

	/** Filtre catalogue personnalisé : organization | client */
	@IsOptional()
	@IsIn(['organization', 'client'])
	scope?: 'organization' | 'client';

	/** Requis si scope=client */
	@IsOptional()
	@IsString()
	clientId?: string;
}
