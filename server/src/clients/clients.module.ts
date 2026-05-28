import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CatalogModule } from '../catalog/catalog.module';
import { AvoirsModule } from '../avoirs/avoirs.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { ClientsService } from './clients.service';
import { ClientsFinanceService } from './clients-finance.service';
import { ClientsController } from './clients.controller';

@Module({
	imports: [
		PrismaModule,
		CatalogModule,
		forwardRef(() => AvoirsModule),
		forwardRef(() => InvoicesModule),
	],
	controllers: [ClientsController],
	providers: [ClientsService, ClientsFinanceService],
	exports: [ClientsService, ClientsFinanceService],
})
export class ClientsModule {}


