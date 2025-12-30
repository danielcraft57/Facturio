import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CreditNotesService } from './credit-notes.service';
import { CreateCreditNoteDto } from './dto/create-credit-note.dto';
import { UpdateCreditNoteDto } from './dto/update-credit-note.dto';
import { ApplyCreditNoteDto } from './dto/apply-credit-note.dto';
import { ListQueryDto } from '../common/dto/list-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('credit-notes')
@UseGuards(JwtAuthGuard)
export class CreditNotesController {
	constructor(private readonly creditNotes: CreditNotesService) {}

	@Post()
	create(@Body() data: CreateCreditNoteDto, @CurrentUser() user: any) {
		return this.creditNotes.create(data, user.organizationId);
	}

	@Get()
	findAll(@Query() query: ListQueryDto, @CurrentUser() user: any) {
		return this.creditNotes.findAll(query, user.organizationId);
	}

	@Get(':id')
	findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
		return this.creditNotes.findOne(id, user.organizationId);
	}

	@Patch(':id')
	update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateCreditNoteDto, @CurrentUser() user: any) {
		return this.creditNotes.update(id, data, user.organizationId);
	}

	@Delete(':id')
	remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
		return this.creditNotes.remove(id, user.organizationId);
	}

	@Post(':id/apply')
	apply(@Param('id', ParseIntPipe) id: number, @Body() data: ApplyCreditNoteDto, @CurrentUser() user: any) {
		return this.creditNotes.apply(id, data, user.organizationId);
	}
}

