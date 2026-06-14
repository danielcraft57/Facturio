import {
	BadRequestException,
	ExecutionContext,
	Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
	encodeGoogleOAuthState,
	googleOAuthStateFromQuery,
} from '../google-oauth-state.util';

/**
 * Guard OAuth Google — propage intent signup, code beta et consentements via `state`.
 */
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
	getAuthenticateOptions(context: ExecutionContext) {
		const request = context.switchToHttp().getRequest<{ query?: Record<string, unknown>; path?: string }>();
		const isCallback = String(request.path || '').includes('google/callback');
		if (isCallback) {
			return {};
		}

		const signupState = googleOAuthStateFromQuery(request.query || {});
		if (signupState.intent === 'signup') {
			if (!signupState.acceptTerms || !signupState.acceptPrivacy) {
				throw new BadRequestException(
					'Acceptez les CGU et la politique de confidentialité avant de continuer avec Google.',
				);
			}
		}

		return {
			scope: ['email', 'profile'],
			state: encodeGoogleOAuthState(signupState),
		};
	}
}
