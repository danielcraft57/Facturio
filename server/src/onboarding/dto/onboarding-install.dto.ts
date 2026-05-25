import { IsArray, IsString } from 'class-validator';

export class OnboardingInstallDto {
	@IsArray()
	@IsString({ each: true })
	technologyIds!: string[];
}
