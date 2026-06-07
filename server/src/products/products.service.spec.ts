import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { CatalogPersonalizationService } from '../catalog/catalog-personalization.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import { NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { ListQueryDto } from '../common/dto/list-query.dto';

describe('ProductsService', () => {
	let service: ProductsService;
	let prisma: PrismaService;

	const mockPrismaService = {
		product: {
			create: jest.fn(),
			findMany: jest.fn(),
			findFirst: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			count: jest.fn(),
		},
		client: {
			findFirst: jest.fn(),
		},
		$transaction: jest.fn(),
	};

	const mockCatalogPersonalization = {
		getOrganizationCatalogProductIds: jest.fn().mockResolvedValue([]),
		getClientCatalogProductIds: jest.fn().mockResolvedValue([]),
	};

	const mockRealtime = {
		emit: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ProductsService,
				{
					provide: PrismaService,
					useValue: mockPrismaService,
				},
				{
					provide: CatalogPersonalizationService,
					useValue: mockCatalogPersonalization,
				},
				{
					provide: RealtimeEventsService,
					useValue: mockRealtime,
				},
			],
		}).compile();

		service = module.get<ProductsService>(ProductsService);
		prisma = module.get<PrismaService>(PrismaService);

		jest.clearAllMocks();
	});

	describe('create', () => {
		it('devrait créer un produit', async () => {
			const dto: CreateProductDto = {
				name: 'Test Product',
				sku: 'TEST-001',
				unitPrice: 100
			};

			const expected = {
				id: 1,
				name: dto.name,
				sku: dto.sku,
				unitPrice: dto.unitPrice,
				visualType: 'icon',
				iconName: 'rocket',
				createdAt: new Date(),
				updatedAt: new Date(),
				defaultTaxRate: null,
			};

			mockPrismaService.product.create.mockResolvedValue(expected);

			const result = await service.create(
				{ ...dto, iconName: 'rocket', visualType: 'icon' },
				2,
			);

			expect(result).toEqual(expected);
			expect(mockPrismaService.product.create).toHaveBeenCalledWith({
				data: expect.objectContaining({
					name: dto.name,
					sku: dto.sku,
					unitPrice: dto.unitPrice,
					visualType: 'icon',
					iconName: 'rocket',
					imageData: expect.stringMatching(/^icon-gradient:/),
					organizationId: 2,
				}),
				include: { defaultTaxRate: true },
			});
			expect(mockRealtime.emit).toHaveBeenCalledWith(2, 'products', 'created', '1', {
				number: dto.name,
			});
		});

		it('assigne un visuel aléatoire si rien n\'est fourni', async () => {
			mockPrismaService.product.create.mockImplementation(({ data }) =>
				Promise.resolve({
					id: 2,
					...data,
					defaultTaxRate: null,
				}),
			);

			await service.create({ name: 'Sans visuel' });

			const call = mockPrismaService.product.create.mock.calls[0][0];
			expect(['icon', 'library']).toContain(call.data.visualType);
			if (call.data.visualType === 'icon') {
				expect(call.data.iconName).toBeTruthy();
				expect(call.data.imageData).toMatch(/^icon-gradient:/);
			} else {
				expect(call.data.imageData).toMatch(/^library:/);
			}
		});
	});

	describe('findAll', () => {
		it('devrait retourner tous les produits sans pagination', async () => {
			const products = [
				{ id: 1, name: 'Product 1', createdAt: new Date() },
				{ id: 2, name: 'Product 2', createdAt: new Date() }
			];

			mockPrismaService.$transaction.mockResolvedValue([
				products.map(p => ({ ...p, defaultTaxRate: null })),
				2
			]);

			const result = await service.findAll();

			expect(result.items).toHaveLength(2);
			expect(result.total).toBe(2);
			expect(result.page).toBe(1);
			expect(result.pageSize).toBe(20);
		});

		it('devrait paginer les résultats', async () => {
			const query: ListQueryDto = {
				page: 2,
				pageSize: 10
			};

			const products = Array(10).fill(null).map((_, i) => ({
				id: i + 11,
				name: `Product ${i + 11}`,
				createdAt: new Date()
			}));

			mockPrismaService.$transaction.mockResolvedValue([
				products.map(p => ({ ...p, defaultTaxRate: null })),
				25
			]);

			const result = await service.findAll(query);

			expect(result.items).toHaveLength(10);
			expect(result.total).toBe(25);
			expect(result.page).toBe(2);
			expect(result.pageSize).toBe(10);
			expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					skip: 10,
					take: 10
				})
			);
		});

		it('devrait rechercher par nom ou SKU', async () => {
			const query: ListQueryDto = {
				search: 'test'
			};

			const products = [
				{ id: 1, name: 'Test Product', sku: 'TEST-001', createdAt: new Date() }
			];

			mockPrismaService.$transaction.mockResolvedValue([
				products.map(p => ({ ...p, defaultTaxRate: null })),
				1
			]);

			const result = await service.findAll(query);

			expect(result.items).toHaveLength(1);
			expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						organizationId: null,
						OR: [
							{ name: { contains: 'test' } },
							{ sku: { contains: 'test' } },
							{ description: { contains: 'test' } },
						],
					}),
				}),
			);
		});

		it('devrait trier par champ spécifié', async () => {
			const query: ListQueryDto = {
				sortBy: 'name',
				order: 'asc'
			};

			mockPrismaService.$transaction.mockResolvedValue([[], 0]);

			await service.findAll(query);

			expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					orderBy: { name: 'asc' }
				})
			);
		});
	});

	describe('findOrCreateBySku', () => {
		it('retourne le produit existant sans créer', async () => {
			const existing = {
				id: 5,
				sku: 'SKU-1',
				name: 'Existant',
				unitPrice: 100,
				defaultTaxRate: null,
			};
			mockPrismaService.product.findFirst.mockResolvedValue(existing);

			const result = await service.findOrCreateBySku('SKU-1', 11, {
				name: 'Neuf',
				unitPrice: 200,
			});

			expect(result).toEqual(existing);
			expect(mockPrismaService.product.create).not.toHaveBeenCalled();
		});

		it('crée le produit si le SKU est inconnu', async () => {
			mockPrismaService.product.findFirst.mockResolvedValue(null);
			mockPrismaService.product.create.mockResolvedValue({
				id: 6,
				sku: 'SKU-NEW',
				name: 'Neuf',
				unitPrice: 200,
				visualType: 'icon',
				iconName: 'box',
				defaultTaxRate: null,
			});

			const result = await service.findOrCreateBySku('SKU-NEW', 11, {
				name: 'Neuf',
				unitPrice: 200,
			});

			expect(result.id).toBe(6);
			expect(mockPrismaService.product.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						sku: 'SKU-NEW',
						name: 'Neuf',
						organizationId: 11,
					}),
				}),
			);
		});
	});

	describe('findOne', () => {
		it('devrait retourner un produit existant', async () => {
			const product = {
				id: 1,
				name: 'Test Product',
				defaultTaxRate: null
			};

			mockPrismaService.product.findFirst.mockResolvedValue(product);

			const result = await service.findOne(1);

			expect(result).toEqual(product);
			expect(mockPrismaService.product.findFirst).toHaveBeenCalledWith({
				where: { id: 1, organizationId: null },
				include: { defaultTaxRate: true },
			});
		});

		it('devrait lancer NotFoundException si le produit n\'existe pas', async () => {
			mockPrismaService.product.findFirst.mockResolvedValue(null);

			await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
		});
	});

	describe('update', () => {
		it('devrait mettre à jour un produit existant', async () => {
			const existing = {
				id: 1,
				name: 'Old Name',
				defaultTaxRate: null
			};

			const updateDto = {
				name: 'New Name'
			};

			const updated = {
				...existing,
				...updateDto,
				defaultTaxRate: null
			};

			mockPrismaService.product.findFirst.mockResolvedValue(existing);
			mockPrismaService.product.update.mockResolvedValue(updated);

			const result = await service.update(1, updateDto);

			expect(result).toEqual(updated);
			expect(mockPrismaService.product.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: updateDto,
				include: { defaultTaxRate: true }
			});
		});
	});

	describe('remove', () => {
		it('devrait supprimer un produit existant', async () => {
			const product = {
				id: 1,
				name: 'Test Product',
				defaultTaxRate: null
			};

			mockPrismaService.product.findFirst.mockResolvedValue(product);
			mockPrismaService.product.delete.mockResolvedValue(product);

			const result = await service.remove(1);

			expect(result).toEqual({ success: true });
			expect(mockPrismaService.product.delete).toHaveBeenCalledWith({
				where: { id: 1 }
			});
		});
	});
});

