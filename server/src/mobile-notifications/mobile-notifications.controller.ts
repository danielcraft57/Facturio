import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { MobileNotificationsService } from './mobile-notifications.service';

@Controller('mobile-notifications')
export class MobileNotificationsController {
	constructor(private readonly mobileNotifications: MobileNotificationsService) {}

	@Post('devices')
	registerDevice(@Body() body: RegisterDeviceDto, @CurrentUser() user: any) {
		const device = this.mobileNotifications.registerDevice({
			organizationId: user.organizationId,
			userId: user.id,
			expoPushToken: body.expoPushToken,
			platform: body.platform,
			deviceName: body.deviceName,
			appVersion: body.appVersion,
		});

		return {
			success: true,
			message: 'Device token enregistré',
			device,
		};
	}

	@Get('devices')
	listDevices(@CurrentUser() user: any) {
		return {
			devices: this.mobileNotifications.listOrganizationDevices(user.organizationId),
		};
	}
}
