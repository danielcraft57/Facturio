import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { ApiAccessContext } from '../api-access-token.service';

export const ApiOrganizationId = createParamDecorator((_data: unknown, ctx: ExecutionContext): number => {
	const request = ctx.switchToHttp().getRequest();
	const access = request.apiAccess as ApiAccessContext | undefined;
	return access?.organizationId ?? 0;
});
