import { EmailService } from './email.service';

describe('EmailService.sendPayableDebtPayment', () => {
	let service: EmailService;
	let sendSpy: jest.SpyInstance;

	beforeEach(() => {
		process.env.NODE_ENV = 'test';
		service = new EmailService();
		sendSpy = jest.spyOn(service, 'send').mockResolvedValue(undefined);
	});

	afterEach(() => {
		sendSpy.mockRestore();
	});

	it('objet « Remboursement de la dette » si soldée', async () => {
		await service.sendPayableDebtPayment({
			to: 'c@test.fr',
			creditorName: 'Créancier',
			label: 'Dette A',
			paymentAmount: 50,
			totalAmount: 50,
			totalPaid: 50,
			balance: 0,
			fullyPaid: true,
			issuerName: 'Émetteur',
		});

		expect(sendSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				subject: 'Remboursement de la dette',
				to: 'c@test.fr',
			}),
		);
		const html = sendSpy.mock.calls[0][0].html as string;
		expect(html).toContain('entièrement soldée');
	});

	it('objet « Remboursement partiel de la dette » si solde restant', async () => {
		await service.sendPayableDebtPayment({
			to: 'c@test.fr',
			creditorName: 'Créancier',
			label: 'Dette B',
			paymentAmount: 25,
			totalAmount: 100,
			totalPaid: 25,
			balance: 75,
			fullyPaid: false,
			issuerName: 'Émetteur',
		});

		expect(sendSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				subject: 'Remboursement partiel de la dette',
			}),
		);
		const html = sendSpy.mock.calls[0][0].html as string;
		expect(html).toContain('Solde restant');
	});
});
