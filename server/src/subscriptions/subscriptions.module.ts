import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { BillingModule } from '../billing/billing.module';

@Module({
	imports: [BillingModule],
	controllers: [SubscriptionsController],
	providers: [SubscriptionsService]
})
export class SubscriptionsModule {}


