import { Global, Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PdfService } from './pdf.service';
import { EmailService } from './email.service';
import { OrganizationMiddleware } from './middleware/organization.middleware';
import { TrackController } from './track.controller';
import { CleanupUnverifiedUsersService } from './cleanup-unverified-users.service';
import { RateLimitService } from './rate-limit.middleware';

@Global()
@Module({
	imports: [ScheduleModule.forRoot()],
	controllers: [TrackController],
	providers: [PdfService, EmailService, OrganizationMiddleware, CleanupUnverifiedUsersService, RateLimitService],
	exports: [PdfService, EmailService, OrganizationMiddleware, RateLimitService]
})
export class CommonModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		// Appliquer le middleware à toutes les routes sauf auth
		consumer
			.apply(OrganizationMiddleware)
			.exclude('auth/(.*)', 'auth')
			.forRoutes('*');
	}
}
