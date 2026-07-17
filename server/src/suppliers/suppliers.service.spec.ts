import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Tests essentiels référentiel fournisseurs.
 */
describe('SuppliersService', () => {
	const prisma = {
		supplier: {
			findMany: jest.fn(),
			findFirst: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
		},
		payableCreditor: {
			findFirst: jest.fn(),
			create: jest.fn(),
		},
	};

	let service: SuppliersService;

	beforeEach(() => {
		jest.clearAllMocks();
		service = new SuppliersService(prisma as unknown as PrismaService);
	});

	it('refuse sans organisation', async () => {
		await expect(service.findAll(undefined)).rejects.toBeInstanceOf(BadRequestException);
	});

	it('crée un fournisseur', async () => {
		prisma.supplier.create.mockResolvedValue({
			id: 1,
			organizationId: 7,
			name: 'OVH',
			paymentTermsDays: 30,
			isActive: true,
		});

		const result = await service.create(7, { name: 'OVH', siret: '42476141900045' });

		expect(prisma.supplier.create).toHaveBeenCalledWith({
			data: expect.objectContaining({
				organizationId: 7,
				name: 'OVH',
				siret: '42476141900045',
			}),
		});
		expect(result.name).toBe('OVH');
	});

	it('linkAsCreditor réutilise un créancier existant', async () => {
		prisma.supplier.findFirst.mockResolvedValue({
			id: 3,
			name: 'OVH',
			email: null,
			notes: null,
			creditors: [],
		});
		prisma.payableCreditor.findFirst.mockResolvedValue({ id: 9, name: 'OVH' });

		const result = await service.linkAsCreditor(7, 3);

		expect(prisma.payableCreditor.create).not.toHaveBeenCalled();
		expect(result.id).toBe(9);
	});

	it('findOne lève NotFoundException', async () => {
		prisma.supplier.findFirst.mockResolvedValue(null);
		await expect(service.findOne(7, 99)).rejects.toBeInstanceOf(NotFoundException);
	});
});
