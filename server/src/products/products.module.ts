import { Module, forwardRef } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { DeliverablesCatalogService } from './deliverables-catalog.service';

@Module({
	imports: [forwardRef(() => CatalogModule), RealtimeModule],
	controllers: [ProductsController],
	providers: [ProductsService, DeliverablesCatalogService],
	exports: [ProductsService, DeliverablesCatalogService],
})
export class ProductsModule {}


