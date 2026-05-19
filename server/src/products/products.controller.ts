import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('products')
export class ProductsController {
	constructor(private readonly products: ProductsService) {}

	@Post()
	create(@Body() data: CreateProductDto, @CurrentUser() user: any) {
		return this.products.create(data);
	}

	@Get()
	findAll(@Query() query: ListProductsQueryDto, @CurrentUser() user: any) {
		return this.products.findAll(query);
	}

	@Get(':id')
	findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
		return this.products.findOne(id);
	}

	@Patch(':id')
	update(
		@Param('id', ParseIntPipe) id: number,
		@Body() data: UpdateProductDto,
		@CurrentUser() user: any
	) {
		return this.products.update(id, data);
	}

	@Delete(':id')
	remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
		return this.products.remove(id);
	}
}


