import { Body, Controller, Get, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ChangePasswordDto } from '../auth/dto/change-password.dto';

@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Get('me')
	getProfile(@CurrentUser() user: any) {
		return this.usersService.getProfile(user.id);
	}

	@Patch('me')
	updateProfile(@CurrentUser() user: any, @Body() data: { firstName?: string; lastName?: string; phone?: string; avatar?: string }) {
		return this.usersService.updateProfile(user.id, data);
	}

	@Patch('me/password')
	changePassword(@CurrentUser() user: any, @Body() data: ChangePasswordDto) {
		return this.usersService.changePassword(user.id, data.oldPassword, data.newPassword);
	}
}

