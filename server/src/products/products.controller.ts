import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { DeliverablesCatalogService } from './deliverables-catalog.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('products')
export class ProductsController {
	constructor(
		private readonly products: ProductsService,
		private readonly deliverablesCatalog: DeliverablesCatalogService,
	) {}

	@Post()
	create(@Body() data: CreateProductDto, @CurrentUser() user: any) {
		return this.products.create(data, user.organizationId);
	}

	@Get()
	findAll(@Query() query: ListProductsQueryDto, @CurrentUser() user: any) {
		return this.products.findAll(query, user.organizationId);
	}

	@Get('deliverables/catalog')
	searchDeliverablesCatalog(@Query('q') q: string, @CurrentUser() user: any) {
		if (!user?.organizationId) return [];
		return this.deliverablesCatalog.search(user.organizationId, q);
	}

	@Get(':id')
	findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
		return this.products.findOne(id, user.organizationId);
	}

	@Patch(':id')
	update(
		@Param('id', ParseIntPipe) id: number,
		@Body() data: UpdateProductDto,
		@CurrentUser() user: any
	) {
		return this.products.update(id, data, user.organizationId);
	}

	@Delete(':id')
	remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
		return this.products.remove(id, user.organizationId);
	}
}


