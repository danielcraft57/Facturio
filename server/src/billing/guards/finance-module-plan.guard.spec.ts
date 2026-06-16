import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { FinanceModulePlanGuard } from './finance-module-plan.guard';

describe('FinanceModulePlanGuard', () => {
	const billing = {
		assertCanUseFinanceModule: jest.fn(),
	};

	let guard: FinanceModulePlanGuard;

	beforeEach(() => {
		jest.clearAllMocks();
		guard = new FinanceModulePlanGuard(billing as never);
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
		expect(billing.assertCanUseFinanceModule).not.toHaveBeenCalled();
	});

	it('délègue au BillingService', async () => {
		billing.assertCanUseFinanceModule.mockResolvedValue(undefined);
		await expect(guard.canActivate(mockContext(7))).resolves.toBe(true);
		expect(billing.assertCanUseFinanceModule).toHaveBeenCalledWith(7);
	});

	it('propage le refus plan Free', async () => {
		billing.assertCanUseFinanceModule.mockRejectedValue(new ForbiddenException('plan Pro'));
		await expect(guard.canActivate(mockContext(1))).rejects.toBeInstanceOf(ForbiddenException);
	});
});
