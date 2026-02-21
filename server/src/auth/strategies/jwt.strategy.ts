import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(private prisma: PrismaService) {
		super({
			jwtFromRequest: ExtractJwt.fromExtractors([
				// Extraire depuis le cookie en priorité
				(request: Request) => {
					return request?.cookies?.['access_token'] || null;
				},
				// Fallback sur le header Authorization
				ExtractJwt.fromAuthHeaderAsBearerToken(),
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

		if (!user || user.status !== 'ACTIVE') {
			throw new UnauthorizedException('Compte non actif');
		}

		if (!user.emailVerified) {
			throw new UnauthorizedException('Veuillez vérifier votre adresse email pour accéder à votre compte');
		}

		return user;
	}
}

