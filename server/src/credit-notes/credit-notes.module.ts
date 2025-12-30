import { Module } from '@nestjs/common';
import { CreditNotesService } from './credit-notes.service';
import { CreditNotesController } from './credit-notes.controller';
import { CommonModule } from '../common/common.module';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
	imports: [CommonModule, AccountingModule],
	controllers: [CreditNotesController],
	providers: [CreditNotesService],
	exports: [CreditNotesService]
})
export class CreditNotesModule {}

