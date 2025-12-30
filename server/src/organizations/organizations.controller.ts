import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('organization')
export class OrganizationsController {
	constructor(private readonly organizationsService: OrganizationsService) {}

	@Get('profile')
	@UseGuards(JwtAuthGuard)
	getProfile(@CurrentUser() user: any) {
		return this.organizationsService.getProfile(user.organizationId);
	}

	@Patch('profile')
	@UseGuards(JwtAuthGuard)
	updateProfile(@CurrentUser() user: any, @Body() data: any) {
		return this.organizationsService.updateProfile(user.organizationId, data);
	}
}

