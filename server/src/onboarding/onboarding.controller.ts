import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OnboardingService } from './onboarding.service';
import { OnboardingInstallDto } from './dto/onboarding-install.dto';

@Controller('onboarding')
export class OnboardingController {
	constructor(private readonly onboarding: OnboardingService) {}

	@Get('status')
	getStatus(@CurrentUser() user: { organizationId: number }) {
		return this.onboarding.getStatus(user.organizationId);
	}

	@Get('tech-choices')
	getTechChoices() {
		return this.onboarding.getTechChoices();
	}

	@Get('profiles')
	getProfiles() {
		return this.onboarding.getProfiles();
	}

	@Post('preview')
	preview(
		@CurrentUser() user: { organizationId: number },
		@Body() body: OnboardingInstallDto,
	) {
		return this.onboarding.previewInstall(user.organizationId, body.technologyIds);
	}

	@Post('install')
	install(
		@CurrentUser() user: { organizationId: number },
		@Body() body: OnboardingInstallDto,
	) {
		return this.onboarding.install(
			user.organizationId,
			body.technologyIds,
			body.devProfile,
			body.templateProductIds,
		);
	}
}
