import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Suppression d'un compte non vérifié et de son organisation si elle n'a plus d'utilisateurs.
 */
@Injectable()
export class UnverifiedAccountService {
	private readonly logger = new Logger(UnverifiedAccountService.name);

	constructor(private prisma: PrismaService) {}

	async deleteUnverifiedUser(user: {
		id: number;
		organizationId: number;
		emailVerified: boolean;
		email?: string;
	}): Promise<boolean> {
		if (user.emailVerified) {
			return false;
		}

		const usersInOrg = await this.prisma.user.count({
			where: { organizationId: user.organizationId },
		});

		await this.prisma.user.delete({ where: { id: user.id } });

		if (usersInOrg <= 1) {
			await this.prisma.organization.delete({ where: { id: user.organizationId } });
			this.logger.log(
				`Compte non vérifié supprimé (userId=${user.id}, orgId=${user.organizationId}${user.email ? `, ${user.email}` : ''})`,
			);
		} else {
			this.logger.log(`Utilisateur non vérifié supprimé (userId=${user.id})`);
		}

		return true;
	}
}
