import { Test, TestingModule } from '@nestjs/testing';
import { CreditNotesService } from './credit-notes.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateCreditNoteDto } from './dto/create-credit-note.dto';

describe('CreditNotesService', () => {
	let service: CreditNotesService;
	let prisma: PrismaService;

	const mockPrismaService = {
		creditNote: {
			create: jest.fn(),
			findMany: jest.fn(),
			findUnique: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			count: jest.fn()
		},
		creditNoteApplication: {
			create: jest.fn()
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

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				CreditNotesService,
				{
					provide: PrismaService,
					useValue: mockPrismaService
				}
			]
		}).compile();

		service = module.get<CreditNotesService>(CreditNotesService);
		prisma = module.get<PrismaService>(PrismaService);

		jest.clearAllMocks();
	});

	describe('create', () => {
		it('devrait créer un avoir', async () => {
			const dto: CreateCreditNoteDto = {
				clientId: 1,
				lines: [
					{
						description: 'Remboursement',
						quantity: 1,
						unitPrice: 100,
						taxRate: 0.2
					}
				]
			};

			mockPrismaService.client.findUnique.mockResolvedValue({ id: 1, name: 'Test Client' });
			mockPrismaService.counter.upsert.mockResolvedValue({ scope: 'credit-note-2024', current: 1 });
			mockPrismaService.taxRate.findFirst.mockResolvedValue({ rate: 0.2 });
			mockPrismaService.creditNote.create.mockResolvedValue({
				id: 1,
				number: 'AVO-2024-0001',
				clientId: 1,
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
			expect(result.clientId).toBe(1);
			expect(mockPrismaService.creditNote.create).toHaveBeenCalled();
		});

		it('devrait rejeter un avoir sans client', async () => {
			const dto: CreateCreditNoteDto = {
				clientId: 999,
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
			const dto: CreateCreditNoteDto = {
				clientId: 1,
				lines: []
			};

			mockPrismaService.client.findUnique.mockResolvedValue({ id: 1 });

			await expect(service.create(dto)).rejects.toThrow(BadRequestException);
		});
	});

	describe('findOne', () => {
		it('devrait retourner un avoir existant', async () => {
			const mockCreditNote = {
				id: 1,
				number: 'AVO-2024-0001',
				clientId: 1,
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

			mockPrismaService.creditNote.findUnique.mockResolvedValue(mockCreditNote);

			const result = await service.findOne(1);

			expect(result).toHaveProperty('id', 1);
			expect(result.number).toBe('AVO-2024-0001');
		});

		it('devrait lancer NotFoundException si avoir introuvable', async () => {
			mockPrismaService.creditNote.findUnique.mockResolvedValue(null);

			await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
		});
	});

	describe('apply', () => {
		it('devrait imputer un avoir sur une facture', async () => {
			const mockCreditNote = {
				id: 1,
				number: 'AVO-2024-0001',
				clientId: 1,
				total: 120,
				appliedAmount: 0,
				status: 'DRAFT',
				applications: []
			};

			const mockInvoice = {
				id: 1,
				clientId: 1,
				balance: 200,
				status: 'SENT'
			};

			mockPrismaService.creditNote.findUnique.mockResolvedValue(mockCreditNote);
			mockPrismaService.invoice.findUnique.mockResolvedValue(mockInvoice);
			mockPrismaService.creditNoteApplication.create.mockResolvedValue({});
			mockPrismaService.creditNote.update.mockResolvedValue({ ...mockCreditNote, status: 'SENT', appliedAmount: 50 });
			mockPrismaService.invoice.update.mockResolvedValue({ ...mockInvoice, balance: 150 });

			const result = await service.apply(1, { invoiceId: 1, amount: 50 });

			expect(mockPrismaService.creditNoteApplication.create).toHaveBeenCalled();
			expect(mockPrismaService.creditNote.update).toHaveBeenCalled();
			expect(mockPrismaService.invoice.update).toHaveBeenCalled();
		});

		it('devrait rejeter une imputation supérieure au montant disponible', async () => {
			const mockCreditNote = {
				id: 1,
				clientId: 1,
				total: 120,
				appliedAmount: 100,
				status: 'SENT',
				applications: []
			};

			const mockInvoice = {
				id: 1,
				clientId: 1,
				balance: 200
			};

			mockPrismaService.creditNote.findUnique.mockResolvedValue(mockCreditNote);
			mockPrismaService.invoice.findUnique.mockResolvedValue(mockInvoice);

			await expect(service.apply(1, { invoiceId: 1, amount: 50 })).rejects.toThrow(BadRequestException);
		});
	});

	describe('remove', () => {
		it('devrait supprimer un avoir sans imputations', async () => {
			const mockCreditNote = {
				id: 1,
				applications: []
			};

			mockPrismaService.creditNote.findUnique.mockResolvedValue(mockCreditNote);
			mockPrismaService.creditNote.delete.mockResolvedValue({});

			const result = await service.remove(1);

			expect(result.success).toBe(true);
			expect(mockPrismaService.creditNote.delete).toHaveBeenCalled();
		});

		it('devrait rejeter la suppression d\'un avoir avec imputations', async () => {
			const mockCreditNote = {
				id: 1,
				applications: [{ id: 1 }]
			};

			mockPrismaService.creditNote.findUnique.mockResolvedValue(mockCreditNote);

			await expect(service.remove(1)).rejects.toThrow(BadRequestException);
		});
	});
});

