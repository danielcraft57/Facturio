import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ListQueryDto } from '../common/dto/list-query.dto';

@Controller('clients')
export class ClientsController {
	constructor(private readonly clients: ClientsService) {}

	@Post()
	create(@Body() data: CreateClientDto) {
		return this.clients.create(data);
	}

	@Get()
	findAll(@Query() query: ListQueryDto) {
		return this.clients.findAll(query);
	}

	@Get(':id')
	findOne(@Param('id', ParseIntPipe) id: number) {
		return this.clients.findOne(id);
	}

	@Patch(':id')
	update(
		@Param('id', ParseIntPipe) id: number,
		@Body() data: UpdateClientDto
	) {
		return this.clients.update(id, data);
	}

	@Delete(':id')
	remove(@Param('id', ParseIntPipe) id: number) {
		return this.clients.remove(id);
	}
}


