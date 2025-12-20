import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { PacksService, CreatePackDto, UpdatePackDto } from './packs.service';
import { ListQueryDto } from '../common/dto/list-query.dto';

@Controller('packs')
export class PacksController {
	constructor(private readonly packs: PacksService) {}

	@Post()
	create(@Body() data: CreatePackDto) {
		return this.packs.create(data);
	}

	@Get()
	findAll(@Query() query: ListQueryDto) {
		return this.packs.findAll(query);
	}

	@Get(':id')
	findOne(@Param('id', ParseIntPipe) id: number) {
		return this.packs.findOne(id);
	}

	@Patch(':id')
	update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdatePackDto) {
		return this.packs.update(id, data);
	}

	@Delete(':id')
	remove(@Param('id', ParseIntPipe) id: number) {
		return this.packs.remove(id);
	}
}




