import { Test, TestingModule } from '@nestjs/testing';
import { AvoirsService } from './avoirs.service';
import { PrismaService } from '../prisma/prisma.service';
import { AccountingService } from '../accounting/accounting.service';
import { ConfigService } from '../config/config.service';
import { EmailService } from '../common/email.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateAvoirDto } from './dto/create-avoir.dto';

describe('AvoirsService', () => {
	let service: AvoirsService;
	let prisma: PrismaService;

	const mockPrismaService = {
		avoir: {
			create: jest.fn(),
			findMany: jest.fn(),
			findFirst: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			count: jest.fn()
		},
		avoirApplication: {
			create: jest.fn(),
			aggregate: jest.fn()
		},
		payment: {
			findMany: jest.fn()
		},
		refund: {
			findMany: jest.fn()
		},
		invoice: {
			findUnique: jest.fn(),
			update: jest.fn()
		},
		client: {
			findUnique: jest.fn()
		},
		counter: {
			upsert: jest.fn()
		},
		taxRate: {
			findFirst: jest.fn()
		}
	};

	const mockAccountingService = {
		postEntry: jest.fn().mockResolvedValue({ id: 1 })
	};

	const mockConfigService = {
		defaultVatRate: 0.2
	};

	const mockEmailService = {
		sendInvoiceCreditedToClient: jest.fn().mockResolvedValue(undefined)
	};

	const mockOrganizationsService = {
		getProfile: jest.fn().mockResolvedValue({})
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AvoirsService,
				{
					provide: PrismaService,
					useValue: mockPrismaService
				},
				{
					provide: AccountingService,
					useValue: mockAccountingService
				},
				{
					provide: ConfigService,
					useValue: mockConfigService
				},
				{
					provide: EmailService,
					useValue: mockEmailService
				},
				{
					provide: OrganizationsService,
					useValue: mockOrganizationsService
				}
			]
		}).compile();

		service = module.get<AvoirsService>(AvoirsService);
		prisma = module.get<PrismaService>(PrismaService);

		jest.clearAllMocks();
		mockPrismaService.payment.findMany.mockResolvedValue([]);
		mockPrismaService.refund.findMany.mockResolvedValue([]);
		mockPrismaService.avoirApplication.aggregate.mockResolvedValue({
			_sum: { amount: 0 },
		});
	});

	describe('create', () => {
		it('devrait créer un avoir', async () => {
			const dto: CreateAvoirDto = {
				clientId: '1',
				lines: [
					{
						description: 'Remboursement',
						quantity: 1,
						unitPrice: 100,
						taxRate: 0.2
					}
				]
			};

			mockPrismaService.client.findUnique.mockResolvedValue({ id: 1, name: 'Test Client', organizationId: 1 });
			mockPrismaService.counter.upsert.mockResolvedValue({ scope: 'avoir-2024', current: 1 });
			mockPrismaService.taxRate.findFirst.mockResolvedValue({ rate: 0.2 });
			mockPrismaService.avoir.create.mockResolvedValue({
				id: 1,
				number: 'AVO-2024-0001',
				clientId: '1',
				invoiceId: null,
				date: new Date(),
				status: 'DRAFT',
				currency: 'EUR',
				legalMention: null,
				subtotal: 100,
				tax: 20,
				total: 120,
				appliedAmount: 0,
				lines: [
					{
						id: 1,
						description: 'Remboursement',
						quantity: 1,
						unitPrice: 100,
						taxRate: 0.2,
						taxAmount: 20,
						total: 120
					}
				],
				client: { id: 1, name: 'Test Client' },
				invoice: null,
				applications: []
			});

			const result = await service.create(dto);

			expect(result).toHaveProperty('id');
			expect(result.number).toBe('AVO-2024-0001');
			expect(result.clientId).toBe('1');
			expect(mockPrismaService.avoir.create).toHaveBeenCalled();
		});

		it('devrait rejeter un avoir sans client', async () => {
			const dto: CreateAvoirDto = {
				clientId: '999',
				lines: [
					{
						description: 'Test',
						quantity: 1,
						unitPrice: 100
					}
				]
			};

			mockPrismaService.client.findUnique.mockResolvedValue(null);

			await expect(service.create(dto)).rejects.toThrow(NotFoundException);
		});

		it('devrait rejeter un avoir sans lignes', async () => {
			const dto: CreateAvoirDto = {
				clientId: '1',
				lines: []
			};

			mockPrismaService.client.findUnique.mockResolvedValue({ id: 1 });

			await expect(service.create(dto)).rejects.toThrow(BadRequestException);
		});

		it('devrait annuler la facture si avoir lié couvre 100%', async () => {
			const dto: CreateAvoirDto = {
				clientId: '1',
				invoiceId: 'fac-1',
				status: 'SENT',
				lines: [
					{
						description: 'Annulation facture',
						quantity: 1,
						unitPrice: 100,
						taxRate: 0.2
					}
				]
			};

			mockPrismaService.client.findUnique.mockResolvedValue({ id: '1', name: 'Test Client', organizationId: 1 });
			mockPrismaService.invoice.findUnique.mockResolvedValue({
				id: 'fac-1',
				clientId: '1',
				total: 120,
				status: 'SENT'
			});
			mockPrismaService.counter.upsert.mockResolvedValue({ scope: 'avoir-2024', current: 1 });
			mockPrismaService.taxRate.findFirst.mockResolvedValue({ rate: 0.2 });
			mockPrismaService.avoir.create.mockResolvedValue({
				id: 1,
				number: 'AVO-2024-0001',
				clientId: '1',
				invoiceId: 'fac-1',
				date: new Date(),
				status: 'SENT',
				currency: 'EUR',
				legalMention: null,
				subtotal: 100,
				tax: 20,
				total: 120,
				appliedAmount: 0,
				lines: [],
				client: { id: '1', name: 'Test Client' },
				invoice: { id: 'fac-1' },
				applications: []
			});
			mockPrismaService.avoir.update.mockResolvedValue({ id: 1, accountingEntryId: 1 });
			mockPrismaService.invoice.update.mockResolvedValue({ id: 'fac-1', status: 'CANCELLED', balance: 0 });

			await service.create(dto);

			expect(mockPrismaService.invoice.update).toHaveBeenCalledWith({
				where: { id: 'fac-1' },
				data: expect.objectContaining({
					status: 'CANCELLED',
					balance: 0
				})
			});
		});
	});

	describe('findOne', () => {
		it('devrait retourner un avoir existant', async () => {
			const mockAvoir = {
				id: 1,
				number: 'AVO-2024-0001',
				clientId: '1',
				invoiceId: null,
				subtotal: 100,
				tax: 20,
				total: 120,
				appliedAmount: 0,
				lines: [],
				client: { id: 1 },
				invoice: null,
				applications: []
			};

			mockPrismaService.avoir.findFirst.mockResolvedValue(mockAvoir);

			const result = await service.findOne(1);

			expect(result).toHaveProperty('id', 1);
			expect(result.number).toBe('AVO-2024-0001');
		});

		it('devrait lancer NotFoundException si avoir introuvable', async () => {
			mockPrismaService.avoir.findFirst.mockResolvedValue(null);

			await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
		});
	});

	describe('apply', () => {
		it('devrait imputer un avoir sur une facture', async () => {
			const mockAvoir = {
				id: 1,
				number: 'AVO-2024-0001',
				clientId: '1',
				total: 120,
				appliedAmount: 0,
				status: 'DRAFT',
				applications: [],
				client: { id: 1, name: 'Test Client' },
				lines: []
			};

			const mockInvoice = {
				id: '1',
				clientId: '1',
				total: 200,
				balance: 200,
				status: 'SENT',
			};

			// Mock pour findOne (qui inclut client)
			mockPrismaService.avoir.findFirst.mockImplementation((args: any) => {
				if (args.where.id === 1) {
					return Promise.resolve(mockAvoir);
				}
				return Promise.resolve(null);
			});
			mockPrismaService.invoice.findUnique.mockResolvedValue(mockInvoice);
			mockPrismaService.avoirApplication.create.mockResolvedValue({});
			mockPrismaService.avoirApplication.aggregate.mockResolvedValue({
				_sum: { amount: 50 },
			});
			mockPrismaService.avoir.update.mockResolvedValue({ ...mockAvoir, status: 'SENT', appliedAmount: 50, accountingEntryId: null });
			mockPrismaService.invoice.update.mockResolvedValue({ ...mockInvoice, balance: 150 });

			const result = await service.apply(1, { invoiceId: '1', amount: 50 });

			expect(mockPrismaService.avoirApplication.create).toHaveBeenCalled();
			expect(mockPrismaService.avoir.update).toHaveBeenCalled();
			expect(mockPrismaService.invoice.update).toHaveBeenCalled();
		});

		it('devrait rejeter une imputation supérieure au montant disponible', async () => {
			const mockAvoir = {
				id: 1,
				clientId: '1',
				total: 120,
				appliedAmount: 100,
				status: 'SENT',
				applications: []
			};

			const mockInvoice = {
				id: 1,
				clientId: '1',
				balance: 200
			};

			mockPrismaService.avoir.findFirst.mockResolvedValue(mockAvoir);
			mockPrismaService.invoice.findUnique.mockResolvedValue(mockInvoice);

			await expect(service.apply(1, { invoiceId: '1', amount: 50 })).rejects.toThrow(BadRequestException);
		});

		it('devrait écrêter l’imputation au solde de la facture (pas de solde négatif)', async () => {
			const mockAvoir = {
				id: 1,
				number: 'AVO-2024-0001',
				clientId: '1',
				total: 120,
				appliedAmount: 0,
				status: 'SENT',
				applications: [],
				client: { id: 1, name: 'Test Client' },
				lines: []
			};

			const mockInvoice = {
				id: '1',
				clientId: '1',
				total: 40,
				balance: 40,
				status: 'SENT',
			};

			mockPrismaService.avoir.findFirst.mockResolvedValue(mockAvoir);
			mockPrismaService.invoice.findUnique.mockResolvedValue(mockInvoice);
			mockPrismaService.avoirApplication.create.mockResolvedValue({});
			mockPrismaService.avoirApplication.aggregate.mockResolvedValue({
				_sum: { amount: 40 },
			});
			mockPrismaService.avoir.update.mockResolvedValue({
				...mockAvoir,
				appliedAmount: 40,
				status: 'SENT',
				accountingEntryId: null
			});
			mockPrismaService.invoice.update.mockResolvedValue({
				...mockInvoice,
				balance: 0,
				status: 'PAID'
			});

			await service.apply(1, { invoiceId: '1', amount: 100 });

			expect(mockPrismaService.avoirApplication.create).toHaveBeenCalledWith({
				data: expect.objectContaining({ amount: 40 })
			});
			expect(mockPrismaService.invoice.update).toHaveBeenCalledWith({
				where: { id: '1' },
				data: expect.objectContaining({ balance: 0, status: 'PAID' })
			});
		});
	});

	describe('remove', () => {
		it('devrait supprimer un avoir sans imputations', async () => {
			const mockAvoir = {
				id: 1,
				applications: []
			};

			mockPrismaService.avoir.findFirst.mockResolvedValue(mockAvoir);
			mockPrismaService.avoir.delete.mockResolvedValue({});

			const result = await service.remove(1);

			expect(result.success).toBe(true);
			expect(mockPrismaService.avoir.delete).toHaveBeenCalled();
		});

		it('devrait rejeter la suppression d\'un avoir avec imputations', async () => {
			const mockAvoir = {
				id: 1,
				applications: [{ id: 1 }]
			};

			mockPrismaService.avoir.findFirst.mockResolvedValue(mockAvoir);

			await expect(service.remove(1)).rejects.toThrow(BadRequestException);
		});
	});
});

