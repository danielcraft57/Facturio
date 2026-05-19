import { Test, TestingModule } from '@nestjs/testing';
import { ProspectsService } from './prospects.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { CreateProspectDto } from './dto/create-prospect.dto';
import { ListQueryDto } from '../common/dto/list-query.dto';

describe('ProspectsService', () => {
	let service: ProspectsService;
	let prisma: PrismaService;

	const createMockProspect = (overrides: any = {}) => ({
		id: 1,
		companyName: 'Test Company',
		industry: 'SaaS',
		size: 'STARTUP',
		country: 'France',
		status: 'NEW',
		sourceType: 'DIRECT',
		priority: 'MEDIUM',
		score: 50,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides
	});

	const mockPrismaService = {
		prospect: {
			create: jest.fn(),
			findMany: jest.fn(),
			findFirst: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			count: jest.fn()
		},
		$transaction: jest.fn()
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ProspectsService,
				{
					provide: PrismaService,
					useValue: mockPrismaService
				}
			]
		}).compile();

		service = module.get<ProspectsService>(ProspectsService);
		prisma = module.get<PrismaService>(PrismaService);

		jest.clearAllMocks();
	});

	describe('create', () => {
		it('devrait créer un prospect', async () => {
			const dto: CreateProspectDto = {
				companyName: 'Test Company',
				industry: 'SaaS',
				size: 'STARTUP',
				country: 'France',
				email: 'test@example.com'
			};

			const expected = createMockProspect({
				companyName: dto.companyName,
				industry: dto.industry,
				email: dto.email
			});

			mockPrismaService.prospect.create.mockResolvedValue(expected);

			const result = await service.create(dto);

			expect(result).toBeDefined();
			expect(mockPrismaService.prospect.create).toHaveBeenCalled();
		});

		it('devrait créer un prospect avec decisionMaker', async () => {
			const dto: CreateProspectDto = {
				companyName: 'Test Company',
				industry: 'SaaS',
				size: 'STARTUP',
				country: 'France',
				decisionMaker: {
					name: 'John Doe',
					email: 'john@example.com',
					position: 'CEO'
				}
			};

			mockPrismaService.prospect.create.mockResolvedValue(createMockProspect());

			await service.create(dto);

			expect(mockPrismaService.prospect.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						decisionMakerName: 'John Doe',
						decisionMakerEmail: 'john@example.com'
					})
				})
			);
		});
	});

	describe('findAll', () => {
		it('devrait retourner tous les prospects avec pagination', async () => {
			const prospects = [
				createMockProspect({ id: 1, companyName: 'Company 1' }),
				createMockProspect({ id: 2, companyName: 'Company 2', size: 'SME' })
			];

			mockPrismaService.$transaction.mockResolvedValue([prospects, 2]);

			const result = await service.findAll(new ListQueryDto());

			expect(result.data).toHaveLength(2);
			expect(result.total).toBe(2);
			expect(result.page).toBe(1);
		});

		it('devrait rechercher par companyName, industry ou email', async () => {
			const query: ListQueryDto = {
				search: 'test'
			};

			mockPrismaService.$transaction.mockResolvedValue([[], 0]);

			await service.findAll(query);

			expect(mockPrismaService.prospect.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: {
						OR: [
							{ companyName: { contains: 'test' } },
							{ industry: { contains: 'test' } },
							{ email: { contains: 'test' } }
						]
					}
				})
			);
		});
	});

	describe('findOne', () => {
		it('devrait retourner un prospect existant', async () => {
			const prospect = createMockProspect();

			mockPrismaService.prospect.findFirst.mockResolvedValue(prospect);

			const result = await service.findOne(1);

			expect(result).toBeDefined();
			expect(mockPrismaService.prospect.findFirst).toHaveBeenCalledWith({
				where: { id: 1 }
			});
		});

		it('devrait lancer NotFoundException si le prospect n\'existe pas', async () => {
			mockPrismaService.prospect.findFirst.mockResolvedValue(null);

			await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
		});
	});

	describe('update', () => {
		it('devrait mettre à jour un prospect existant', async () => {
			const existing = createMockProspect({ companyName: 'Old Name' });

			const updateDto = {
				companyName: 'New Name'
			};

			mockPrismaService.prospect.findFirst.mockResolvedValue(existing);
			mockPrismaService.prospect.update.mockResolvedValue({
				...existing,
				...updateDto
			});

			const result = await service.update(1, updateDto);

			expect(result).toBeDefined();
			expect(mockPrismaService.prospect.update).toHaveBeenCalled();
		});
	});

	describe('remove', () => {
		it('devrait supprimer un prospect existant', async () => {
			const prospect = createMockProspect();

			mockPrismaService.prospect.findFirst.mockResolvedValue(prospect);
			mockPrismaService.prospect.delete.mockResolvedValue(prospect);

			const result = await service.remove(1);

			expect(result).toEqual({ success: true });
			expect(mockPrismaService.prospect.findFirst).toHaveBeenCalledWith({
				where: { id: 1 }
			});
			expect(mockPrismaService.prospect.delete).toHaveBeenCalledWith({
				where: { id: 1 }
			});
		});
	});
});

