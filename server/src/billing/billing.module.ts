import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BetaTesterService } from './beta-tester.service';
import { BillingController } from './billing.controller';
import { PlatformStripeService } from './platform-stripe.service';
import { AccountingPlanGuard } from './guards/accounting-plan.guard';
import { FinanceModulePlanGuard } from './guards/finance-module-plan.guard';
import { ConfigModule } from '../config/config.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
	imports: [ConfigModule, PrismaModule, CommonModule],
	controllers: [BillingController],
	providers: [
		BillingService,
		BetaTesterService,
		PlatformStripeService,
		AccountingPlanGuard,
		FinanceModulePlanGuard,
	],
	exports: [
		BillingService,
		BetaTesterService,
		PlatformStripeService,
		AccountingPlanGuard,
		FinanceModulePlanGuard,
	],
})
export class BillingModule {}
