import { IsArray, IsBoolean, IsIn, IsISO8601, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { ListQueryDto } from '../../common/dto/list-query.dto';
import { DOCUMENT_FOLDERS, type DocumentFolder } from '../../common/document-folder.util';

export class PayableDebtListQueryDto extends ListQueryDto {
	@IsOptional()
	@IsIn(DOCUMENT_FOLDERS)
	folder?: DocumentFolder;

	@IsOptional()
	@Transform(({ value }) => value === true || value === 'true' || value === '1')
	@IsBoolean()
	includeFolderCounts?: boolean;
}

export class UpdatePayableDebtDocumentFlagsDto {
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
	tags?: string[];

	@IsOptional()
	@IsBoolean()
	markSeen?: boolean;
}
