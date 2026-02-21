import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Service de nettoyage automatique des comptes non vérifiés.
 * 
 * Supprime les comptes utilisateurs avec email non vérifié créés il y a plus de 24h.
 * S'exécute toutes les heures.
 */
@Injectable()
export class CleanupUnverifiedUsersService {
	private readonly logger = new Logger(CleanupUnverifiedUsersService.name);

	constructor(private prisma: PrismaService) {}

	/**
	 * Cron job : exécuté toutes les heures pour supprimer les comptes non vérifiés après 24h.
	 */
	@Cron(CronExpression.EVERY_HOUR)
	async handleCleanup() {
		this.logger.log('Démarrage du nettoyage des comptes non vérifiés...');

		const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

		try {
			const unverifiedUsers = await this.prisma.user.findMany({
				where: {
					emailVerified: false,
					createdAt: {
						lt: twentyFourHoursAgo,
					},
				},
				include: {
					organization: {
						include: {
							users: true,
						},
					},
				},
			});

			let deletedCount = 0;
			let deletedOrgsCount = 0;

			for (const user of unverifiedUsers) {
				const orgId = user.organizationId;
				const orgUsers = user.organization.users;

				// Supprimer l'utilisateur
				await this.prisma.user.delete({
					where: { id: user.id },
				});
				deletedCount++;

				// Si l'organisation n'a plus d'utilisateurs, la supprimer aussi
				if (orgUsers.length === 1) {
					await this.prisma.organization.delete({
						where: { id: orgId },
					});
					deletedOrgsCount++;
				}
			}

			if (deletedCount > 0) {
				this.logger.log(
					`Nettoyage terminé : ${deletedCount} compte(s) non vérifié(s) supprimé(s), ${deletedOrgsCount} organisation(s) supprimée(s)`
				);
			} else {
				this.logger.debug('Aucun compte non vérifié à supprimer');
			}
		} catch (error) {
			this.logger.error('Erreur lors du nettoyage des comptes non vérifiés', error);
		}
	}
}
