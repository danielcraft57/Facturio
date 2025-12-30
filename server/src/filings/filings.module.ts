import { Module } from '@nestjs/common';
import { FilingsService } from './filings.service';
import { FilingsController } from './filings.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
	imports: [PrismaModule],
	controllers: [FilingsController],
	providers: [FilingsService],
	exports: [FilingsService]
})
export class FilingsModule {}


