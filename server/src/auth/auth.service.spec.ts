import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { AuthSessionService } from './auth-session.service';
import { UnverifiedAccountService } from '../common/unverified-account.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../common/email.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
	let service: AuthService;
	let prisma: PrismaService;
	let jwtService: JwtService;

	const mockPrismaService = {
		user: {
			findUnique: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
		},
		organization: {
			create: jest.fn(),
		},
	};

	const mockJwtService = {
		sign: jest.fn(),
	};

	const mockEmailService = {
		sendVerifyEmail: jest.fn().mockResolvedValue(undefined),
	};

	const mockAuthSessionService = {
		createLoginSession: jest.fn().mockResolvedValue({ sessionId: 1, needDeviceVerification: false }),
		verifyDeviceToken: jest.fn(),
		assertSessionActive: jest.fn(),
		revokeSession: jest.fn(),
	};

	const mockUnverifiedAccountService = {
		deleteUnverifiedUser: jest.fn().mockResolvedValue(true),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthService,
				{
					provide: PrismaService,
					useValue: mockPrismaService,
				},
				{
					provide: JwtService,
					useValue: mockJwtService,
				},
				{
					provide: EmailService,
					useValue: mockEmailService,
				},
				{
					provide: AuthSessionService,
					useValue: mockAuthSessionService,
				},
				{
					provide: UnverifiedAccountService,
					useValue: mockUnverifiedAccountService,
				},
			],
		}).compile();

		service = module.get<AuthService>(AuthService);
		prisma = module.get<PrismaService>(PrismaService);
		jwtService = module.get<JwtService>(JwtService);

		jest.clearAllMocks();
	});

	describe('signup', () => {
		it('devrait créer un nouvel utilisateur et organisation', async () => {
			const signupDto = {
				acceptTerms: true,
				acceptPrivacy: true,
				email: 'test@example.com',
				password: 'password123',
				firstName: 'John',
				lastName: 'Doe',
				organizationName: 'Test Org',
			};

			mockPrismaService.user.findUnique.mockResolvedValue(null);
			(bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
			mockPrismaService.organization.create.mockResolvedValue({ id: 1, name: 'Test Org' });
			mockPrismaService.user.create.mockResolvedValue({
				id: 1,
				email: 'test@example.com',
				firstName: 'John',
				lastName: 'Doe',
				organizationId: 1,
				emailVerified: false,
				organization: { id: 1, name: 'Test Org' },
			});
			mockJwtService.sign.mockReturnValue('jwt-token');

			const result = await service.signup(signupDto);

			expect(result).toHaveProperty('access_token', 'jwt-token');
			expect(result).toHaveProperty('emailVerificationPending', true);
			expect(mockEmailService.sendVerifyEmail).toHaveBeenCalled();
			expect(mockPrismaService.organization.create).toHaveBeenCalled();
			expect(mockPrismaService.user.create).toHaveBeenCalled();
		});

		it('devrait rejeter un email déjà utilisé', async () => {
			const signupDto = {
				acceptTerms: true,
				acceptPrivacy: true,
				email: 'existing@example.com',
				password: 'password123',
				organizationName: 'Test Org',
			};

			mockPrismaService.user.findUnique.mockResolvedValue({ id: 1, email: 'existing@example.com' });

			await expect(service.signup(signupDto)).rejects.toThrow(ConflictException);
		});
	});

	describe('login', () => {
		it('devrait connecter un utilisateur valide', async () => {
			const loginDto = {
				email: 'test@example.com',
				password: 'password123',
			};

			const mockUser = {
				id: 1,
				email: 'test@example.com',
				password: 'hashed-password',
				status: 'ACTIVE',
				emailVerified: true,
				organizationId: 1,
				organization: { id: 1, name: 'Test Org' },
			};

			mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
			(bcrypt.compare as jest.Mock).mockResolvedValue(true);
			mockPrismaService.user.update.mockResolvedValue({ ...mockUser, lastLoginAt: new Date() });
			mockJwtService.sign.mockReturnValue('jwt-token');

			const result = await service.login(loginDto);

			expect(result).toHaveProperty('access_token');
			expect(result).toHaveProperty('user');
		});

		it('devrait rejeter un mot de passe incorrect', async () => {
			const loginDto = {
				email: 'test@example.com',
				password: 'wrong-password',
			};

			mockPrismaService.user.findUnique.mockResolvedValue({
				id: 1,
				email: 'test@example.com',
				password: 'hashed-password',
				status: 'ACTIVE',
			});
			(bcrypt.compare as jest.Mock).mockResolvedValue(false);

			await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
		});
	});
});

