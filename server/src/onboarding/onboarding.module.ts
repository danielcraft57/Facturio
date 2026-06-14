import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CatalogModule } from '../catalog/catalog.module';
import { CommonModule } from '../common/common.module';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';

@Module({
	imports: [PrismaModule, CatalogModule, CommonModule],
	controllers: [OnboardingController],
	providers: [OnboardingService],
	exports: [OnboardingService],
})
export class OnboardingModule {}
