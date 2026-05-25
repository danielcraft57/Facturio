import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthSessionService } from '../auth-session.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		private prisma: PrismaService,
		private authSessionService: AuthSessionService,
	) {
		super({
			jwtFromRequest: ExtractJwt.fromExtractors([
				// Extraire depuis le cookie en priorité
				(request: Request) => {
					return request?.cookies?.['access_token'] || null;
				},
				// Fallback sur le header Authorization
				ExtractJwt.fromAuthHeaderAsBearerToken(),
				// EventSource (SSE) : token en query (?access_token=)
				(request: Request) => {
					const q = request?.query?.['access_token'];
					return typeof q === 'string' ? q : null;
				},
			]),
			ignoreExpiration: false,
			secretOrKey: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
		});
	}

	async validate(payload: any) {
		const user = await this.prisma.user.findUnique({
			where: { id: payload.sub },
			include: { organization: true },
		});

		if (!user || (user.status !== 'ACTIVE' && user.status !== 'PENDING')) {
			throw new UnauthorizedException('Compte non actif');
		}

		if (payload.sid) {
			await this.authSessionService.assertSessionActive(payload.sid, user.id);
		}

		return { ...user, sessionId: payload.sid as number | undefined };
	}
}

