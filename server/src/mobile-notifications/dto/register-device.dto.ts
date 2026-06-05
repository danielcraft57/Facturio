import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class RegisterDeviceDto {
	@IsString()
	@MaxLength(256)
	expoPushToken!: string;

	@IsString()
	@IsIn(['android', 'ios', 'web'])
	platform!: 'android' | 'ios' | 'web';

	@IsOptional()
	@IsString()
	@MaxLength(120)
	deviceName?: string;

	@IsOptional()
	@IsString()
	@MaxLength(60)
	appVersion?: string;
}
