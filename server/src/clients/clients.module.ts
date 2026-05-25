import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CatalogModule } from '../catalog/catalog.module';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';

@Module({
	imports: [PrismaModule, CatalogModule],
	controllers: [ClientsController],
	providers: [ClientsService],
	exports: [ClientsService],
})
export class ClientsModule {}


