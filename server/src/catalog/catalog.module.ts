import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CatalogController } from './catalog.controller';
import { CatalogPersonalizationService } from './catalog-personalization.service';

@Module({
	imports: [PrismaModule],
	controllers: [CatalogController],
	providers: [CatalogPersonalizationService],
	exports: [CatalogPersonalizationService],
})
export class CatalogModule {}
