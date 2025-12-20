import { Module } from '@nestjs/common';
import { ProspectsController } from './prospects.controller';
import { ProspectsService } from './prospects.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
	imports: [PrismaModule],
	controllers: [ProspectsController],
	providers: [ProspectsService],
	exports: [ProspectsService]
})
export class ProspectsModule {}




