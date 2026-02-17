import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ListQueryDto } from '../common/dto/list-query.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('clients')
export class ClientsController {
	constructor(private readonly clients: ClientsService) {}

	@Post()
	create(@Body() data: CreateClientDto, @CurrentUser() user: any) {
		return this.clients.create(data, user.organizationId);
	}

	@Get()
	findAll(@Query() query: ListQueryDto, @CurrentUser() user: any) {
		return this.clients.findAll(query, user.organizationId);
	}

	@Get(':id')
	findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
		return this.clients.findOne(id, user.organizationId);
	}

	@Patch(':id')
	update(
		@Param('id', ParseIntPipe) id: number,
		@Body() data: UpdateClientDto,
		@CurrentUser() user: any
	) {
		return this.clients.update(id, data, user.organizationId);
	}

	@Delete(':id')
	remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
		return this.clients.remove(id, user.organizationId);
	}
}


