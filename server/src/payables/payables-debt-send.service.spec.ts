import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PayablesDebtSendService } from './payables-debt-send.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../common/email.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import { DocumentEmailCopiesService } from '../common/document-email-copies.service';
import { PayablesService } from './payables.service';

describe('PayablesDebtSendService', () => {
	let service: PayablesDebtSendService;
	const mockEmail = {
		sendPayableDebt: jest.fn().mockResolvedValue(undefined),
		sendPayableDebtPayment: jest.fn().mockResolvedValue(undefined),
	};
	const mockRealtime = { emit: jest.fn() };
	const mockOrganizations = {
		getProfile: jest.fn().mockResolvedValue({ name: 'Org Test' }),
	};
	const mockCopies = {
		buildCopyRecipients: jest.fn().mockReturnValue([]),
	};
	const mockPayables = {
		postPurchaseOnRecognition: jest.fn().mockResolvedValue(undefined),
	};

	const debtBase = {
		id: 7,
		organizationId: 1,
		creditorId: 2,
		label: 'Prêt',
		totalAmount: 100,
		balance: 0,
		status: 'PAID',
		dueDate: null,
		notes: null,
		publicToken: 'tok',
		creditor: { id: 2, name: 'Maman', email: 'maman@test.fr' },
		payments: [{ amount: 100 }],
	};

	const mockPrisma = {
		payableDebt: {
			findFirst: jest.fn(),
			update: jest.fn(),
		},
		payableCreditor: {
			update: jest.fn(),
		},
	};

	beforeEach(async () => {
		jest.clearAllMocks();
		const moduleRef = await Test.createTestingModule({
			providers: [
				PayablesDebtSendService,
				{ provide: PrismaService, useValue: mockPrisma },
				{ provide: EmailService, useValue: mockEmail },
				{ provide: OrganizationsService, useValue: mockOrganizations },
				{ provide: RealtimeEventsService, useValue: mockRealtime },
				{ provide: DocumentEmailCopiesService, useValue: mockCopies },
				{ provide: PayablesService, useValue: mockPayables },
			],
		}).compile();

		service = moduleRef.get(PayablesDebtSendService);
	});

	describe('sendPaymentNoticeByEmail', () => {
		it('notifie un remboursement total (dette soldée)', async () => {
			mockPrisma.payableDebt.findFirst.mockResolvedValue(debtBase);

			const res = await service.sendPaymentNoticeByEmail(7, 1, { paymentAmount: 100 }, 'user@test.fr');

			expect(res.fullyPaid).toBe(true);
			expect(res.emailSent).toBe(true);
			expect(res.sentTo).toBe('maman@test.fr');
			expect(mockEmail.sendPayableDebtPayment).toHaveBeenCalledWith(
				expect.objectContaining({
					to: 'maman@test.fr',
					paymentAmount: 100,
					fullyPaid: true,
					balance: 0,
					totalPaid: 100,
				}),
			);
			expect(mockRealtime.emit).toHaveBeenCalledWith(1, 'payables', 'updated', '7', expect.any(Object));
		});

		it('notifie un remboursement partiel', async () => {
			mockPrisma.payableDebt.findFirst.mockResolvedValue({
				...debtBase,
				balance: 60,
				status: 'PARTIAL',
				payments: [{ amount: 40 }],
			});

			const res = await service.sendPaymentNoticeByEmail(7, 1, { paymentAmount: 40 });

			expect(res.fullyPaid).toBe(false);
			expect(mockEmail.sendPayableDebtPayment).toHaveBeenCalledWith(
				expect.objectContaining({
					paymentAmount: 40,
					fullyPaid: false,
					balance: 60,
					totalPaid: 40,
				}),
			);
		});

		it('refuse sans email créancier', async () => {
			mockPrisma.payableDebt.findFirst.mockResolvedValue({
				...debtBase,
				creditor: { id: 2, name: 'Maman', email: null },
			});

			await expect(
				service.sendPaymentNoticeByEmail(7, 1, { paymentAmount: 10 }),
			).rejects.toBeInstanceOf(BadRequestException);
		});

		it('refuse pour dette annulée', async () => {
			mockPrisma.payableDebt.findFirst.mockResolvedValue({
				...debtBase,
				status: 'CANCELLED',
			});

			await expect(
				service.sendPaymentNoticeByEmail(7, 1, {
					paymentAmount: 10,
					email: 'x@test.fr',
				}),
			).rejects.toBeInstanceOf(BadRequestException);
		});

		it('refuse dette introuvable', async () => {
			mockPrisma.payableDebt.findFirst.mockResolvedValue(null);

			await expect(
				service.sendPaymentNoticeByEmail(99, 1, {
					paymentAmount: 10,
					email: 'x@test.fr',
				}),
			).rejects.toBeInstanceOf(NotFoundException);
		});
	});
});
