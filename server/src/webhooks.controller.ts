import { Body, Controller, Post } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller('webhooks')
export class WebhooksController {
	constructor(private readonly prisma: PrismaService) {}

	@Post('email')
	async email(@Body() event: any) {
		const type = String(event?.RecordType || event?.type || 'unknown').toLowerCase();
		const providerId = event?.MessageID || event?.id || null;
		const quoteId = event?.quoteId ?? (event?.Metadata?.quoteId ? Number(event.Metadata.quoteId) : null);
		const invoiceId = event?.invoiceId ?? (event?.Metadata?.invoiceId ? Number(event.Metadata.invoiceId) : null);
		await this.prisma.emailEvent.create({
			data: {
				quoteId: quoteId ? Number(quoteId) : undefined,
				invoiceId: invoiceId ? Number(invoiceId) : undefined,
				type,
				providerId,
				meta: event
			}
		});
		return { ok: true };
	}
}
