import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { BillingService } from '../billing.service';

/**
 * Bloque l'accès aux endpoints comptabilité si le plan ne l'inclut pas (Free).
 */
@Injectable()
export class AccountingPlanGuard implements CanActivate {
	constructor(private readonly billing: BillingService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const organizationId = request.user?.organizationId;
		if (organizationId == null) {
			throw new ForbiddenException('Organisation requise pour accéder à la comptabilité.');
		}
		await this.billing.assertCanUseAccounting(organizationId);
		return true;
	}
}
