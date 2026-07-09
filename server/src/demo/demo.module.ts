import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '../config/config.module';
import { CommonModule } from '../common/common.module';
import { DemoController } from './demo.controller';
import { DemoService } from './demo.service';
import { DemoWriteGuard } from './guards/demo-write.guard';

/**
 * Module démo — espace partagé accessible sans inscription.
 */
@Module({
	imports: [PrismaModule, AuthModule, ConfigModule, CommonModule],
	controllers: [DemoController],
	providers: [DemoService, DemoWriteGuard],
	exports: [DemoService, DemoWriteGuard],
})
export class DemoModule {}
