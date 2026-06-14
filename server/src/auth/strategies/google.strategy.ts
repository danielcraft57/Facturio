import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
	private readonly logger = new Logger(GoogleStrategy.name);

	constructor() {
		// En mode test, on utilise des valeurs mockées pour éviter l'erreur OAuth2Strategy
		const isTest = process.env.NODE_ENV === 'test' || !process.env.GOOGLE_CLIENT_ID;
		super({
			clientID: process.env.GOOGLE_CLIENT_ID || (isTest ? 'test-client-id' : ''),
			clientSecret: process.env.GOOGLE_CLIENT_SECRET || (isTest ? 'test-client-secret' : ''),
			callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
			scope: ['email', 'profile'],
			state: false,
		});

		const id = process.env.GOOGLE_CLIENT_ID;
		if (!isTest && id?.startsWith('GOCSPX')) {
			this.logger.warn(
				'GOOGLE_CLIENT_ID commence par GOCSPX- : en général c’est le *secret client*, pas l’ID. ' +
					'L’ID client OAuth (Application Web) se termine par .apps.googleusercontent.com. ' +
					'Sinon Google renvoie invalid_client (401).'
			);
		}

		if (
			!isTest &&
			id &&
			(id.includes('your-google-client-id') || !id.includes('.apps.googleusercontent.com'))
		) {
			this.logger.error(
				'GOOGLE_CLIENT_ID invalide ou placeholder — Google renverra invalid_client (401). ' +
					'Verifiez server/.env (une seule declaration, ID se terminant par .apps.googleusercontent.com).',
			);
		}

		const nodeEnv = process.env.NODE_ENV || 'dev';
		const isDev = nodeEnv === 'dev' || nodeEnv === 'development';
		const callback = process.env.GOOGLE_CALLBACK_URL || '';
		const frontend = process.env.FRONTEND_URL || '';
		if (
			isDev &&
			callback.includes('localhost:3000') &&
			(frontend.includes('localhost:5173') || !frontend)
		) {
			this.logger.warn(
				'GOOGLE_CALLBACK_URL pointe vers :3000 alors que le frontend Vite est sur :5173. ' +
					'Le cookie OAuth ne sera pas envoyé au bootstrap. Utilisez ' +
					'http://localhost:5173/api/auth/google/callback (voir docs/development/GOOGLE_OAUTH_LOCAL.md).',
			);
		}
	}

	async validate(
		accessToken: string,
		refreshToken: string,
		profile: any,
		done: VerifyCallback,
	): Promise<any> {
		const { id, name, emails, photos } = profile;
		const user = {
			googleId: id,
			email: emails[0].value,
			firstName: name.givenName,
			lastName: name.familyName,
			avatar: photos[0]?.value,
			accessToken,
		};

		done(null, user);
	}
}

