import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsService } from './organizations.service';
import { PrismaService } from '../prisma/prisma.service';
import { SecretsCryptoService } from '../crypto/secrets-crypto.service';
import { NotFoundException } from '@nestjs/common';

describe('OrganizationsService', () => {
	let service: OrganizationsService;
	let prisma: PrismaService;

	const mockPrismaService = {
		organization: {
			findUnique: jest.fn(),
			update: jest.fn(),
		},
	};

	const mockSecretsCryptoService = {
		encrypt: jest.fn((value: string) => value),
		decrypt: jest.fn((value: string) => value),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				OrganizationsService,
				{
					provide: PrismaService,
					useValue: mockPrismaService,
				},
				{
					provide: SecretsCryptoService,
					useValue: mockSecretsCryptoService,
				},
			],
		}).compile();

		service = module.get<OrganizationsService>(OrganizationsService);
		prisma = module.get<PrismaService>(PrismaService);

		jest.clearAllMocks();
	});

	describe('getProfile', () => {
		it('devrait retourner le profil organisation', async () => {
			const mockOrg = {
				id: 1,
				name: 'Test Organization',
				legalName: 'Test Organization SAS',
				siret: '12345678901234',
				documents: [],
			};

			mockPrismaService.organization.findUnique.mockResolvedValue(mockOrg);

			const result = await service.getProfile(1);

			expect(result).toHaveProperty('id', 1);
			expect(result.name).toBe('Test Organization');
		});

		it('devrait lancer NotFoundException si organisation introuvable', async () => {
			mockPrismaService.organization.findUnique.mockResolvedValue(null);

			await expect(service.getProfile(999)).rejects.toThrow(NotFoundException);
		});
	});
});

