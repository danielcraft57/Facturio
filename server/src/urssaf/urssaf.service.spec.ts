import { Test, TestingModule } from '@nestjs/testing';
import { UrssafService } from './urssaf.service';
import { PrismaService } from '../prisma/prisma.service';
import { AccountingService } from '../accounting/accounting.service';
import { FilingsService } from '../filings/filings.service';
import { ConfigService } from '../config/config.service';
import { UrssafActivity } from './dto/update-organization-urssaf.dto';

/**
 * Tests unitaires pour UrssafService
 * 
 * Ces tests vérifient :
 * - Le calcul des cotisations selon différents scénarios
 * - La gestion des taux (défaut, micro-fiscal, personnalisé)
 * - La détection des seuils
 * - La création de déclarations
 * - La validation des données
 */
describe('UrssafService', () => {
	let service: UrssafService;
	let prisma: PrismaService;
	let accounting: AccountingService;
	let filings: FilingsService;

	const mockOrganization = {
		id: 1,
		name: 'Test Org',
		companyStatus: 'AUTO_ENTREPRENEUR' as const,
		urssafActivity: UrssafActivity.SERVICE_BIC,
		urssafFiscalOption: false,
		urssafRate: null,
		urssafDeclarationFrequency: 'MONTHLY',
		urssafThreshold: null,
	};

	const mockInvoices = [
		{
			id: 1,
			total: 5000,
			status: 'PAID' as const,
			date: new Date('2024-01-15'),
			organizationId: 1,
		},
		{
			id: 2,
			total: 3000,
			status: 'SENT' as const,
			date: new Date('2024-01-20'),
			organizationId: 1,
		},
	];

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UrssafService,
				{
					provide: PrismaService,
					useValue: {
						organization: {
							findUnique: jest.fn(),
							update: jest.fn(),
						},
						invoice: {
							findMany: jest.fn(),
						},
						filing: {
							findMany: jest.fn(),
							update: jest.fn(),
						},
						filingLine: {
							create: jest.fn(),
						},
					},
				},
				{
					provide: AccountingService,
					useValue: {
						postMicroSocialContribution: jest.fn(),
					},
				},
				{
					provide: FilingsService,
					useValue: {
						create: jest.fn(),
					},
				},
				{
					provide: ConfigService,
					useValue: {
						urssafRateVente: 0.128,
						urssafRateServiceBic: 0.22,
						urssafRateServiceBnc: 0.22,
						urssafFiscalRateVente: 0.01,
						urssafFiscalRateServiceBic: 0.017,
						urssafFiscalRateServiceBnc: 0.017,
						urssafThresholdVente: 188700,
						urssafThresholdServiceBic: 77700,
						urssafThresholdServiceBnc: 77700,
					},
				},
			],
		}).compile();

		service = module.get<UrssafService>(UrssafService);
		prisma = module.get<PrismaService>(PrismaService);
		accounting = module.get<AccountingService>(AccountingService);
		filings = module.get<FilingsService>(FilingsService);
	});

	it('devrait être défini', () => {
		expect(service).toBeDefined();
	});

	describe('calculateContribution', () => {
		it('devrait calculer la cotisation URSSAF pour un auto-entrepreneur', async () => {
			jest.spyOn(prisma.organization, 'findUnique').mockResolvedValue(mockOrganization as any);
			jest.spyOn(prisma.invoice, 'findMany').mockResolvedValue(mockInvoices as any);

			const result = await service.calculateContribution({
				organizationId: 1,
				periodStart: '2024-01-01',
				periodEnd: '2024-01-31',
			});

			expect(result.ca).toBe(8000); // 5000 + 3000
			expect(result.rate).toBe(0.22); // Taux SERVICE_BIC par défaut
			expect(result.contribution).toBe(1760); // 8000 * 0.22
			expect(result.activity).toBe(UrssafActivity.SERVICE_BIC);
			expect(result.invoicesCount).toBe(2);
		});

		it('devrait utiliser le taux micro-fiscal si activé', async () => {
			const orgWithFiscal = {
				...mockOrganization,
				urssafFiscalOption: true,
			};
			jest.spyOn(prisma.organization, 'findUnique').mockResolvedValue(orgWithFiscal as any);
			jest.spyOn(prisma.invoice, 'findMany').mockResolvedValue(mockInvoices as any);

			const result = await service.calculateContribution({
				organizationId: 1,
				periodStart: '2024-01-01',
				periodEnd: '2024-01-31',
			});

			expect(result.rate).toBe(0.017); // Taux micro-fiscal SERVICE_BIC
			expect(result.contribution).toBe(136); // 8000 * 0.017
		});

		it('devrait utiliser un taux personnalisé si fourni', async () => {
			const orgWithCustomRate = {
				...mockOrganization,
				urssafRate: 15, // 15%
			};
			jest.spyOn(prisma.organization, 'findUnique').mockResolvedValue(orgWithCustomRate as any);
			jest.spyOn(prisma.invoice, 'findMany').mockResolvedValue(mockInvoices as any);

			const result = await service.calculateContribution({
				organizationId: 1,
				periodStart: '2024-01-01',
				periodEnd: '2024-01-31',
			});

			expect(result.rate).toBe(0.15); // Taux personnalisé
			expect(result.contribution).toBe(1200); // 8000 * 0.15
		});

		it('devrait détecter le dépassement de seuil', async () => {
			const highCAInvoices = [
				{
					id: 1,
					total: 15000,
					status: 'PAID' as const,
					date: new Date('2024-01-15'),
					organizationId: 1,
				},
			];
			jest.spyOn(prisma.organization, 'findUnique').mockResolvedValue(mockOrganization as any);
			jest.spyOn(prisma.invoice, 'findMany').mockResolvedValue(highCAInvoices as any);

			const result = await service.calculateContribution({
				organizationId: 1,
				periodStart: '2024-01-01',
				periodEnd: '2024-01-31',
			});

			// CA mensuel de 15000€ = environ 547500€ annuel (15000 * 365 / 31)
			expect(result.thresholdExceeded).toBe(true);
		});

		it('devrait rejeter si organisation non éligible', async () => {
			const classicOrg = {
				...mockOrganization,
				companyStatus: 'SARL' as const,
			};
			jest.spyOn(prisma.organization, 'findUnique').mockResolvedValue(classicOrg as any);

			await expect(
				service.calculateContribution({
					organizationId: 1,
					periodStart: '2024-01-01',
					periodEnd: '2024-01-31',
				})
			).rejects.toThrow('Le calcul URSSAF est uniquement disponible');
		});

		it('devrait calculer correctement pour activité VENTE', async () => {
			const venteOrg = {
				...mockOrganization,
				urssafActivity: UrssafActivity.VENTE,
			};
			jest.spyOn(prisma.organization, 'findUnique').mockResolvedValue(venteOrg as any);
			jest.spyOn(prisma.invoice, 'findMany').mockResolvedValue(mockInvoices as any);

			const result = await service.calculateContribution({
				organizationId: 1,
				periodStart: '2024-01-01',
				periodEnd: '2024-01-31',
			});

			expect(result.rate).toBe(0.128); // Taux VENTE par défaut
			expect(result.contribution).toBe(1024); // 8000 * 0.128 = 1024
		});
	});

	describe('createUrssafFiling', () => {
		it('devrait créer une déclaration URSSAF mensuelle', async () => {
			const mockFiling = {
				id: 1,
				type: 'URSSAF_MONTHLY',
				authority: 'URSSAF',
				periodStart: new Date('2024-01-01'),
				periodEnd: new Date('2024-01-31'),
				dueDate: new Date('2024-02-29'),
				amountDue: 1760,
			};

			jest.spyOn(prisma.organization, 'findUnique').mockResolvedValue(mockOrganization as any);
			jest.spyOn(prisma.invoice, 'findMany').mockResolvedValue(mockInvoices as any);
			jest.spyOn(filings, 'create').mockResolvedValue(mockFiling as any);
			jest.spyOn(prisma.filingLine, 'create').mockResolvedValue({} as any);
			jest.spyOn(prisma.filing, 'update').mockResolvedValue(mockFiling as any);
			jest.spyOn(accounting, 'postMicroSocialContribution').mockResolvedValue({} as any);

			const result = await service.createUrssafFiling({
				organizationId: 1,
				period: '2024-M01',
			});

			expect(filings.create).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'URSSAF_MONTHLY',
					authority: 'URSSAF',
				})
			);
			expect(accounting.postMicroSocialContribution).toHaveBeenCalled();
		});

		it('devrait créer une déclaration URSSAF trimestrielle', async () => {
			const mockFiling = {
				id: 1,
				type: 'URSSAF_QUARTERLY',
				authority: 'URSSAF',
				periodStart: new Date('2024-01-01'),
				periodEnd: new Date('2024-03-31'),
				dueDate: new Date('2024-04-30'),
				amountDue: 5280,
			};

			jest.spyOn(prisma.organization, 'findUnique').mockResolvedValue(mockOrganization as any);
			jest.spyOn(prisma.invoice, 'findMany').mockResolvedValue(mockInvoices as any);
			jest.spyOn(filings, 'create').mockResolvedValue(mockFiling as any);
			jest.spyOn(prisma.filingLine, 'create').mockResolvedValue({} as any);
			jest.spyOn(prisma.filing, 'update').mockResolvedValue(mockFiling as any);
			jest.spyOn(accounting, 'postMicroSocialContribution').mockResolvedValue({} as any);

			const result = await service.createUrssafFiling({
				organizationId: 1,
				period: '2024-Q1',
			});

			expect(filings.create).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'URSSAF_QUARTERLY',
				})
			);
		});

		it('devrait rejeter un format de période invalide', async () => {
			jest.spyOn(prisma.organization, 'findUnique').mockResolvedValue(mockOrganization as any);

			await expect(
				service.createUrssafFiling({
					organizationId: 1,
					period: 'invalid-format',
				})
			).rejects.toThrow('Format de période invalide');
		});
	});

	describe('updateOrganizationUrssaf', () => {
		it('devrait mettre à jour la configuration URSSAF', async () => {
			const updatedOrg = {
				...mockOrganization,
				urssafActivity: UrssafActivity.VENTE,
				urssafFiscalOption: true,
			};

			jest.spyOn(prisma.organization, 'findUnique').mockResolvedValue(mockOrganization as any);
			jest.spyOn(prisma.organization, 'update').mockResolvedValue(updatedOrg as any);

			const result = await service.updateOrganizationUrssaf(1, {
				urssafActivity: UrssafActivity.VENTE,
				urssafFiscalOption: true,
			});

			expect(prisma.organization.update).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { id: 1 },
					data: expect.objectContaining({
						urssafActivity: UrssafActivity.VENTE,
						urssafFiscalOption: true,
					}),
				})
			);
		});
	});
});

