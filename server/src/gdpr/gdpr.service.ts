import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { sanitizeOrganizationProfile } from '../organizations/organization-profile.util';

@Injectable()
export class GdprService {
	private readonly logger = new Logger(GdprService.name);

	constructor(private readonly prisma: PrismaService) {}

	async exportOrganizationData(userId: number, organizationId: number) {
		const user = await this.prisma.user.findFirst({
			where: { id: userId, organizationId },
		});
		if (!user) throw new NotFoundException('Utilisateur introuvable');

		const org = await this.prisma.organization.findUnique({
			where: { id: organizationId },
			include: {
				users: {
					select: {
						id: true,
						email: true,
						firstName: true,
						lastName: true,
						role: true,
						status: true,
						emailVerified: true,
						createdAt: true,
						privacyConsentAt: true,
						termsAcceptedAt: true,
					},
				},
				clients: {
					select: {
						id: true,
						name: true,
						companyName: true,
						email: true,
						address: true,
						countryCode: true,
						siren: true,
						vatNumber: true,
						isCompany: true,
						createdAt: true,
					},
				},
				invoices: {
					select: {
						id: true,
						number: true,
						date: true,
						status: true,
						total: true,
						currency: true,
						createdAt: true,
						clientId: true,
					},
					orderBy: { createdAt: 'desc' },
					take: 5000,
				},
				quotes: {
					select: {
						id: true,
						number: true,
						date: true,
						status: true,
						total: true,
						createdAt: true,
						clientId: true,
					},
					orderBy: { createdAt: 'desc' },
					take: 5000,
				},
			},
		});

		if (!org) throw new NotFoundException('Organisation introuvable');

		const safeOrg = sanitizeOrganizationProfile(org as Record<string, unknown>);

		return {
			exportedAt: new Date().toISOString(),
			format: 'facturio-gdpr-export-v1',
			notice:
				'Export RGPD : ne contient pas les clés secrètes Stripe. Conservez ce fichier de manière sécurisée.',
			organization: safeOrg,
			users: org.users,
			clients: org.clients,
			invoices: org.invoices.map((inv) => ({
				...inv,
				total: Number(inv.total),
			})),
			quotes: org.quotes.map((q) => ({
				...q,
				total: Number(q.total),
			})),
			counts: {
				clients: org.clients.length,
				invoices: org.invoices.length,
				quotes: org.quotes.length,
			},
		};
	}

	async deleteUserAccount(userId: number, organizationId: number, confirmEmail: string) {
		const user = await this.prisma.user.findFirst({
			where: { id: userId, organizationId },
		});
		if (!user) throw new NotFoundException('Utilisateur introuvable');

		if (confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()) {
			throw new BadRequestException('L’email de confirmation ne correspond pas à votre compte');
		}

		const usersInOrg = await this.prisma.user.count({ where: { organizationId } });

		if (usersInOrg <= 1) {
			await this.prisma.organization.delete({ where: { id: organizationId } });
			this.logger.warn(`RGPD: organisation ${organizationId} supprimée (dernier utilisateur)`);
			return {
				deleted: true,
				scope: 'organization',
				message:
					'Votre compte et toutes les données de l’organisation ont été supprimés conformément à votre demande.',
			};
		}

		await this.prisma.user.delete({ where: { id: userId } });
		this.logger.warn(`RGPD: utilisateur ${userId} supprimé (org ${organizationId} conservée)`);
		return {
			deleted: true,
			scope: 'user',
			message: 'Votre compte utilisateur a été supprimé. Les données de l’organisation sont conservées pour les autres membres.',
		};
	}

	/** Vérifie que l’utilisateur appartient bien à l’org (défense en profondeur). */
	assertOrgAccess(userOrganizationId: number | undefined, targetOrgId: number) {
		if (!userOrganizationId || userOrganizationId !== targetOrgId) {
			throw new ForbiddenException('Accès refusé');
		}
	}
}
