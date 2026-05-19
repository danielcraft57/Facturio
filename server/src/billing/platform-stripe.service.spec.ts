import { BadRequestException } from '@nestjs/common';
import { SaasBillingPlan } from '@prisma/client';
import { PlatformStripeService } from './platform-stripe.service';

const mockStripe = {
	customers: { create: jest.fn(), retrieve: jest.fn(), update: jest.fn() },
	checkout: { sessions: { create: jest.fn(), list: jest.fn() } },
	billingPortal: { sessions: { create: jest.fn() } },
	subscriptions: { retrieve: jest.fn(), list: jest.fn() },
	invoices: { retrieve: jest.fn() },
	webhooks: { constructEvent: jest.fn() },
};

jest.mock('../stripe/stripe-client', () => ({
	createStripeClient: jest.fn(() => mockStripe),
}));

describe('PlatformStripeService', () => {
	const prisma = {
		organization: {
			findUnique: jest.fn(),
			findFirst: jest.fn(),
			update: jest.fn(),
		},
		stripePlatformEvent: {
			findUnique: jest.fn(),
			create: jest.fn(),
		},
		user: { findFirst: jest.fn() },
	};

	const config = {
		stripeSecretKey: 'sk_test_xxx',
		stripeWebhookSecret: 'whsec_test',
		stripePublishableKey: 'pk_test',
		billingCheckoutSuccessUrl: 'http://localhost:5173/parametres/abonnement?billing=success',
		billingCheckoutCancelUrl: 'http://localhost:5173/parametres/abonnement?billing=cancelled',
		billingPortalReturnUrl: 'http://localhost:5173/parametres/abonnement',
		stripeCheckoutDisplayName: 'Facturio',
		stripeCheckoutBorderRadius: 'rounded',
		stripeCheckoutFontFamily: 'roboto',
		stripeCheckoutLogoFileId: '',
		stripeCheckoutPaymentMethodTypes: ['card', 'paypal'],
	};

	const emailService = {
		sendSubscriptionActivated: jest.fn(),
		sendSubscriptionPaymentFailed: jest.fn(),
		sendSubscriptionCanceled: jest.fn(),
		sendSubscriptionInvoice: jest.fn(),
	};

	const pdfService = {
		generateSubscriptionInvoicePdf: jest.fn().mockResolvedValue(Buffer.from('pdf')),
	};

	let service: PlatformStripeService;

	beforeEach(() => {
		jest.clearAllMocks();
		mockStripe.customers.update.mockResolvedValue({});
		service = new PlatformStripeService(
			config as any,
			prisma as any,
			emailService as any,
			pdfService as any,
		);
	});

	describe('createCheckoutSession', () => {
		it('crée une session checkout avec customer existant', async () => {
			prisma.organization.findUnique.mockResolvedValue({
				id: 1,
				name: 'ACME',
				legalName: null,
				stripeCustomerId: 'cus_1',
			});
			mockStripe.customers.retrieve.mockResolvedValue({ id: 'cus_1' });
			mockStripe.checkout.sessions.create.mockResolvedValue({ url: 'https://checkout.stripe.com/x' });

			const result = await service.createCheckoutSession(1, 'admin@test.fr', 'PRO');

			expect(result.url).toContain('checkout.stripe.com');
			expect(mockStripe.customers.retrieve).toHaveBeenCalledWith('cus_1');
			expect(mockStripe.customers.update).toHaveBeenCalled();
			expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
				expect.objectContaining({
					mode: 'subscription',
					customer: 'cus_1',
					payment_method_types: ['card', 'paypal'],
					wallet_options: { link: { display: 'never' } },
					success_url: expect.stringContaining('plan=PRO'),
					metadata: expect.objectContaining({ billingSchedule: 'MONTHLY' }),
					line_items: [
						expect.objectContaining({
							price_data: expect.objectContaining({
								unit_amount: 1200,
								recurring: { interval: 'month', interval_count: 1 },
							}),
						}),
					],
				}),
			);
		});

		it('facture trimestrielle (interval_count 3)', async () => {
			prisma.organization.findUnique.mockResolvedValue({
				id: 1,
				name: 'ACME',
				legalName: null,
				stripeCustomerId: 'cus_1',
			});
			mockStripe.customers.retrieve.mockResolvedValue({ id: 'cus_1' });
			mockStripe.checkout.sessions.create.mockResolvedValue({ url: 'https://checkout.stripe.com/x' });

			await service.createCheckoutSession(1, 'admin@test.fr', 'PRO', { billingSchedule: 'QUARTERLY' });

			expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
				expect.objectContaining({
					metadata: expect.objectContaining({ billingSchedule: 'QUARTERLY' }),
					line_items: [
						expect.objectContaining({
							price_data: expect.objectContaining({
								unit_amount: 3600,
								recurring: { interval: 'month', interval_count: 3 },
							}),
						}),
					],
				}),
			);
		});

		it('paiement unique 12 mois (mode payment)', async () => {
			prisma.organization.findUnique.mockResolvedValue({
				id: 1,
				name: 'ACME',
				legalName: null,
				stripeCustomerId: 'cus_1',
			});
			mockStripe.customers.retrieve.mockResolvedValue({ id: 'cus_1' });
			mockStripe.checkout.sessions.create.mockResolvedValue({ url: 'https://checkout.stripe.com/z' });

			await service.createCheckoutSession(1, 'admin@test.fr', 'PRO', { billingSchedule: 'YEARLY_UPFRONT' });

			expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
				expect.objectContaining({
					mode: 'payment',
					metadata: expect.objectContaining({ billingSchedule: 'YEARLY_UPFRONT' }),
					line_items: [
						expect.objectContaining({
							price_data: expect.objectContaining({
								unit_amount: 14400,
							}),
						}),
					],
				}),
			);
		});

		it('recrée un client Stripe si l’ID en base n’existe plus sur ce compte', async () => {
			prisma.organization.findUnique.mockResolvedValue({
				id: 1,
				name: 'ACME',
				legalName: null,
				stripeCustomerId: 'cus_live_only',
			});
			mockStripe.customers.retrieve.mockRejectedValue(
				Object.assign(new Error("No such customer: 'cus_live_only'"), { code: 'resource_missing' }),
			);
			prisma.organization.update.mockResolvedValue({});
			mockStripe.customers.create.mockResolvedValue({ id: 'cus_new' });
			mockStripe.checkout.sessions.create.mockResolvedValue({ url: 'https://checkout.stripe.com/y' });

			const result = await service.createCheckoutSession(1, 'admin@test.fr', 'PRO');

			expect(result.url).toContain('checkout.stripe.com');
			expect(prisma.organization.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: {
					stripeCustomerId: null,
					stripeSubscriptionId: null,
					saasSubscriptionStatus: null,
				},
			});
			expect(mockStripe.customers.create).toHaveBeenCalled();
			expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
				expect.objectContaining({ customer: 'cus_new' }),
			);
		});
	});

	describe('handlePlatformWebhook', () => {
		it('ignore les événements déjà traités (idempotence)', async () => {
			mockStripe.webhooks.constructEvent.mockReturnValue({
				id: 'evt_dup',
				type: 'checkout.session.completed',
				data: { object: {} },
			});
			prisma.stripePlatformEvent.findUnique.mockResolvedValue({ id: 1, eventId: 'evt_dup' });

			const result = await service.handlePlatformWebhook(Buffer.from('{}'), 'sig');

			expect(result.received).toBe(true);
			expect(prisma.organization.update).not.toHaveBeenCalled();
		});

		it('active le plan PRO après checkout.session.completed', async () => {
			mockStripe.webhooks.constructEvent.mockReturnValue({
				id: 'evt_1',
				type: 'checkout.session.completed',
				data: {
					object: {
						mode: 'subscription',
						payment_status: 'paid',
						subscription: 'sub_1',
						metadata: { organizationId: '1', saasPlan: 'PRO' },
					},
				},
			});
			prisma.stripePlatformEvent.findUnique.mockResolvedValue(null);
			prisma.stripePlatformEvent.create.mockResolvedValue({});
			mockStripe.subscriptions.retrieve.mockResolvedValue({
				status: 'active',
				current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
				latest_invoice: 'in_1',
			});
			prisma.organization.update.mockResolvedValue({});
			prisma.organization.findUnique
				.mockResolvedValueOnce({ saasPlan: SaasBillingPlan.FREE })
				.mockResolvedValueOnce({ email: 'org@test.fr' });
			prisma.organization.findFirst.mockResolvedValue({ id: 1, stripeCustomerId: 'cus_1' });
			mockStripe.invoices.retrieve.mockResolvedValue({
				customer: 'cus_1',
				number: 'FAC-001',
				amount_paid: 1200,
				subtotal: 1000,
				tax: 200,
				total: 1200,
				created: Math.floor(Date.now() / 1000),
				lines: { data: [{ description: 'Facturio Pro', quantity: 1, amount: 1200 }] },
			});
			prisma.organization.findFirst.mockResolvedValue({
				id: 1,
				name: 'ACME',
				legalName: 'ACME SARL',
				stripeCustomerId: 'cus_1',
				email: 'billing@acme.fr',
			});

			await service.handlePlatformWebhook(Buffer.from('{}'), 'sig');

			expect(prisma.organization.update).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { id: 1 },
					data: expect.objectContaining({ saasPlan: SaasBillingPlan.PRO, stripeSubscriptionId: 'sub_1' }),
				}),
			);
			expect(emailService.sendSubscriptionActivated).toHaveBeenCalled();
		});

		it('active le plan PRO après paiement unique 12 mois (checkout payment)', async () => {
			mockStripe.webhooks.constructEvent.mockReturnValue({
				id: 'evt_yearly',
				type: 'checkout.session.completed',
				data: {
					object: {
						mode: 'payment',
						payment_status: 'paid',
						metadata: {
							organizationId: '1',
							saasPlan: 'PRO',
							billingSchedule: 'YEARLY_UPFRONT',
						},
					},
				},
			});
			prisma.stripePlatformEvent.findUnique.mockResolvedValue(null);
			prisma.stripePlatformEvent.create.mockResolvedValue({});
			prisma.organization.update.mockResolvedValue({});
			prisma.organization.findUnique
				.mockResolvedValueOnce({ saasPlan: SaasBillingPlan.FREE })
				.mockResolvedValueOnce({ email: 'org@test.fr' });

			await service.handlePlatformWebhook(Buffer.from('{}'), 'sig');

			expect(prisma.organization.update).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { id: 1 },
					data: expect.objectContaining({
						saasPlan: SaasBillingPlan.PRO,
						stripeSubscriptionId: null,
						saasSubscriptionStatus: 'active',
						saasPlanExpiresAt: expect.any(Date),
					}),
				}),
			);
			expect(emailService.sendSubscriptionActivated).toHaveBeenCalled();
		});

		it('rejette une signature invalide', async () => {
			mockStripe.webhooks.constructEvent.mockImplementation(() => {
				throw new Error('Invalid signature');
			});

			await expect(service.handlePlatformWebhook(Buffer.from('{}'), 'bad')).rejects.toBeInstanceOf(
				BadRequestException,
			);
		});

		it('repasse en FREE sur subscription deleted', async () => {
			mockStripe.webhooks.constructEvent.mockReturnValue({
				id: 'evt_2',
				type: 'customer.subscription.deleted',
				data: {
					object: {
						id: 'sub_1',
						status: 'canceled',
						metadata: { organizationId: '1', saasPlan: 'PRO' },
					},
				},
			});
			prisma.stripePlatformEvent.findUnique.mockResolvedValue(null);
			prisma.stripePlatformEvent.create.mockResolvedValue({});
			prisma.organization.findUnique.mockResolvedValue({
				saasPlan: SaasBillingPlan.PRO,
				email: 'org@test.fr',
			});
			prisma.organization.update.mockResolvedValue({});

			await service.handlePlatformWebhook(Buffer.from('{}'), 'sig');

			expect(prisma.organization.update).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({ saasPlan: SaasBillingPlan.FREE, stripeSubscriptionId: null }),
				}),
			);
			expect(emailService.sendSubscriptionCanceled).toHaveBeenCalled();
		});
	});

	describe('syncOrganizationFromStripe', () => {
		it('active le plan depuis un abonnement Stripe actif', async () => {
			prisma.organization.findUnique
				.mockResolvedValueOnce({
					id: 1,
					saasPlan: SaasBillingPlan.FREE,
					saasSubscriptionStatus: null,
					stripeCustomerId: 'cus_1',
				})
				.mockResolvedValueOnce({ email: 'org@test.fr' });
			mockStripe.subscriptions.list.mockResolvedValue({
				data: [
					{
						id: 'sub_1',
						status: 'active',
						cancel_at_period_end: true,
						current_period_end: Math.floor(Date.now() / 1000) + 86400,
						metadata: { saasPlan: 'PRO', organizationId: '1' },
						latest_invoice: 'in_1',
					},
				],
			});
			prisma.organization.update.mockResolvedValue({});
			prisma.organization.findFirst.mockResolvedValue({ id: 1, stripeCustomerId: 'cus_1' });
			prisma.stripePlatformEvent.findUnique.mockResolvedValue(null);
			prisma.stripePlatformEvent.create.mockResolvedValue({});
			mockStripe.invoices.retrieve.mockResolvedValue({
				customer: 'cus_1',
				number: 'FAC-002',
				amount_paid: 1200,
				invoice_pdf: 'https://pay.stripe.com/invoice/pdf/test2',
			});
			global.fetch = jest.fn().mockResolvedValue({
				ok: true,
				arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
			}) as typeof fetch;

			const result = await service.syncOrganizationFromStripe(1);

			expect(result.synced).toBe(true);
			expect(result.plan).toBe(SaasBillingPlan.PRO);
			expect(prisma.organization.update).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({ saasSubscriptionStatus: 'cancel_at_period_end' }),
				}),
			);
		});

		it('enregistre cancel_at_period_end sur subscription.updated', async () => {
			mockStripe.webhooks.constructEvent.mockReturnValue({
				id: 'evt_cancel_end',
				type: 'customer.subscription.updated',
				data: {
					object: {
						id: 'sub_1',
						status: 'active',
						cancel_at_period_end: true,
						current_period_end: Math.floor(Date.now() / 1000) + 86400 * 20,
						metadata: { organizationId: '1', saasPlan: 'PRO' },
					},
				},
			});
			prisma.stripePlatformEvent.findUnique.mockResolvedValue(null);
			prisma.stripePlatformEvent.create.mockResolvedValue({});
			prisma.organization.update.mockResolvedValue({});

			await service.handlePlatformWebhook(Buffer.from('{}'), 'sig');

			expect(prisma.organization.update).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { id: 1 },
					data: expect.objectContaining({
						saasPlan: SaasBillingPlan.PRO,
						saasSubscriptionStatus: 'cancel_at_period_end',
					}),
				}),
			);
			expect(emailService.sendSubscriptionCanceled).not.toHaveBeenCalled();
		});
	});

	describe('createPortalSession', () => {
		it('exige un stripeCustomerId', async () => {
			prisma.organization.findUnique.mockResolvedValue({ stripeCustomerId: null });
			await expect(service.createPortalSession(1)).rejects.toBeInstanceOf(BadRequestException);
		});
	});
});
