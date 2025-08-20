import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { CreateTaxDto, TaxesService, UpdateTaxDto } from './taxes.service';

@Controller('taxes')
export class TaxesController {
	constructor(private readonly taxes: TaxesService) {}

	@Post()
	create(@Body() data: CreateTaxDto) {
		return this.taxes.create(data);
	}

	@Get()
	findAll(@Query() query: { search?: string; isDefault?: string }) {
		return this.taxes.findAll({
			search: query.search,
			isDefault: query.isDefault === 'true' ? true : query.isDefault === 'false' ? false : undefined
		});
	}

	@Get(':id')
	findOne(@Param('id', ParseIntPipe) id: number) {
		return this.taxes.findOne(id);
	}

	@Patch(':id')
	update(
		@Param('id', ParseIntPipe) id: number,
		@Body() data: UpdateTaxDto
	) {
		return this.taxes.update(id, data);
	}

	@Delete(':id')
	remove(@Param('id', ParseIntPipe) id: number) {
		return this.taxes.remove(id);
	}
}


