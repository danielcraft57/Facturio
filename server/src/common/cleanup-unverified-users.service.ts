import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { UnverifiedAccountService } from './unverified-account.service';

/**
 * Supprime les comptes dont l'email n'a jamais été confirmé
 * (création > 24 h ou lien de vérification expiré).
 */
@Injectable()
export class CleanupUnverifiedUsersService {
	private readonly logger = new Logger(CleanupUnverifiedUsersService.name);

	constructor(
		private prisma: PrismaService,
		private unverifiedAccountService: UnverifiedAccountService,
	) {}

	@Cron(CronExpression.EVERY_HOUR)
	async handleCleanup() {
		this.logger.log('Démarrage du nettoyage des comptes non vérifiés...');

		const now = new Date();
		const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

		try {
			const unverifiedUsers = await this.prisma.user.findMany({
				where: {
					emailVerified: false,
					OR: [
						{ createdAt: { lt: twentyFourHoursAgo } },
						{ emailVerificationExpires: { lt: now } },
					],
				},
			});

			let deletedCount = 0;

			for (const user of unverifiedUsers) {
				const deleted = await this.unverifiedAccountService.deleteUnverifiedUser(user);
				if (deleted) deletedCount++;
			}

			if (deletedCount > 0) {
				this.logger.log(`Nettoyage terminé : ${deletedCount} compte(s) non vérifié(s) supprimé(s)`);
			} else {
				this.logger.debug('Aucun compte non vérifié à supprimer');
			}
		} catch (error) {
			this.logger.error('Erreur lors du nettoyage des comptes non vérifiés', error);
		}
	}
}
