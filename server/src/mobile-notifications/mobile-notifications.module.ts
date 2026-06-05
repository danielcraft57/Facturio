import { Module } from '@nestjs/common';
import { MobileNotificationsController } from './mobile-notifications.controller';
import { MobileNotificationsService } from './mobile-notifications.service';

@Module({
	controllers: [MobileNotificationsController],
	providers: [MobileNotificationsService],
	exports: [MobileNotificationsService],
})
export class MobileNotificationsModule {}
