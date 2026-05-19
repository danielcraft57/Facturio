import { EInvoicingComplianceService } from './e-invoicing-compliance.service';
import { EInvoiceStatus } from '@prisma/client';

describe('EInvoicingComplianceService', () => {
	let service: EInvoicingComplianceService;

	beforeEach(() => {
		service = new EInvoicingComplianceService();
	});

	describe('isValidSiren / isValidSiret', () => {
		it('valide un SIREN à 9 chiffres (espaces ignorés)', () => {
			expect(service.isValidSiren('123 456 789')).toBe(true);
			expect(service.isValidSiren('12345678')).toBe(false);
		});

		it('valide un SIRET à 14 chiffres', () => {
			expect(service.isValidSiret('12345678901234')).toBe(true);
			expect(service.isValidSiret('1234567890123')).toBe(false);
		});

		it('dérive le SIREN depuis le SIRET', () => {
			expect(service.siretToSiren('12345678901234')).toBe('123456789');
		});
	});

	describe('evaluateOrganization', () => {
		const completeOrg = {
			name: 'DanielCraft',
			siret: '12345678901234',
			siren: '123456789',
			vatNumber: 'FR12345678901',
			address: '1 rue Test',
			zipCode: '75001',
			city: 'Paris',
			countryCode: 'FR',
			email: 'contact@example.com',
		};

		it('score 100 % quand le profil émetteur est complet', () => {
			const result = service.evaluateOrganization(completeOrg);
			expect(result.score).toBe(100);
			expect(result.ready).toBe(true);
			expect(result.checks.every((c) => c.ok)).toBe(true);
		});

		it('signale les champs manquants', () => {
			const result = service.evaluateOrganization({ ...completeOrg, siret: null, siren: null });
			expect(result.ready).toBe(false);
			expect(result.checks.find((c) => c.id === 'org_siret')?.ok).toBe(false);
		});
	});

	describe('evaluateClient', () => {
		it('exige SIREN et adresse pour un client B2B', () => {
			const result = service.evaluateClient({
				name: 'Client Pro',
				isCompany: true,
				companyName: 'Client Pro SAS',
				siren: '987654321',
				vatNumber: 'FR98765432109',
				address: '2 avenue Test',
				countryCode: 'FR',
			});
			expect(result.ready).toBe(true);
			expect(result.checks.find((c) => c.id === 'client_siren')?.ok).toBe(true);
		});

		it('ne exige pas le SIREN pour un particulier', () => {
			const result = service.evaluateClient({
				name: 'Jean Dupont',
				isCompany: false,
				companyName: null,
				siren: null,
				vatNumber: null,
				address: null,
				countryCode: 'FR',
			});
			expect(result.checks.find((c) => c.id === 'client_siren')).toBeUndefined();
		});
	});

	describe('evaluateInvoice', () => {
		const baseInvoice = {
			id: 1,
			number: 'FAC-2026-001',
			status: 'SENT',
			sentAt: new Date('2026-05-01'),
			lines: [{ description: 'Prestation' }],
		};

		it('autorise Factur-X quand org et client sont prêts', () => {
			const result = service.evaluateInvoice(baseInvoice, true, true);
			expect(result.ready).toBe(true);
			expect(result.canGenerateFacturX).toBe(true);
			expect(result.status).toBe(EInvoiceStatus.READY);
		});

		it('refuse un brouillon non envoyé', () => {
			const result = service.evaluateInvoice(
				{ ...baseInvoice, status: 'DRAFT', sentAt: null },
				true,
				true,
			);
			expect(result.ready).toBe(false);
			expect(result.canGenerateFacturX).toBe(false);
		});
	});
});
