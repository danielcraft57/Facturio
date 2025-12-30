import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ListQueryDto } from '../common/dto/list-query.dto';

@Controller('products')
export class ProductsController {
	constructor(private readonly products: ProductsService) {}

	@Post()
	create(@Body() data: CreateProductDto) {
		return this.products.create(data);
	}

	@Get()
	findAll(@Query() query: ListQueryDto) {
		return this.products.findAll(query);
	}

	@Get(':id')
	findOne(@Param('id', ParseIntPipe) id: number) {
		return this.products.findOne(id);
	}

	@Patch(':id')
	update(
		@Param('id', ParseIntPipe) id: number,
		@Body() data: UpdateProductDto
	) {
		return this.products.update(id, data);
	}

	@Delete(':id')
	remove(@Param('id', ParseIntPipe) id: number) {
		return this.products.remove(id);
	}
}


