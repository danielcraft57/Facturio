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

/**
 * Crée un utilisateur de test avec organisation et retourne les cookies d'authentification
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
	}
): Promise<TestUser> {
	const email = overrides?.email || `test-${Date.now()}@example.com`;
	const password = overrides?.password || 'password123';
	const organizationName = overrides?.organizationName || `Test Org ${Date.now()}`;

	const response = await (request as any)(app.getHttpServer())
		.post('/api/auth/signup')
		.send({
			email,
			password,
			firstName: overrides?.firstName || 'Test',
			lastName: overrides?.lastName || 'User',
			organizationName,
		})
		.expect(201);

	const setCookies = response.headers['set-cookie'] as string[] | string | undefined;
	const cookies = Array.isArray(setCookies) ? setCookies : setCookies ? [setCookies] : [];
	const token = response.body.access_token;

	// Récupérer l'utilisateur depuis la base pour avoir l'ID
	const user = await prisma.user.findUnique({
		where: { email },
		include: { organization: true },
	});

	if (!user) {
		throw new Error('Utilisateur non créé');
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
	// Utiliser request.agent() pour créer un agent qui maintient les cookies
	const agent = (request as any).agent(httpServer);
	// Définir les cookies manuellement
	agent.set('Cookie', cookieString);
	return agent;
}

