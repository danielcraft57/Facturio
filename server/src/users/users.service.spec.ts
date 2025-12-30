import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UsersService', () => {
	let service: UsersService;
	let prisma: PrismaService;

	const mockPrismaService = {
		user: {
			findUnique: jest.fn(),
			update: jest.fn(),
		},
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UsersService,
				{
					provide: PrismaService,
					useValue: mockPrismaService,
				},
			],
		}).compile();

		service = module.get<UsersService>(UsersService);
		prisma = module.get<PrismaService>(PrismaService);

		jest.clearAllMocks();
	});

	describe('getProfile', () => {
		it('devrait retourner le profil utilisateur', async () => {
			const mockUser = {
				id: 1,
				email: 'test@example.com',
				firstName: 'John',
				lastName: 'Doe',
				organization: { id: 1, name: 'Test Org' },
			};

			mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

			const result = await service.getProfile(1);

			expect(result).toHaveProperty('id', 1);
			expect(result.email).toBe('test@example.com');
		});

		it('devrait lancer NotFoundException si utilisateur introuvable', async () => {
			mockPrismaService.user.findUnique.mockResolvedValue(null);

			await expect(service.getProfile(999)).rejects.toThrow(NotFoundException);
		});
	});

	describe('changePassword', () => {
		it('devrait changer le mot de passe', async () => {
			const mockUser = {
				id: 1,
				password: 'old-hashed-password',
			};

			mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
			(bcrypt.compare as jest.Mock).mockResolvedValue(true);
			(bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
			mockPrismaService.user.update.mockResolvedValue({});

			const result = await service.changePassword(1, 'old-password', 'new-password');

			expect(result.success).toBe(true);
			expect(mockPrismaService.user.update).toHaveBeenCalled();
		});

		it('devrait rejeter un ancien mot de passe incorrect', async () => {
			const mockUser = {
				id: 1,
				password: 'old-hashed-password',
			};

			mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
			(bcrypt.compare as jest.Mock).mockResolvedValue(false);

			await expect(service.changePassword(1, 'wrong-password', 'new-password')).rejects.toThrow(
				BadRequestException,
			);
		});
	});
});

