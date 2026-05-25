import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface TestUser {
	id: number;
	email: string;
	organizationId: number;
	cookies: string[];
	token: string;
}

/** Active un compte PENDING après inscription (flux vérification email en e2e). */
export async function activatePendingUser(prisma: PrismaService, email: string): Promise<void> {
	await prisma.user.update({
		where: { email },
		data: {
			status: 'ACTIVE',
			emailVerified: true,
			emailVerifiedAt: new Date(),
			emailVerificationToken: null,
			emailVerificationExpires: null,
		},
	});
}

function parseCookies(setCookies: string[] | string | undefined): string[] {
	if (!setCookies) return [];
	return Array.isArray(setCookies) ? setCookies : [setCookies];
}

/**
 * Crée un utilisateur de test avec organisation et retourne les cookies d'authentification.
 * Gère le flux inscription + vérification email (activation manuelle en test puis login).
 */
export async function createTestUser(
	app: INestApplication,
	prisma: PrismaService,
	overrides?: {
		email?: string;
		password?: string;
		firstName?: string;
		lastName?: string;
		organizationName?: string;
		technologyIds?: string[];
	}
): Promise<TestUser> {
	const email = overrides?.email || `test-${Date.now()}@example.com`;
	const password = overrides?.password || 'password123';
	const organizationName = overrides?.organizationName || `Test Org ${Date.now()}`;
	const httpServer = app.getHttpServer();

	const signupRes = await (request as any)(httpServer)
		.post('/api/auth/signup')
		.send({
			email,
			password,
			firstName: overrides?.firstName || 'Test',
			lastName: overrides?.lastName || 'User',
			organizationName,
			acceptTerms: true,
			acceptPrivacy: true,
			...(overrides?.technologyIds?.length
				? { technologyIds: overrides.technologyIds }
				: {}),
		})
		.expect(201);

	// Inscription renvoie un JWT même si l'email n'est pas vérifié (emailVerificationPending).
	// Les e2e doivent activer le compte pour passer EmailVerifiedGuard.
	await activatePendingUser(prisma, email);

	let cookies = parseCookies(signupRes.headers['set-cookie']);
	let token: string | undefined = signupRes.body?.access_token;

	if (!token) {
		const loginRes = await (request as any)(httpServer)
			.post('/api/auth/login')
			.send({ email, password })
			.expect(201);

		cookies = parseCookies(loginRes.headers['set-cookie']);
		token = loginRes.body.access_token;
	}

	const user = await prisma.user.findUnique({
		where: { email },
		include: { organization: true },
	});

	if (user?.organizationId) {
		await prisma.organization.update({
			where: { id: user.organizationId },
			data: { onboardingCompletedAt: new Date() },
		});
	}

	if (!user) {
		throw new Error('Utilisateur non créé');
	}

	if (!token) {
		throw new Error('Token JWT manquant après inscription/login test');
	}

	return {
		id: user.id,
		email: user.email,
		organizationId: user.organizationId,
		cookies,
		token,
	};
}

/**
 * Crée une requête authentifiée avec cookies
 * Utilise request.agent() pour maintenir les cookies entre les requêtes
 */
export function authenticatedRequest(
	app: INestApplication,
	cookies: string[]
): any {
	const cookieString = Array.isArray(cookies) ? cookies.join('; ') : cookies;
	const httpServer = app.getHttpServer();
	const agent = (request as any).agent(httpServer);
	agent.set('Cookie', cookieString);
	return agent;
}
