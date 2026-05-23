import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common'
import { isEntityId } from '../entity-id'

@Injectable()
export class ParseEntityIdPipe implements PipeTransform<string, string> {
	transform(value: string): string {
		if (!isEntityId(value)) {
			throw new BadRequestException('Identifiant invalide')
		}
		return value
	}
}
