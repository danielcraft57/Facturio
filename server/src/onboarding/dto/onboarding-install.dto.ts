import { IsArray, IsInt, IsOptional, IsString, Validate } from 'class-validator';
import { IsOnboardingProfileConstraint } from './is-onboarding-profile.validator';

export class OnboardingInstallDto {
	@IsArray()
	@IsString({ each: true })
	technologyIds!: string[];

	@IsOptional()
	@IsString()
	@Validate(IsOnboardingProfileConstraint)
	devProfile?: string;

	@IsOptional()
	@IsArray()
	@IsInt({ each: true })
	templateProductIds?: number[];
}
