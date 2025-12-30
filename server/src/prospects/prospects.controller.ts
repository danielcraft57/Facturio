import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ProspectsService } from './prospects.service';
import { CreateProspectDto } from './dto/create-prospect.dto';
import { UpdateProspectDto } from './dto/update-prospect.dto';
import { ListQueryDto } from '../common/dto/list-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('prospects')
@UseGuards(JwtAuthGuard)
export class ProspectsController {
	constructor(private readonly prospects: ProspectsService) {}

	@Post()
	create(@Body() data: CreateProspectDto, @CurrentUser() user: any) {
		return this.prospects.create(data, user.organizationId);
	}

	@Get()
	findAll(@Query() query: ListQueryDto, @CurrentUser() user: any) {
		return this.prospects.findAll(query, user.organizationId);
	}

	@Get('metrics')
	getMetrics(@CurrentUser() user: any) {
		return this.prospects.getMetrics(user.organizationId);
	}

	@Get(':id')
	findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
		return this.prospects.findOne(id, user.organizationId);
	}

	@Patch(':id')
	update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateProspectDto, @CurrentUser() user: any) {
		return this.prospects.update(id, data, user.organizationId);
	}

	@Delete(':id')
	remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
		return this.prospects.remove(id, user.organizationId);
	}
}




