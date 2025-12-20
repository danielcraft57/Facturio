import { PrismaClient } from '@prisma/client';
import type { SeedContext } from './base.seed';

export async function seedSubscriptions(prisma: PrismaClient, clients: any[], plans: any): Promise<void> {
	const now = new Date();
	const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
	const nextYear = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

	// Abonnement 1: ACTIVE mensuel
	await prisma.subscription.create({
		data: {
			clientId: clients[0].id, // ACME France
			planId: plans.planMonthly.id,
			status: 'ACTIVE',
			quantity: 5,
			startDate: new Date(now.getFullYear(), 0, 1),
			currentPeriodStart: now,
			currentPeriodEnd: nextMonth
		}
	});

	// Abonnement 2: ACTIVE annuel
	await prisma.subscription.create({
		data: {
			clientId: clients[6].id, // Startup Innovante
			planId: plans.planYearly.id,
			status: 'ACTIVE',
			quantity: 1,
			startDate: new Date(now.getFullYear(), 0, 15),
			currentPeriodStart: new Date(now.getFullYear(), 0, 15),
			currentPeriodEnd: nextYear
		}
	});

	// Abonnement 3: TRIALING
	await prisma.subscription.create({
		data: {
			clientId: clients[5].id, // TechCorp Belgium
			planId: plans.planMonthly.id,
			status: 'TRIALING',
			quantity: 1,
			startDate: new Date(now.getFullYear(), now.getMonth() - 1, 20),
			currentPeriodStart: new Date(now.getFullYear(), now.getMonth() - 1, 20),
			currentPeriodEnd: new Date(now.getFullYear(), now.getMonth(), 20)
		}
	});

	// Abonnement 4: PAST_DUE
	await prisma.subscription.create({
		data: {
			clientId: clients[1].id, // EU GmbH
			planId: plans.planMonthly.id,
			status: 'PAST_DUE',
			quantity: 2,
			startDate: new Date(now.getFullYear(), now.getMonth() - 2, 1),
			currentPeriodStart: new Date(now.getFullYear(), now.getMonth() - 1, 1),
			currentPeriodEnd: new Date(now.getFullYear(), now.getMonth(), 1)
		}
	});

	// Abonnement 5: CANCELED (cancelAtPeriodEnd)
	await prisma.subscription.create({
		data: {
			clientId: clients[3].id, // Jean Client
			planId: plans.planMonthly.id,
			status: 'ACTIVE',
			quantity: 1,
			cancelAtPeriodEnd: true,
			canceledAt: new Date(),
			startDate: new Date(now.getFullYear(), now.getMonth() - 3, 1),
			currentPeriodStart: now,
			currentPeriodEnd: nextMonth
		}
	});
}

