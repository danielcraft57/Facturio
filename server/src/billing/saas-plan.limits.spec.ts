import { getSaasPlanLimits } from './saas-plan.limits';

describe('getSaasPlanLimits', () => {
	const envBackup = { ...process.env };

	afterEach(() => {
		process.env = { ...envBackup };
	});

	it('retourne les limites par défaut du plan Free', () => {
		delete process.env.SAAS_FREE_MAX_INVOICES_PER_MONTH;
		delete process.env.SAAS_FREE_MAX_QUOTES_PER_MONTH;
		delete process.env.SAAS_FREE_MAX_EMAILS_PER_MONTH;

		const limits = getSaasPlanLimits('FREE');
		expect(limits.maxInvoicesPerMonth).toBe(25);
		expect(limits.maxQuotesPerMonth).toBe(10);
		expect(limits.maxEmailsPerMonth).toBe(20);
	});

	it('surcharge les quotas Free via variables d’environnement', () => {
		process.env.SAAS_FREE_MAX_INVOICES_PER_MONTH = '3';
		process.env.SAAS_FREE_MAX_QUOTES_PER_MONTH = '2';
		process.env.SAAS_FREE_MAX_EMAILS_PER_MONTH = '5';

		const limits = getSaasPlanLimits('FREE');
		expect(limits.maxInvoicesPerMonth).toBe(3);
		expect(limits.maxQuotesPerMonth).toBe(2);
		expect(limits.maxEmailsPerMonth).toBe(5);
	});

	it('ignore les valeurs invalides et garde le défaut', () => {
		process.env.SAAS_FREE_MAX_INVOICES_PER_MONTH = 'abc';
		process.env.SAAS_FREE_MAX_QUOTES_PER_MONTH = '0';
		process.env.SAAS_FREE_MAX_EMAILS_PER_MONTH = '-1';

		const limits = getSaasPlanLimits('FREE');
		expect(limits.maxInvoicesPerMonth).toBe(25);
		expect(limits.maxQuotesPerMonth).toBe(10);
		expect(limits.maxEmailsPerMonth).toBe(20);
	});

	it('ne modifie pas les plans payants', () => {
		process.env.SAAS_FREE_MAX_INVOICES_PER_MONTH = '1';

		const limits = getSaasPlanLimits('PRO');
		expect(limits.maxInvoicesPerMonth).toBeNull();
	});
});
