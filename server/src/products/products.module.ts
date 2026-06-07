import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';

@Module({
	imports: [CatalogModule, RealtimeModule],
	controllers: [ProductsController],
	providers: [ProductsService],
	exports: [ProductsService],
})
export class ProductsModule {}


