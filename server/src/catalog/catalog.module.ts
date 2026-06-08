import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProductsModule } from '../products/products.module';
import { CatalogController } from './catalog.controller';
import { CatalogPersonalizationService } from './catalog-personalization.service';

@Module({
	imports: [PrismaModule, forwardRef(() => ProductsModule)],
	controllers: [CatalogController],
	providers: [CatalogPersonalizationService],
	exports: [CatalogPersonalizationService],
})
export class CatalogModule {}
