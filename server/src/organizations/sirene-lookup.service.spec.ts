import { BadRequestException } from '@nestjs/common';
import { SireneLookupService } from './sirene-lookup.service';

describe('SireneLookupService', () => {
	const service = new SireneLookupService();

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('rejette un numéro trop court', async () => {
		await expect(service.lookup('123')).rejects.toBeInstanceOf(BadRequestException);
	});

	it('mappe une réponse API avec diffusion partielle', async () => {
		const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
			ok: true,
			json: async () => ({
				results: [
					{
						siren: '823417050',
						nom_raison_sociale: '[NON-DIFFUSIBLE]',
						nature_juridique: '1000',
						statut_diffusion: 'P',
						activite_principale: '62.01Z',
						siege: {
							siret: '82341705000025',
							code_postal: '57000',
							libelle_commune: 'METZ',
							activite_principale: '62.01Z',
							nom_commercial: 'DanielCraft',
							statut_diffusion_etablissement: 'P',
						},
						complements: { est_entrepreneur_individuel: true },
						matching_etablissements: [{ siret: '82341705000025', nom_commercial: 'DanielCraft' }],
					},
				],
			}),
		} as Response);

		const result = await service.lookup('823417050');

		expect(fetchMock).toHaveBeenCalled();
		expect(result.siren).toBe('823417050');
		expect(result.siret).toBe('82341705000025');
		expect(result.legalName).toBeNull();
		expect(result.name).toBe('Danielcraft');
		expect(result.apeCode).toBe('62.01Z');
		expect(result.legalForm).toBe('Entrepreneur individuel');
		expect(result.city).toBe('Metz');
		expect(result.zipCode).toBe('57000');
		expect(result.partial).toBe(true);

		fetchMock.mockRestore();
	});
});
