import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ParseEntityIdPipe } from '../common/pipes/parse-entity-id.pipe';
import { ClientsService } from './clients.service';
import { ClientsFinanceService } from './clients-finance.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientListQueryDto } from './dto/client-list-query.dto';
import { ClientFinanceQueryDto } from './dto/client-finance-query.dto';
import { CreateClientMiscOperationDto } from './dto/create-client-misc-operation.dto';
import { CreateClientCreditDto } from './dto/create-client-credit.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('clients')
export class ClientsController {
	constructor(
		private readonly clients: ClientsService,
		private readonly clientFinance: ClientsFinanceService,
	) {}

	@Post()
	create(@Body() data: CreateClientDto, @CurrentUser() user: any) {
		return this.clients.create(data, user.organizationId);
	}

	@Get()
	findAll(@Query() query: ClientListQueryDto, @CurrentUser() user: any) {
		return this.clients.findAll(query, user.organizationId);
	}

	@Get('folder-counts')
	getFolderCounts(@CurrentUser() user: any) {
		return this.clients.getFolderCounts(user.organizationId);
	}

	@Get(':id/finance')
	getFinance(
		@Param('id', ParseEntityIdPipe) id: string,
		@Query() query: ClientFinanceQueryDto,
		@CurrentUser() user: any,
	) {
		return this.clientFinance.getFinance(id, user.organizationId, query);
	}

	@Post(':id/misc-operations')
	createMiscOperation(
		@Param('id', ParseEntityIdPipe) id: string,
		@Body() body: CreateClientMiscOperationDto,
		@CurrentUser() user: any,
	) {
		return this.clientFinance.createMiscOperation(id, body, user.organizationId);
	}

	@Post(':id/credits')
	createCredit(
		@Param('id', ParseEntityIdPipe) id: string,
		@Body() body: CreateClientCreditDto,
		@CurrentUser() user: any,
	) {
		return this.clientFinance.createClientCredit(id, body, user.organizationId);
	}

	@Get(':id')
	findOne(@Param('id', ParseEntityIdPipe) id: string, @CurrentUser() user: any) {
		return this.clients.findOne(id, user.organizationId);
	}

	@Patch(':id')
	update(
		@Param('id', ParseEntityIdPipe) id: string,
		@Body() data: UpdateClientDto,
		@CurrentUser() user: any
	) {
		return this.clients.update(id, data, user.organizationId);
	}

	@Delete(':id')
	remove(@Param('id', ParseEntityIdPipe) id: string, @CurrentUser() user: any) {
		return this.clients.remove(id, user.organizationId);
	}
}


