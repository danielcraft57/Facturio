import { Body, Controller, Get, Patch } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('organization')
export class OrganizationsController {
	constructor(private readonly organizationsService: OrganizationsService) {}

	@Get('profile')
	getProfile(@CurrentUser() user: any) {
		return this.organizationsService.getProfile(user.organizationId);
	}

	@Patch('profile')
	updateProfile(@CurrentUser() user: any, @Body() data: any) {
		return this.organizationsService.updateProfile(user.organizationId, data);
	}
}

