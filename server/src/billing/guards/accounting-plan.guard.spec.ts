import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AccountingPlanGuard } from './accounting-plan.guard';

describe('AccountingPlanGuard', () => {
	const billing = {
		assertCanUseAccounting: jest.fn(),
	};

	let guard: AccountingPlanGuard;

	beforeEach(() => {
		jest.clearAllMocks();
		guard = new AccountingPlanGuard(billing as never);
	});

	function mockContext(organizationId?: number): ExecutionContext {
		return {
			switchToHttp: () => ({
				getRequest: () => ({ user: organizationId != null ? { organizationId } : {} }),
			}),
		} as ExecutionContext;
	}

	it('refuse sans organisation', async () => {
		await expect(guard.canActivate(mockContext())).rejects.toBeInstanceOf(ForbiddenException);
		expect(billing.assertCanUseAccounting).not.toHaveBeenCalled();
	});

	it('délègue au BillingService', async () => {
		billing.assertCanUseAccounting.mockResolvedValue(undefined);
		await expect(guard.canActivate(mockContext(42))).resolves.toBe(true);
		expect(billing.assertCanUseAccounting).toHaveBeenCalledWith(42);
	});

	it('propage le refus plan Free', async () => {
		billing.assertCanUseAccounting.mockRejectedValue(new ForbiddenException('plan Pro'));
		await expect(guard.canActivate(mockContext(1))).rejects.toBeInstanceOf(ForbiddenException);
	});
});
