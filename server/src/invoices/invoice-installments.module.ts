import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AccountingModule } from '../accounting/accounting.module';
import { InvoiceInstallmentsService } from './invoice-installments.service';

/**
 * Module échéanciers facture — exporté pour Stripe et Payments.
 */
@Module({
	imports: [PrismaModule, AccountingModule],
	providers: [InvoiceInstallmentsService],
	exports: [InvoiceInstallmentsService],
})
export class InvoiceInstallmentsModule {}
