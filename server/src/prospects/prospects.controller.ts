import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ProspectsService } from './prospects.service';
import { CreateProspectDto } from './dto/create-prospect.dto';
import { UpdateProspectDto } from './dto/update-prospect.dto';
import { ListQueryDto } from '../common/dto/list-query.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('prospects')
export class ProspectsController {
	constructor(private readonly prospects: ProspectsService) {}

	@Post()
	create(@Body() data: CreateProspectDto, @CurrentUser() user: any) {
		return this.prospects.create(data);
	}

	@Get()
	findAll(@Query() query: ListQueryDto, @CurrentUser() user: any) {
		return this.prospects.findAll(query);
	}

	@Get('metrics')
	getMetrics(@CurrentUser() user: any) {
		return this.prospects.getMetrics();
	}

	@Get(':id')
	findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
		return this.prospects.findOne(id);
	}

	@Patch(':id')
	update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateProspectDto, @CurrentUser() user: any) {
		return this.prospects.update(id, data);
	}

	@Delete(':id')
	remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
		return this.prospects.remove(id);
	}
}




