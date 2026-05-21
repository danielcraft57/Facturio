import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
	SetMetadata,
	UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiAccessScope, hasScope } from '../api-access-permissions';
import { ApiAccessTokenService } from '../api-access-token.service';

export const API_SCOPES_KEY = 'api_scopes';
export const RequireApiScopes = (...scopes: ApiAccessScope[]) => SetMetadata(API_SCOPES_KEY, scopes);

@Injectable()
export class ApiBearerGuard implements CanActivate {
	constructor(
		private readonly tokens: ApiAccessTokenService,
		private readonly reflector: Reflector,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const req = context.switchToHttp().getRequest();
		try {
			const ctx = await this.tokens.resolveBearer(req.headers?.authorization);
			req.apiAccess = ctx;
		} catch (e: any) {
			if (e?.status === 401) throw e;
			throw new UnauthorizedException('Authentification API requise');
		}
		const required =
			this.reflector.getAllAndOverride<ApiAccessScope[]>(API_SCOPES_KEY, [
				context.getHandler(),
				context.getClass(),
			]) ?? [];
		for (const scope of required) {
			if (!hasScope(req.apiAccess.permissions, scope)) {
				throw new ForbiddenException(`Permission API manquante : ${scope}`);
			}
		}
		return true;
	}
}
