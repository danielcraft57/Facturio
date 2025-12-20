import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ProspectsService, CreateProspectDto, UpdateProspectDto } from './prospects.service';
import { ListQueryDto } from '../common/dto/list-query.dto';

@Controller('prospects')
export class ProspectsController {
	constructor(private readonly prospects: ProspectsService) {}

	@Post()
	create(@Body() data: CreateProspectDto) {
		return this.prospects.create(data);
	}

	@Get()
	findAll(@Query() query: ListQueryDto) {
		return this.prospects.findAll(query);
	}

	@Get('metrics')
	getMetrics() {
		return this.prospects.getMetrics();
	}

	@Get(':id')
	findOne(@Param('id', ParseIntPipe) id: number) {
		return this.prospects.findOne(id);
	}

	@Patch(':id')
	update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateProspectDto) {
		return this.prospects.update(id, data);
	}

	@Delete(':id')
	remove(@Param('id', ParseIntPipe) id: number) {
		return this.prospects.remove(id);
	}
}




