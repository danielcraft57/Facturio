import { Test, TestingModule } from '@nestjs/testing';
import { PacksService } from './packs.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { CreatePackDto } from './dto/create-pack.dto';
import { ListQueryDto } from '../common/dto/list-query.dto';

describe('PacksService', () => {
	let service: PacksService;
	let prisma: PrismaService;

	const createMockPack = (overrides: any = {}) => ({
		id: 1,
		name: 'Test Pack',
		type: 'BASIC',
		description: 'Test Description',
		details: 'Test Details',
		products: JSON.stringify(['1', '2']),
		totalHours: 2,
		totalPrice: 100,
		features: null,
		deliveryTime: 30,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides
	});

	const mockPrismaService = {
		pack: {
			create: jest.fn(),
			findMany: jest.fn(),
			findUnique: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			count: jest.fn()
		},
		product: {
			findMany: jest.fn()
		},
		$transaction: jest.fn()
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				PacksService,
				{
					provide: PrismaService,
					useValue: mockPrismaService
				}
			]
		}).compile();

		service = module.get<PacksService>(PacksService);
		prisma = module.get<PrismaService>(PrismaService);

		jest.clearAllMocks();
	});

	describe('create', () => {
		it('devrait créer un pack', async () => {
			const dto: CreatePackDto = {
				name: 'Test Pack',
				type: 'BASIC',
				description: 'Description',
				details: 'Details',
				products: ['1', '2']
			};

			const mockProducts = [
				{ id: 1, unitPrice: 50 },
				{ id: 2, unitPrice: 50 }
			];

			mockPrismaService.product.findMany.mockResolvedValue(mockProducts);
			mockPrismaService.pack.create.mockResolvedValue(createMockPack());

			const result = await service.create(dto);

			expect(result).toBeDefined();
			expect(mockPrismaService.pack.create).toHaveBeenCalled();
		});

		it('devrait calculer totalHours et totalPrice depuis les produits', async () => {
			const dto: CreatePackDto = {
				name: 'Test Pack',
				type: 'BASIC',
				description: 'Description',
				details: 'Details',
				products: ['1', '2']
			};

			const mockProducts = [
				{ id: 1, unitPrice: 50 },
				{ id: 2, unitPrice: 75 }
			];

			mockPrismaService.product.findMany.mockResolvedValue(mockProducts);
			mockPrismaService.pack.create.mockResolvedValue(createMockPack());

			await service.create(dto);

			expect(mockPrismaService.pack.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						totalHours: 2,
						totalPrice: 125
					})
				})
			);
		});
	});

	describe('findAll', () => {
		it('devrait retourner tous les packs avec pagination', async () => {
			const packs = [
				createMockPack({ id: 1, name: 'Pack 1' }),
				createMockPack({ id: 2, name: 'Pack 2' })
			];

			mockPrismaService.$transaction.mockResolvedValue([packs, 2]);

			const result = await service.findAll(new ListQueryDto());

			expect(result.packs).toHaveLength(2);
			expect(result.total).toBe(2);
			expect(result.page).toBe(1);
		});

		it('devrait rechercher par name ou description', async () => {
			const query: ListQueryDto = {
				search: 'test'
			};

			mockPrismaService.$transaction.mockResolvedValue([[], 0]);

			await service.findAll(query);

			expect(mockPrismaService.pack.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: {
						OR: [
							{ name: { contains: 'test' } },
							{ description: { contains: 'test' } }
						]
					}
				})
			);
		});
	});

	describe('findOne', () => {
		it('devrait retourner un pack existant', async () => {
			const pack = createMockPack();

			mockPrismaService.pack.findUnique.mockResolvedValue(pack);

			const result = await service.findOne(1);

			expect(result).toBeDefined();
			expect(mockPrismaService.pack.findUnique).toHaveBeenCalledWith({
				where: { id: 1 }
			});
		});

		it('devrait lancer NotFoundException si le pack n\'existe pas', async () => {
			mockPrismaService.pack.findUnique.mockResolvedValue(null);

			await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
		});
	});

	describe('update', () => {
		it('devrait mettre à jour un pack existant', async () => {
			const existing = createMockPack();
			const updateDto = {
				name: 'New Name'
			};

			mockPrismaService.pack.findUnique.mockResolvedValue(existing);
			mockPrismaService.pack.update.mockResolvedValue({
				...existing,
				...updateDto
			});

			const result = await service.update(1, updateDto);

			expect(result).toBeDefined();
			expect(mockPrismaService.pack.update).toHaveBeenCalled();
		});

		it('devrait recalculer totalHours et totalPrice si products changent', async () => {
			const existing = createMockPack();
			const updateDto = {
				products: ['1', '2', '3']
			};

			const mockProducts = [
				{ id: 1, unitPrice: 50 },
				{ id: 2, unitPrice: 50 },
				{ id: 3, unitPrice: 50 }
			];

			mockPrismaService.pack.findUnique.mockResolvedValue(existing);
			mockPrismaService.product.findMany.mockResolvedValue(mockProducts);
			mockPrismaService.pack.update.mockResolvedValue(existing);

			await service.update(1, updateDto);

			expect(mockPrismaService.pack.update).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						totalHours: 3,
						totalPrice: 150
					})
				})
			);
		});
	});

	describe('remove', () => {
		it('devrait supprimer un pack existant', async () => {
			const pack = createMockPack();

			mockPrismaService.pack.findUnique.mockResolvedValue(pack);
			mockPrismaService.pack.delete.mockResolvedValue(pack);

			const result = await service.remove(1);

			expect(result).toEqual({ success: true });
			expect(mockPrismaService.pack.findUnique).toHaveBeenCalledWith({
				where: { id: 1 }
			});
			expect(mockPrismaService.pack.delete).toHaveBeenCalledWith({
				where: { id: 1 }
			});
		});
	});
});

