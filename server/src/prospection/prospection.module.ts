import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ProspectionController } from './prospection.controller';
import { ProspectionService } from './prospection.service';

@Module({
	imports: [ConfigModule, PrismaModule],
	controllers: [ProspectionController],
	providers: [ProspectionService],
	exports: [ProspectionService]
})
export class ProspectionModule {}
