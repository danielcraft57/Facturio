import { ServiceUnavailableException } from '@nestjs/common';
import { DemoService } from './demo.service';
import { DEMO_ORG_NAME, DEMO_USER_EMAIL } from './demo.constants';

/**
 * Vérifie le service démo : statut, connexion et garde-fous.
 */
describe('DemoService', () => {
	const prisma = {
		organization: { findFirst: jest.fn() },
		client: { count: jest.fn() },
		invoice: { count: jest.fn() },
		quote: { count: jest.fn() },
		product: { count: jest.fn() },
		user: { findUnique: jest.fn(), update: jest.fn() },
	};

	const authService = {
		finishLogin: jest.fn(),
	};

	const config = {
		isProd: false,
	};

	let service: DemoService;

	beforeEach(() => {
		jest.clearAllMocks();
		service = new DemoService(prisma as any, authService as any, config as any);
	});

	it('retourne available=false si l\'organisation démo est absente', async () => {
		prisma.organization.findFirst.mockResolvedValue(null);

		const info = await service.getInfo();

		expect(info.available).toBe(false);
		expect(info.organizationName).toBe(DEMO_ORG_NAME);
		expect(info.enterPath).toBe('/essayer');
	});

	it('retourne les compteurs quand l\'organisation démo existe', async () => {
		prisma.organization.findFirst.mockResolvedValue({ id: 42, name: DEMO_ORG_NAME });
		prisma.client.count.mockResolvedValue(10);
		prisma.invoice.count.mockResolvedValue(20);
		prisma.quote.count.mockResolvedValue(5);
		prisma.product.count.mockResolvedValue(3);

		const info = await service.getInfo();

		expect(info.available).toBe(true);
		expect(info.organizationId).toBe(42);
		expect(info.counts).toEqual({ clients: 10, invoices: 20, quotes: 5, products: 3 });
	});

	it('connecte le visiteur sur le compte démo', async () => {
		const user = {
			id: 7,
			email: DEMO_USER_EMAIL,
			organization: { name: DEMO_ORG_NAME },
		};

		jest.spyOn(service, 'ensureDemoData').mockResolvedValue(undefined);
		prisma.user.findUnique.mockResolvedValue(user);
		prisma.user.update.mockResolvedValue(user);
		authService.finishLogin.mockResolvedValue({
			access_token: 'jwt-demo',
			user: { id: 7, email: DEMO_USER_EMAIL },
		});

		const result = await service.enterDemo({ ip: '127.0.0.1' });

		expect(authService.finishLogin).toHaveBeenCalledWith(user, { ip: '127.0.0.1' }, { trustDevice: true });
		expect(result.isDemo).toBe(true);
		if ('access_token' in result) {
			expect(result.access_token).toBe('jwt-demo');
		}
	});

	it('refuse si le compte démo est introuvable', async () => {
		jest.spyOn(service, 'ensureDemoData').mockResolvedValue(undefined);
		prisma.user.findUnique.mockResolvedValue(null);

		await expect(service.enterDemo()).rejects.toBeInstanceOf(ServiceUnavailableException);
	});
});
