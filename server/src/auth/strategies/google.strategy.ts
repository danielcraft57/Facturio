import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
	constructor() {
		// En mode test, on utilise des valeurs mockées pour éviter l'erreur OAuth2Strategy
		const isTest = process.env.NODE_ENV === 'test' || !process.env.GOOGLE_CLIENT_ID;
		super({
			clientID: process.env.GOOGLE_CLIENT_ID || (isTest ? 'test-client-id' : ''),
			clientSecret: process.env.GOOGLE_CLIENT_SECRET || (isTest ? 'test-client-secret' : ''),
			callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
			scope: ['email', 'profile'],
		});
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

