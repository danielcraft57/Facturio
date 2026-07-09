import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import {
	assertDemoReadOnly,
	isDemoMutationAllowedPath,
	isDemoUser,
	isHttpReadMethod,
} from '../demo-policy.util';

/**
 * Guard global : le compte démo est en lecture seule (pas de création facture/devis/client, etc.).
 */
@Injectable()
export class DemoWriteGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest();
		const user = request.user;

		if (!isDemoUser(user)) {
			return true;
		}

		const method = String(request.method || 'GET').toUpperCase();
		if (isHttpReadMethod(method)) {
			return true;
		}

		const path = (request.path || request.url || '').split('?')[0];
		if (isDemoMutationAllowedPath(path)) {
			return true;
		}

		assertDemoReadOnly(user);
		return true;
	}
}
