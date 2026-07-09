import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { ConfigService } from '../config/config.service';
import type { LoginDeviceContext } from '../auth/auth-session.service';
import {
	DEMO_ORG_NAME,
	DEMO_USER_EMAIL,
	isDemoFeatureEnabled,
} from './demo.constants';
import { runDemoSeed } from './demo-seed.runner';

/** Statistiques exposées sur l'espace démo. */
export type DemoCounts = {
	clients: number;
	invoices: number;
	quotes: number;
	products: number;
};

/** Réponse publique décrivant la disponibilité de la démo. */
export type DemoInfoResponse = {
	available: boolean;
	organizationName: string;
	organizationId: number | null;
	counts: DemoCounts;
	enterPath: string;
	message: string;
};

/**
 * Service métier de l'espace démo partagé.
 * Crée les données si besoin et connecte les visiteurs sans inscription.
 */
@Injectable()
export class DemoService {
	private readonly logger = new Logger(DemoService.name);
	private ensureInFlight: Promise<void> | null = null;

	constructor(
		private readonly prisma: PrismaService,
		private readonly authService: AuthService,
		private readonly config: ConfigService,
	) {}

	/**
	 * Retourne l'état de la démo (disponible ou non) et les volumes de données.
	 *
	 * @returns Informations publiques sur l'espace démo
	 */
	async getInfo(): Promise<DemoInfoResponse> {
		if (!isDemoFeatureEnabled()) {
			return {
				available: false,
				organizationName: DEMO_ORG_NAME,
				organizationId: null,
				counts: { clients: 0, invoices: 0, quotes: 0, products: 0 },
				enterPath: '/essayer',
				message: 'La démo est désactivée sur cette instance.',
			};
		}

		const org = await this.prisma.organization.findFirst({
			where: { name: DEMO_ORG_NAME },
			select: { id: true, name: true },
		});

		if (!org) {
			return {
				available: false,
				organizationName: DEMO_ORG_NAME,
				organizationId: null,
				counts: { clients: 0, invoices: 0, quotes: 0, products: 0 },
				enterPath: '/essayer',
				message: 'La démo sera disponible sous peu. Réessayez dans quelques instants.',
			};
		}

		const counts = await this.countOrgData(org.id);

		return {
			available: counts.clients > 0 && counts.invoices > 0,
			organizationName: org.name,
			organizationId: org.id,
			counts,
			enterPath: '/essayer',
			message:
				'Explorez Facturio avec un espace prérempli : clients, devis, factures et tableau de bord.',
		};
	}

	/**
	 * Garantit la présence des données démo (idempotent, sans purge).
	 * En production, ne lance le seed que si l'organisation est totalement absente.
	 */
	async ensureDemoData(): Promise<void> {
		if (this.ensureInFlight) {
			await this.ensureInFlight;
			return;
		}

		this.ensureInFlight = this.runEnsureDemoData();
		try {
			await this.ensureInFlight;
		} finally {
			this.ensureInFlight = null;
		}
	}

	/**
	 * Connecte un visiteur sur le compte démo partagé.
	 *
	 * @param deviceContext - Contexte appareil pour la session
	 * @returns Jeton JWT et profil utilisateur, avec indicateur isDemo
	 */
	async enterDemo(deviceContext: LoginDeviceContext = {}) {
		if (!isDemoFeatureEnabled()) {
			throw new ServiceUnavailableException('La démo est désactivée sur cette instance.');
		}

		await this.ensureDemoData();

		const user = await this.prisma.user.findUnique({
			where: { email: DEMO_USER_EMAIL },
			include: { organization: true },
		});

		if (!user || user.organization?.name !== DEMO_ORG_NAME) {
			this.logger.error(`Compte démo introuvable (${DEMO_USER_EMAIL})`);
			throw new ServiceUnavailableException(
				'La démo est temporairement indisponible. Réessayez plus tard.',
			);
		}

		await this.prisma.user.update({
			where: { id: user.id },
			data: { lastLoginAt: new Date() },
		});

		const session = await this.authService.finishLogin(user, deviceContext, { trustDevice: true });

		if ('needDeviceVerification' in session && session.needDeviceVerification) {
			throw new ServiceUnavailableException(
				'La démo n\'a pas pu démarrer. Réessayez dans quelques instants.',
			);
		}

		return {
			...session,
			isDemo: true as const,
			message:
				'Vous explorez l\'espace démo Facturio. Les données sont partagées entre les visiteurs.',
		};
	}

	private async runEnsureDemoData(): Promise<void> {
		const existing = await this.prisma.organization.findFirst({
			where: { name: DEMO_ORG_NAME },
			select: { id: true },
		});

		if (existing) {
			const counts = await this.countOrgData(existing.id);
			if (counts.clients > 0 && counts.invoices > 0) {
				return;
			}
		}

		if (this.config.isProd) {
			this.logger.warn('Organisation démo incomplète ou absente en production — exécutez npm run ensure-demo');
			return;
		}

		this.logger.log('Initialisation des données démo…');
		try {
			await runDemoSeed(this.prisma);
		} catch (error) {
			this.logger.error('Échec du seed démo', error);
			throw new ServiceUnavailableException(
				'Impossible de préparer la démo. Lancez `npm run ensure-demo` dans server/.',
			);
		}
	}

	private async countOrgData(organizationId: number): Promise<DemoCounts> {
		const [clients, invoices, quotes, products] = await Promise.all([
			this.prisma.client.count({ where: { organizationId } }),
			this.prisma.invoice.count({ where: { organizationId } }),
			this.prisma.quote.count({ where: { organizationId } }),
			this.prisma.product.count({ where: { organizationId } }),
		]);

		return { clients, invoices, quotes, products };
	}
}
