import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ListQueryDto } from '../../common/dto/list-query.dto';
import { CLIENT_FOLDERS, type ClientFolder } from '../client-folder.util';

export class ClientListQueryDto extends ListQueryDto {
	@IsOptional()
	@IsIn(CLIENT_FOLDERS)
	folder?: ClientFolder;

	@IsOptional()
	@IsString()
	status?: string;

	/** Inclut les compteurs sidebar dans la même réponse (évite un 2e HTTP). */
	@IsOptional()
	@Transform(({ value }) => value === true || value === 'true' || value === '1')
	@IsBoolean()
	includeFolderCounts?: boolean;
}
