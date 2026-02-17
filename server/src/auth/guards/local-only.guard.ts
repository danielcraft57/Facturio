import {
	Injectable,
	CanActivate,
	ExecutionContext,
	ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { Reflector } from '@nestjs/core';
import { Prisma } from '@prisma/client';

/** Clé pour marquer une route comme publique (pas de vérification local). */
export const LOCAL_ONLY_SKIP = 'localOnlySkip';

/**
 * Guard qui restreint l'accès à l'API aux requêtes provenant du réseau local.
 *
 * Utilisé pour Facturio en mode "sans mot de passe" : seules les requêtes
 * depuis localhost (127.0.0.1, ::1) sont autorisées. Attache le premier
 * utilisateur actif à la requête pour que CurrentUser() continue de fonctionner.
 *
 * Les routes publiques (devis/factures par token) et le tracking email sont exclues.
 *
 * @see AuthModule
 */
@Injectable()
export class LocalOnlyGuard implements CanActivate {
	constructor(
		private readonly prisma: PrismaService,
		private readonly reflector: Reflector,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest<Request>();
		const path = request.path || '';

		// Ne pas appliquer le guard sur les routes publiques et le tracking
		if (
			path.startsWith('/api/public') ||
			path.startsWith('/api/track') ||
			this.reflector.get<boolean>(LOCAL_ONLY_SKIP, context.getHandler())
		) {
			return true;
		}

		// En production avec accès public (reverse proxy), ne pas restreindre par IP
		const allowPublic = (process.env.ALLOW_PUBLIC_ACCESS ?? '').trim().toLowerCase();
		if (allowPublic === 'true' || allowPublic === '1' || allowPublic === 'yes') {
			return true;
		}

		const ip = this.getClientIp(request);

		if (!this.isLocal(ip)) {
			throw new ForbiddenException(
				'Accès réservé au réseau local. Utilisez l\'application depuis ce serveur (localhost).',
			);
		}

		let user: { id: number; organizationId: number; organization: any } | null = null;
		try {
			user = await this.prisma.user.findFirst({
				where: { status: 'ACTIVE' },
				include: { organization: true },
			});
		} catch (err: any) {
			const msg = err?.message ?? '';
			if (err instanceof Prisma.PrismaClientKnownRequestError && /does not exist|table.*not found/i.test(msg)) {
				throw new ForbiddenException(
					'Base de données non initialisée. Dans le dossier server, exécutez : npx prisma migrate reset puis npx prisma db seed',
				);
			}
			throw err;
		}

		if (!user) {
			throw new ForbiddenException(
				'Aucun utilisateur actif configuré. Exécutez : npx prisma db seed',
			);
		}

		(request as any).user = user;
		return true;
	}

	/**
	 * Récupère l'IP réelle du client (prise en compte des proxies).
	 */
	private getClientIp(req: Request): string {
		const forwarded = req.headers['x-forwarded-for'];
		if (forwarded) {
			const first = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
			return (first || '').trim();
		}
		return req.ip || req.socket?.remoteAddress || '';
	}

	/**
	 * Indique si l'IP est considérée comme locale.
	 */
	private isLocal(ip: string): boolean {
		const local = ['127.0.0.1', '::1', '::ffff:127.0.0.1', '::'];
		if (local.includes(ip)) return true;
		if (ip.startsWith('::ffff:127.')) return true;
		return false;
	}
}
