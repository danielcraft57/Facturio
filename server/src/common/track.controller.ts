import { Controller, Get, Param, Res, BadRequestException } from '@nestjs/common';

import { Response } from 'express';

import { PrismaService } from '../prisma/prisma.service';

import { RealtimeEventsService } from '../realtime/realtime-events.service';

import {

	isInvoiceClickAction,

	isQuoteClickAction,

	normalizeEmailTrackToken,

	resolveInvoiceClickRedirect,

	resolveQuoteClickRedirect,

} from './email-track.util';



/** Image 1x1 pixel transparente (GIF) pour le tracking d'ouverture d'email. */

const PIXEL_GIF = Buffer.from(

	'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',

	'base64',

);



/**

 * Tracking public des emails (ouverture + clics CTA).

 * Routes sans auth — utilisées dans les emails clients.

 */

@Controller('track')

export class TrackController {

	constructor(

		private readonly prisma: PrismaService,

		private readonly realtime: RealtimeEventsService,

	) {}



	@Get('opened/quote/:token')

	async trackQuoteOpened(@Param('token') token: string, @Res() res: Response) {

		await this.recordOpened('quote', token);

		return this.sendPixel(res);

	}



	@Get('opened/invoice/:token')

	async trackInvoiceOpened(@Param('token') token: string, @Res() res: Response) {

		await this.recordOpened('invoice', token);

		return this.sendPixel(res);

	}



	@Get('click/quote/:token/:action')

	async trackQuoteClick(

		@Param('token') token: string,

		@Param('action') action: string,

		@Res() res: Response,

	) {

		if (!isQuoteClickAction(action)) {

			throw new BadRequestException('Action de tracking invalide');

		}

		const safeToken = normalizeEmailTrackToken(token);

		const quote = await this.prisma.quote.findUnique({

			where: { publicToken: safeToken },

			select: { id: true, organizationId: true, number: true },

		});

		if (quote) {

			await this.prisma.emailEvent.create({

				data: {

					quoteId: quote.id,

					type: 'clicked',

					meta: { action, source: 'email' },

				},

			});

			this.emitEngagementUpdate('quotes', quote.organizationId, quote.id, quote.number, 'EMAIL_CLICKED');

		}

		return res.redirect(302, resolveQuoteClickRedirect(safeToken, action));

	}



	@Get('click/invoice/:token/:action')

	async trackInvoiceClick(

		@Param('token') token: string,

		@Param('action') action: string,

		@Res() res: Response,

	) {

		if (!isInvoiceClickAction(action)) {

			throw new BadRequestException('Action de tracking invalide');

		}

		const safeToken = normalizeEmailTrackToken(token);

		const invoice = await this.prisma.invoice.findUnique({

			where: { publicToken: safeToken },

			select: { id: true, organizationId: true, number: true },

		});

		if (invoice) {

			await this.prisma.emailEvent.create({

				data: {

					invoiceId: invoice.id,

					type: 'clicked',

					meta: { action, source: 'email' },

				},

			});

			this.emitEngagementUpdate(

				'invoices',

				invoice.organizationId,

				invoice.id,

				invoice.number,

				'EMAIL_CLICKED',

			);

		}

		return res.redirect(302, resolveInvoiceClickRedirect(safeToken, action));

	}



	private async recordOpened(kind: 'quote' | 'invoice', rawToken: string): Promise<void> {

		const token = normalizeEmailTrackToken(rawToken);

		if (kind === 'quote') {

			const quote = await this.prisma.quote.findUnique({

				where: { publicToken: token },

				select: { id: true, organizationId: true, number: true },

			});

			if (quote) {

				await this.prisma.emailEvent.create({

					data: { quoteId: quote.id, type: 'opened' },

				});

				this.emitEngagementUpdate('quotes', quote.organizationId, quote.id, quote.number, 'EMAIL_OPENED');

			}

			return;

		}

		const invoice = await this.prisma.invoice.findUnique({

			where: { publicToken: token },

			select: { id: true, organizationId: true, number: true },

		});

		if (invoice) {

			await this.prisma.emailEvent.create({

				data: { invoiceId: invoice.id, type: 'opened' },

			});

			this.emitEngagementUpdate(

				'invoices',

				invoice.organizationId,

				invoice.id,

				invoice.number,

				'EMAIL_OPENED',

			);

		}

	}



	private emitEngagementUpdate(

		resource: 'quotes' | 'invoices',

		organizationId: number | null,

		id: string,

		number: string,

		status: string,

	): void {

		if (!organizationId) return;

		this.realtime.emit(organizationId, resource, 'updated', id, { number, status });

	}



	private sendPixel(res: Response) {

		res.setHeader('Content-Type', 'image/gif');

		res.setHeader('Cache-Control', 'no-store');

		return res.send(PIXEL_GIF);

	}

}


