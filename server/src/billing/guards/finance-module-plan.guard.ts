import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { BillingService } from '../billing.service';

/**
 * Bloque l'accès aux créances et dettes si le plan ne l'inclut pas (Free).
 */
@Injectable()
export class FinanceModulePlanGuard implements CanActivate {
	constructor(private readonly billing: BillingService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const organizationId = request.user?.organizationId;
		if (organizationId == null) {
			throw new ForbiddenException('Organisation requise pour accéder au module finance.');
		}
		await this.billing.assertCanUseFinanceModule(organizationId);
		return true;
	}
}
