#!/usr/bin/env node
/**
 * Envoie l'email de bienvenue beta aux testeurs déjà inscrits (betaTesterAt renseigné).
 *
 * Usage (depuis server/) :
 *   npm run beta:welcome-emails
 *   npm run beta:welcome-emails -- --dry-run
 *   npm run beta:welcome-emails -- --force
 *
 * Prérequis :
 *   - Migration betaWelcomeEmailSentAt appliquée
 *   - BETA_TESTER_SURVEY_URL (optionnel) : lien Google Form
 *   - SMTP configuré (.env)
 */

import * as path from 'path';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { EmailService } from '../src/common/email.service';
import { BetaTesterService } from '../src/billing/beta-tester.service';

config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();
const email = new EmailService();
const betaTester = new BetaTesterService(prisma as never, email);

function parseFlags(argv: string[]): { dryRun: boolean; force: boolean } {
	let dryRun = false;
	let force = false;
	for (const arg of argv) {
		if (arg === '--dry-run') dryRun = true;
		if (arg === '--force') force = true;
	}
	return { dryRun, force };
}

async function main(): Promise<void> {
	const { dryRun, force } = parseFlags(process.argv.slice(2));

	const orgs = await prisma.organization.findMany({
		where: { betaTesterAt: { not: null } },
		orderBy: { betaTesterAt: 'asc' },
		select: {
			id: true,
			name: true,
			betaTesterAt: true,
			betaWelcomeEmailSentAt: true,
			saasPlanExpiresAt: true,
			betaInviteRedemption: {
				select: {
					betaInviteCode: { select: { code: true } },
				},
			},
			users: {
				where: { role: 'ADMIN' },
				orderBy: { id: 'asc' },
				take: 1,
				select: { email: true, firstName: true },
			},
		},
	});

	if (orgs.length === 0) {
		console.log('Aucun testeur beta inscrit.');
		return;
	}

	console.log(`Testeurs beta : ${orgs.length}`);
	if (!process.env.BETA_TESTER_SURVEY_URL?.trim()) {
		console.warn(
			'⚠ BETA_TESTER_SURVEY_URL absent — email sans lien questionnaire (réponse par reply-to).',
		);
	}

	let sent = 0;
	let skipped = 0;

	for (const org of orgs) {
		const admin = org.users[0];
		const label = `${org.name} (#${org.id}) — ${admin?.email ?? 'sans email'}`;
		if (!force && org.betaWelcomeEmailSentAt) {
			console.log(`⏭ Déjà envoyé : ${label}`);
			skipped += 1;
			continue;
		}
		if (dryRun) {
			console.log(`[dry-run] Enverrait à : ${label}`);
			sent += 1;
			continue;
		}
		const code = org.betaInviteRedemption?.betaInviteCode?.code ?? null;
		const result = await betaTester.sendWelcomeEmail(org.id, code, undefined, force);
		if (result.sent) {
			console.log(`✅ Envoyé : ${label}`);
			sent += 1;
		} else {
			console.log(`⏭ Ignoré (${result.reason}) : ${label}`);
			skipped += 1;
		}
	}

	console.log(`\nTerminé — ${sent} envoyé(s), ${skipped} ignoré(s).`);
}

main()
	.catch((err) => {
		console.error(err);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
