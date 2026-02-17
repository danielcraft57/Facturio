import { Global, Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { EmailService } from './email.service';
import { OrganizationMiddleware } from './middleware/organization.middleware';
import { TrackController } from './track.controller';

@Global()
@Module({
	controllers: [TrackController],
	providers: [PdfService, EmailService, OrganizationMiddleware],
	exports: [PdfService, EmailService, OrganizationMiddleware]
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
