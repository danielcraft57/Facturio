import { createHash } from 'crypto';
import { FacturXGeneratorService } from './factur-x-generator.service';

describe('FacturXGeneratorService', () => {
	let service: FacturXGeneratorService;

	const sampleInvoice = {
		number: 'FAC-2026-042',
		date: new Date('2026-05-15'),
		dueDate: new Date('2026-06-15'),
		currency: 'EUR',
		subtotal: 1000,
		tax: 200,
		total: 1200,
		legalMention: 'TVA non applicable, art. 293 B du CGI',
		lines: [
			{
				description: 'Développement web',
				quantity: 10,
				unitPrice: 100,
				total: 1000,
				taxRate: 0.2,
			},
		],
		client: {
			name: 'Client Pro',
			companyName: 'Client Pro SAS',
			siren: '987654321',
			vatNumber: 'FR98765432109',
			address: '2 rue Client',
			email: 'client@example.com',
			isCompany: true,
		},
		organization: {
			name: 'DanielCraft',
			legalName: 'DanielCraft SAS',
			siret: '12345678901234',
			siren: '123456789',
			vatNumber: 'FR12345678901',
			address: '1 rue Émetteur',
			zipCode: '75001',
			city: 'Paris',
			countryCode: 'FR',
			email: 'factures@danielcraft.fr',
		},
	};

	beforeEach(() => {
		service = new FacturXGeneratorService();
	});

	it('génère un XML PrestaFacture avec métadonnées facture', () => {
		const { xml, hash } = service.generate(sampleInvoice);

		expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
		expect(xml).toContain('<FacturioCrossIndustryInvoice');
		expect(xml).toContain('<ID>FAC-2026-042</ID>');
		expect(xml).toContain('<SIREN>123456789</SIREN>');
		expect(xml).toContain('<SIREN>987654321</SIREN>');
		expect(xml).toContain('Développement web');
		expect(hash).toBe(createHash('sha256').update(xml).digest('hex'));
	});

	it('échappe les caractères XML dans les libellés', () => {
		const { xml } = service.generate({
			...sampleInvoice,
			lines: [{ ...sampleInvoice.lines[0], description: 'A & B <test>' }],
		});
		expect(xml).toContain('A &amp; B &lt;test&gt;');
	});
});
