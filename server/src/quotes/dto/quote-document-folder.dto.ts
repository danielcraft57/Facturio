import { IsArray, IsBoolean, IsIn, IsOptional, IsString, IsISO8601 } from 'class-validator';
import { ListQueryDto } from '../../common/dto/list-query.dto';
import type { DocumentFolder } from '../../common/document-folder.util';

export class QuoteListQueryDto extends ListQueryDto {
	@IsOptional()
	@IsIn(['inbox', 'nouveau', 'suivi', 'attente', 'important', 'envoyes', 'brouillons'])
	folder?: DocumentFolder;

	@IsOptional()
	@IsString()
	tag?: string;
}

export class UpdateQuoteDocumentFlagsDto {
	@IsOptional()
	@IsBoolean()
	starred?: boolean;

	@IsOptional()
	@IsBoolean()
	important?: boolean;

	@IsOptional()
	@IsISO8601()
	snoozedUntil?: string | null;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	tags?: string[];

	@IsOptional()
	@IsBoolean()
	markSeen?: boolean;
}
