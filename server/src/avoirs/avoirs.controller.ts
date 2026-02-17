import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { AvoirsService } from './avoirs.service';
import { CreateAvoirDto } from './dto/create-avoir.dto';
import { UpdateAvoirDto } from './dto/update-avoir.dto';
import { ApplyAvoirDto } from './dto/apply-avoir.dto';
import { ListQueryDto } from '../common/dto/list-query.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('avoirs')
export class AvoirsController {
	constructor(private readonly avoirs: AvoirsService) {}

	@Post()
	create(@Body() data: CreateAvoirDto, @CurrentUser() user: any) {
		return this.avoirs.create(data);
	}

	@Get()
	findAll(@Query() query: ListQueryDto, @CurrentUser() user: any) {
		return this.avoirs.findAll(query);
	}

	@Get(':id')
	findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
		return this.avoirs.findOne(id);
	}

	@Patch(':id')
	update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateAvoirDto, @CurrentUser() user: any) {
		return this.avoirs.update(id, data);
	}

	@Delete(':id')
	remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
		return this.avoirs.remove(id);
	}

	@Post(':id/apply')
	@HttpCode(200)
	apply(@Param('id', ParseIntPipe) id: number, @Body() data: ApplyAvoirDto, @CurrentUser() user: any) {
		return this.avoirs.apply(id, data);
	}
}

