import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { CreateProductDto, ProductsService, UpdateProductDto } from './products.service';

@Controller('products')
export class ProductsController {
	constructor(private readonly products: ProductsService) {}

	@Post()
	create(@Body() data: CreateProductDto) {
		return this.products.create(data);
	}

	@Get()
	findAll() {
		return this.products.findAll();
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


