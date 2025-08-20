import { Global, Module } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { EmailService } from './email.service';

@Global()
@Module({
	providers: [PdfService, EmailService],
	exports: [PdfService, EmailService]
})
export class CommonModule {}
