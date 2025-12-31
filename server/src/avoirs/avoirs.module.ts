import { Module } from '@nestjs/common';
import { AvoirsService } from './avoirs.service';
import { AvoirsController } from './avoirs.controller';
import { CommonModule } from '../common/common.module';
import { AccountingModule } from '../accounting/accounting.module';
import { ConfigModule } from '../config/config.module';

@Module({
	imports: [CommonModule, AccountingModule, ConfigModule],
	controllers: [AvoirsController],
	providers: [AvoirsService],
	exports: [AvoirsService]
})
export class AvoirsModule {}

