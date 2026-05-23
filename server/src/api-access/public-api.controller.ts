import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerGuard, RequireApiScopes } from './guards/api-bearer.guard';
import { ApiOrganizationId } from './decorators/api-org.decorator';
import { ClientsService } from '../clients/clients.service';
import { ProductsService } from '../products/products.service';
import { InvoicesService } from '../invoices/invoices.service';
import { QuotesService, UpdateQuoteDto } from '../quotes/quotes.service';
import { CreateClientDto } from '../clients/dto/create-client.dto';
import { UpdateClientDto } from '../clients/dto/update-client.dto';
import { CreateProductDto } from '../products/dto/create-product.dto';
import { UpdateProductDto } from '../products/dto/update-product.dto';
import { CreateInvoiceDto } from '../invoices/dto/create-invoice.dto';
import { UpdateInvoiceDto } from '../invoices/dto/update-invoice.dto';
import { CreateQuoteDto } from '../quotes/quotes.service';
import { ListQueryDto } from '../common/dto/list-query.dto';
import { ListProductsQueryDto } from '../products/dto/list-products-query.dto';
import { PublicApiDispatchService } from './public-api-dispatch.service';
import { ParseEntityIdPipe } from '../common/pipes/parse-entity-id.pipe';
import { ParseIntPipe } from '@nestjs/common';
import { SendPublicInvoiceDto } from './dto/send-public-invoice.dto';

/**
 * API REST publique Facturio (Bearer token).
 * Chemins en français pour éviter le conflit avec public/invoices/:token (pages client).
 */
@Controller('public')
@UseGuards(ApiBearerGuard)
export class PublicApiController {
	constructor(
		private readonly clients: ClientsService,
		private readonly products: ProductsService,
		private readonly invoices: InvoicesService,
		private readonly quotes: QuotesService,
		private readonly dispatch: PublicApiDispatchService,
	) {}

	@Get()
	info() {
		return {
			name: 'Facturio API publique',
			version: '1',
			resources: ['clients', 'produits', 'factures', 'devis'],
			authentication: 'Authorization: Bearer <token>',
			documentation: '/api-docs',
		};
	}

	// ——— Clients ———
	@Get('clients')
	@RequireApiScopes('clients.read')
	listClients(@Query() query: ListQueryDto, @ApiOrganizationId() orgId: number) {
		return this.clients.findAll(query, orgId);
	}

	@Get('clients/:id')
	@RequireApiScopes('clients.read')
	getClient(@Param('id', ParseEntityIdPipe) id: string, @ApiOrganizationId() orgId: number) {
		return this.clients.findOne(id, orgId);
	}

	@Post('clients')
	@RequireApiScopes('clients.write')
	createClient(@Body() data: CreateClientDto, @ApiOrganizationId() orgId: number) {
		return this.clients.create(data, orgId);
	}

	@Patch('clients/:id')
	@RequireApiScopes('clients.write')
	updateClient(
		@Param('id', ParseEntityIdPipe) id: string,
		@Body() data: UpdateClientDto,
		@ApiOrganizationId() orgId: number,
	) {
		return this.clients.update(id, data, orgId);
	}

	@Delete('clients/:id')
	@RequireApiScopes('clients.write')
	removeClient(@Param('id', ParseEntityIdPipe) id: string, @ApiOrganizationId() orgId: number) {
		return this.clients.remove(id, orgId);
	}

	// ——— Produits ———
	@Get('produits')
	@RequireApiScopes('produits.read')
	listProducts(@Query() query: ListProductsQueryDto) {
		return this.products.findAll(query);
	}

	@Get('produits/:id')
	@RequireApiScopes('produits.read')
	getProduct(@Param('id', ParseIntPipe) id: number) {
		return this.products.findOne(id);
	}

	@Post('produits')
	@RequireApiScopes('produits.write')
	createProduct(@Body() data: CreateProductDto) {
		return this.products.create(data);
	}

	@Patch('produits/:id')
	@RequireApiScopes('produits.write')
	updateProduct(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateProductDto) {
		return this.products.update(id, data);
	}

	@Delete('produits/:id')
	@RequireApiScopes('produits.write')
	removeProduct(@Param('id', ParseIntPipe) id: number) {
		return this.products.remove(id);
	}

	// ——— Factures ———
	@Get('factures')
	@RequireApiScopes('factures.read')
	listInvoices(@Query() query: ListQueryDto, @ApiOrganizationId() orgId: number) {
		return this.invoices.findAll(query, orgId);
	}

	@Get('factures/archives')
	@RequireApiScopes('factures.read')
	listArchivedInvoices(@ApiOrganizationId() orgId: number) {
		return this.invoices.findArchivedGrouped(orgId);
	}

	@Get('factures/:id')
	@RequireApiScopes('factures.read')
	getInvoice(@Param('id', ParseEntityIdPipe) id: string, @ApiOrganizationId() orgId: number) {
		return this.invoices.findOne(id, orgId);
	}

	@Post('factures')
	@RequireApiScopes('factures.write')
	createInvoice(@Body() data: CreateInvoiceDto, @ApiOrganizationId() orgId: number) {
		return this.invoices.create(data, orgId);
	}

	@Patch('factures/:id')
	@RequireApiScopes('factures.write')
	updateInvoice(
		@Param('id', ParseEntityIdPipe) id: string,
		@Body() data: UpdateInvoiceDto,
		@ApiOrganizationId() orgId: number,
	) {
		return this.invoices.update(id, data, orgId);
	}

	@Post('factures/:id/send')
	@RequireApiScopes('factures.send')
	sendInvoice(
		@Param('id', ParseEntityIdPipe) id: string,
		@Body() body: SendPublicInvoiceDto,
		@ApiOrganizationId() orgId: number,
	) {
		return this.dispatch.sendInvoiceByEmail(id, orgId, body);
	}

	@Post('factures/:id/archive')
	@RequireApiScopes('factures.write')
	archiveInvoice(@Param('id', ParseEntityIdPipe) id: string, @ApiOrganizationId() orgId: number) {
		return this.invoices.archive(id, orgId);
	}

	@Post('factures/:id/restore')
	@RequireApiScopes('factures.write')
	restoreInvoice(@Param('id', ParseEntityIdPipe) id: string, @ApiOrganizationId() orgId: number) {
		return this.invoices.restore(id, orgId);
	}

	// ——— Devis ———
	@Get('devis')
	@RequireApiScopes('devis.read')
	listQuotes(@ApiOrganizationId() orgId: number) {
		return this.quotes.findAll(orgId);
	}

	@Get('devis/archives')
	@RequireApiScopes('devis.read')
	listArchivedQuotes(@ApiOrganizationId() orgId: number) {
		return this.quotes.findArchivedGrouped(orgId);
	}

	@Get('devis/:id')
	@RequireApiScopes('devis.read')
	getQuote(@Param('id', ParseEntityIdPipe) id: string, @ApiOrganizationId() orgId: number) {
		return this.quotes.findOne(id, orgId);
	}

	@Post('devis')
	@RequireApiScopes('devis.write')
	createQuote(@Body() data: CreateQuoteDto, @ApiOrganizationId() orgId: number) {
		return this.quotes.create(data, orgId);
	}

	@Patch('devis/:id')
	@RequireApiScopes('devis.write')
	updateQuote(
		@Param('id', ParseEntityIdPipe) id: string,
		@Body() data: UpdateQuoteDto,
		@ApiOrganizationId() orgId: number,
	) {
		return this.quotes.update(id, data, orgId);
	}

	@Post('devis/:id/send')
	@RequireApiScopes('devis.send')
	sendQuote(@Param('id', ParseEntityIdPipe) id: string, @ApiOrganizationId() orgId: number) {
		return this.dispatch.sendQuoteByEmail(id, orgId);
	}

	@Post('devis/:id/archive')
	@RequireApiScopes('devis.write')
	archiveQuote(@Param('id', ParseEntityIdPipe) id: string, @ApiOrganizationId() orgId: number) {
		return this.quotes.archive(id, orgId);
	}

	@Post('devis/:id/restore')
	@RequireApiScopes('devis.write')
	restoreQuote(@Param('id', ParseEntityIdPipe) id: string, @ApiOrganizationId() orgId: number) {
		return this.quotes.restore(id, orgId);
	}
}
