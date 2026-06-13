import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AccountingModule } from '../accounting/accounting.module';
import { CommonModule } from '../common/common.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { ConfigModule } from '../config/config.module';
import { InvoiceInstallmentsService } from './invoice-installments.service';
import { InvoiceInstallmentReleaseService } from './invoice-installment-release.service';

/**
 * Module échéanciers facture — exporté pour Stripe et Payments.
 */
@Module({
	imports: [PrismaModule, AccountingModule, CommonModule, OrganizationsModule, ConfigModule],
	providers: [InvoiceInstallmentsService, InvoiceInstallmentReleaseService],
	exports: [InvoiceInstallmentsService, InvoiceInstallmentReleaseService],
})
export class InvoiceInstallmentsModule {}
