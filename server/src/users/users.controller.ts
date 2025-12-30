import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ChangePasswordDto } from '../auth/dto/change-password.dto';

@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Get('me')
	@UseGuards(JwtAuthGuard)
	getProfile(@CurrentUser() user: any) {
		return this.usersService.getProfile(user.id);
	}

	@Patch('me')
	@UseGuards(JwtAuthGuard)
	updateProfile(@CurrentUser() user: any, @Body() data: { firstName?: string; lastName?: string; phone?: string; avatar?: string }) {
		return this.usersService.updateProfile(user.id, data);
	}

	@Patch('me/password')
	@UseGuards(JwtAuthGuard)
	changePassword(@CurrentUser() user: any, @Body() data: ChangePasswordDto) {
		return this.usersService.changePassword(user.id, data.oldPassword, data.newPassword);
	}
}

