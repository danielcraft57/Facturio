import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { CreditNotesService } from './credit-notes.service';
import { CreateCreditNoteDto } from './dto/create-credit-note.dto';
import { UpdateCreditNoteDto } from './dto/update-credit-note.dto';
import { ApplyCreditNoteDto } from './dto/apply-credit-note.dto';
import { ListQueryDto } from '../common/dto/list-query.dto';

@Controller('credit-notes')
export class CreditNotesController {
	constructor(private readonly creditNotes: CreditNotesService) {}

	@Post()
	create(@Body() data: CreateCreditNoteDto) {
		return this.creditNotes.create(data);
	}

	@Get()
	findAll(@Query() query: ListQueryDto) {
		return this.creditNotes.findAll(query);
	}

	@Get(':id')
	findOne(@Param('id', ParseIntPipe) id: number) {
		return this.creditNotes.findOne(id);
	}

	@Patch(':id')
	update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateCreditNoteDto) {
		return this.creditNotes.update(id, data);
	}

	@Delete(':id')
	remove(@Param('id', ParseIntPipe) id: number) {
		return this.creditNotes.remove(id);
	}

	@Post(':id/apply')
	apply(@Param('id', ParseIntPipe) id: number, @Body() data: ApplyCreditNoteDto) {
		return this.creditNotes.apply(id, data);
	}
}

