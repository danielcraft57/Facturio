import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';

/**
 * Module référentiel fournisseurs.
 */
@Module({
	imports: [PrismaModule, BillingModule],
	controllers: [SuppliersController],
	providers: [SuppliersService],
	exports: [SuppliersService],
})
export class SuppliersModule {}
