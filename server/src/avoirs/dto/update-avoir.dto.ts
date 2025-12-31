import { PartialType } from '@nestjs/mapped-types';
import { CreateAvoirDto } from './create-avoir.dto';

export class UpdateAvoirDto extends PartialType(CreateAvoirDto) {}

