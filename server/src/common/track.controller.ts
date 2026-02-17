import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';

/** Image 1x1 pixel transparente (GIF) pour le tracking d'ouverture d'email. */
const PIXEL_GIF = Buffer.from(
	'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
	'base64'
);

/**
 * Controller pour le tracking des emails (pixel lu/non lu).
 *
 * Les routes sont publiques (préfixe /api/track exclu du guard local).
 * Enregistre un événement "opened" et renvoie une image 1x1 pour être inclus dans l'email.
 */
@Controller('track')
export class TrackController {
	constructor(private readonly prisma: PrismaService) {}

	@Get('opened/quote/:token')
	async trackQuoteOpened(@Param('token') token: string, @Res() res: Response) {
		const quote = await this.prisma.quote.findUnique({
			where: { publicToken: token },
			select: { id: true }
		});
		if (quote) {
			await this.prisma.emailEvent.create({
				data: { quoteId: quote.id, type: 'opened' }
			});
		}
		res.setHeader('Content-Type', 'image/gif');
		res.setHeader('Cache-Control', 'no-store');
		return res.send(PIXEL_GIF);
	}

	@Get('opened/invoice/:token')
	async trackInvoiceOpened(@Param('token') token: string, @Res() res: Response) {
		const invoice = await this.prisma.invoice.findUnique({
			where: { publicToken: token },
			select: { id: true }
		});
		if (invoice) {
			await this.prisma.emailEvent.create({
				data: { invoiceId: invoice.id, type: 'opened' }
			});
		}
		res.setHeader('Content-Type', 'image/gif');
		res.setHeader('Cache-Control', 'no-store');
		return res.send(PIXEL_GIF);
	}
}
