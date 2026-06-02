import { TrackController } from './track.controller';
import { normalizeEmailTrackToken } from './email-track.util';

describe('TrackController', () => {
	const createController = () => {
		const prisma = {
			quote: {
				findUnique: jest.fn(),
			},
			invoice: {
				findUnique: jest.fn(),
			},
			emailEvent: {
				create: jest.fn().mockResolvedValue({}),
			},
		};
		const realtime = {
			emit: jest.fn(),
		};
		const controller = new TrackController(prisma as never, realtime as never);
		return { controller, prisma, realtime };
	};

	it('normalise le token et enregistre une ouverture devis + SSE', async () => {
		const { controller, prisma, realtime } = createController();
		const token = 'abcd=ef0123456789';
		const normalized = normalizeEmailTrackToken(token);
		prisma.quote.findUnique.mockResolvedValue({
			id: 'quote-1',
			organizationId: 7,
			number: 'DEV-2026-001',
		});

		const res = {
			setHeader: jest.fn(),
			send: jest.fn().mockReturnThis(),
		};

		await controller.trackQuoteOpened(token, res as never);

		expect(prisma.quote.findUnique).toHaveBeenCalledWith({
			where: { publicToken: normalized },
			select: { id: true, organizationId: true, number: true },
		});
		expect(prisma.emailEvent.create).toHaveBeenCalledWith({
			data: { quoteId: 'quote-1', type: 'opened' },
		});
		expect(realtime.emit).toHaveBeenCalledWith(7, 'quotes', 'updated', 'quote-1', {
			number: 'DEV-2026-001',
			status: 'EMAIL_OPENED',
		});
		expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'image/gif');
	});

	it('enregistre une ouverture facture', async () => {
		const { controller, prisma, realtime } = createController();
		prisma.invoice.findUnique.mockResolvedValue({
			id: 'inv-1',
			organizationId: 3,
			number: 'FAC-2026-001',
		});

		const res = {
			setHeader: jest.fn(),
			send: jest.fn().mockReturnThis(),
		};

		await controller.trackInvoiceOpened('token-fac', res as never);

		expect(prisma.emailEvent.create).toHaveBeenCalledWith({
			data: { invoiceId: 'inv-1', type: 'opened' },
		});
		expect(realtime.emit).toHaveBeenCalledWith(3, 'invoices', 'updated', 'inv-1', {
			number: 'FAC-2026-001',
			status: 'EMAIL_OPENED',
		});
	});
});
