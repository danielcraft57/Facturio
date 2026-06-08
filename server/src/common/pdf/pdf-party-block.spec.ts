import {
	buildEmitterParty,
	buildRecipientParty,
	splitAddressLines,
} from './pdf-party-block';
import type { PdfCompanyInfo } from './pdf-theme';

describe('pdf-party-block', () => {
	const company: PdfCompanyInfo = {
		name: 'DanielCraft',
		legalName: 'Loïc Daniel',
		legalForm: 'Entrepreneur individuel (micro-entreprise)',
		address: '12 rue Example\n57000 Metz',
		phone: '06 12 34 56 78',
		email: 'contact@danielcraft.fr',
		siret: '12345678901234',
		rcs: '',
		vat: 'FR12345678901',
		website: '',
	};

	it('priorise le nom commercial et place le nom légal en sous-titre', () => {
		const party = buildEmitterParty(company, 'devis');
		expect(party.title).toBe('DanielCraft');
		expect(party.subtitle).toContain('Loïc Daniel');
		expect(party.subtitle).toContain('micro-entreprise');
		expect(party.idLines.some((l) => l.startsWith('SIRET'))).toBe(true);
	});

	it('découpe les adresses multi-lignes sans chevauchement', () => {
		expect(splitAddressLines('10 avenue de la Gare\n57000 Metz')).toEqual([
			'10 avenue de la Gare',
			'57000 Metz',
		]);
	});

	it('formate le bloc client sans cadre avec lignes séparées', () => {
		const party = buildRecipientParty(
			{
				name: 'Société Dupont',
				address: '10 avenue de la Gare\n57000 Metz',
				email: 'facturation@dupont.fr',
			},
			'devis',
		);
		expect(party?.roleLabel).toBe('Client');
		expect(party?.bodyLines).toEqual([
			'10 avenue de la Gare',
			'57000 Metz',
			'facturation@dupont.fr',
		]);
	});

	it('affiche Facturé à sur les factures', () => {
		const party = buildRecipientParty({ name: 'Client Pro' }, 'facture');
		expect(party?.roleLabel).toBe('Facturé à');
	});
});
