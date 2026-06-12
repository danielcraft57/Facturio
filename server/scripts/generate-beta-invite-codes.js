#!/usr/bin/env node
/**
 * Génère des codes d'invitation beta testeurs (usage unique).
 *
 * Exemples :
 *   node scripts/generate-beta-invite-codes.js 5
 *   node scripts/generate-beta-invite-codes.js 3 --note="LinkedIn dev freelance"
 *   node scripts/generate-beta-invite-codes.js list
 *   node scripts/generate-beta-invite-codes.js stats
 *
 * Variables utiles (.env) :
 *   BETA_TESTER_MAX_SLOTS=20
 *   BETA_TESTER_DURATION_DAYS=90
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
	const content = fs.readFileSync(envPath, 'utf8');
	content.split('\n').forEach((line) => {
		const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
		if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
	});
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function usage() {
	console.log(`
Usage:
  node scripts/generate-beta-invite-codes.js <count> [--note="…"] [--expires=YYYY-MM-DD]
  node scripts/generate-beta-invite-codes.js list [--pending]
  node scripts/generate-beta-invite-codes.js stats

Les codes ont le format FACTURIO-BETA-XXXXXX (6 caractères alphanumériques).
`);
}

function parseArgv(argv) {
	const positional = [];
	const flags = {};
	for (const arg of argv) {
		if (arg.startsWith('--')) {
			const eq = arg.indexOf('=');
			if (eq === -1) flags[arg.slice(2)] = true;
			else flags[arg.slice(2, eq)] = arg.slice(eq + 1);
		} else {
			positional.push(arg);
		}
	}
	return { positional, flags };
}

function randomCodeSuffix() {
	return crypto.randomBytes(3).toString('hex').toUpperCase();
}

async function generateUniqueCode() {
	for (let attempt = 0; attempt < 20; attempt += 1) {
		const code = `FACTURIO-BETA-${randomCodeSuffix()}`;
		const existing = await prisma.betaInviteCode.findUnique({ where: { code } });
		if (!existing) return code;
	}
	throw new Error('Impossible de générer un code unique après plusieurs tentatives.');
}

async function cmdGenerate(count, flags) {
	const n = Number(count);
	if (!Number.isFinite(n) || n <= 0 || n > 100) {
		throw new Error('count doit être un entier entre 1 et 100');
	}

	let expiresAt = null;
	if (flags.expires) {
		expiresAt = new Date(`${flags.expires}T23:59:59.999Z`);
		if (Number.isNaN(expiresAt.getTime())) {
			throw new Error('--expires invalide (attendu YYYY-MM-DD)');
		}
	}

	const note = flags.note != null ? String(flags.note) : null;
	const created = [];

	for (let i = 0; i < n; i += 1) {
		const code = await generateUniqueCode();
		const row = await prisma.betaInviteCode.create({
			data: { code, note, expiresAt },
		});
		created.push(row);
	}

	console.log(`${created.length} code(s) créé(s) :\n`);
	for (const row of created) {
		const exp = row.expiresAt ? row.expiresAt.toISOString().slice(0, 10) : '—';
		console.log(`  ${row.code}\texpire code: ${exp}\tnote: ${row.note ?? '—'}`);
	}
}

async function cmdList(flags) {
	const onlyPending = Boolean(flags.pending);
	const rows = await prisma.betaInviteCode.findMany({
		orderBy: { id: 'asc' },
		include: {
			redeemedOrganization: {
				select: {
					id: true,
					name: true,
					users: { select: { email: true }, take: 1, orderBy: { id: 'asc' } },
				},
			},
		},
	});

	const filtered = onlyPending ? rows.filter((r) => !r.redeemedAt) : rows;
	if (filtered.length === 0) {
		console.log(onlyPending ? 'Aucun code en attente.' : 'Aucun code beta.');
		return;
	}

	console.log('Code\tStatut\tOrg\tEmail\tNote');
	for (const row of filtered) {
		const status = row.redeemedAt ? `utilisé ${row.redeemedAt.toISOString().slice(0, 10)}` : 'disponible';
		const org = row.redeemedOrganization ? `#${row.redeemedOrganization.id}` : '—';
		const email = row.redeemedOrganization?.users?.[0]?.email ?? '—';
		console.log(`${row.code}\t${status}\t${org}\t${email}\t${row.note ?? '—'}`);
	}
	console.log(`\n${filtered.length} code(s).`);
}

async function cmdStats() {
	const maxSlots = Number(process.env.BETA_TESTER_MAX_SLOTS ?? 20);
	const durationDays = Number(process.env.BETA_TESTER_DURATION_DAYS ?? 90);
	const total = await prisma.betaInviteCode.count();
	const redeemed = await prisma.betaInviteCode.count({ where: { redeemedAt: { not: null } } });
	const pending = total - redeemed;
	const activeBeta = await prisma.organization.count({
		where: {
			betaTesterAt: { not: null },
			saasPlanExpiresAt: { gt: new Date() },
		},
	});

	console.log('Programme beta testeurs');
	console.log(`  Plafond global     : ${maxSlots} places`);
	console.log(`  Durée d'accès      : ${durationDays} jours`);
	console.log(`  Codes générés      : ${total}`);
	console.log(`  Codes utilisés     : ${redeemed}`);
	console.log(`  Codes disponibles  : ${pending}`);
	console.log(`  Beta actifs (org)  : ${activeBeta}`);
	console.log(`  Places restantes   : ${Math.max(0, maxSlots - redeemed)}`);
}

async function main() {
	const { positional, flags } = parseArgv(process.argv.slice(2));
	const [cmd, arg] = positional;

	if (!process.env.DATABASE_URL) {
		console.error('Erreur: DATABASE_URL manquant (.env dans server/).');
		process.exit(1);
	}

	try {
		if (cmd === 'list') {
			await cmdList(flags);
		} else if (cmd === 'stats') {
			await cmdStats();
		} else if (cmd != null && /^\d+$/.test(cmd)) {
			await cmdGenerate(cmd, flags);
		} else {
			usage();
			process.exit(1);
		}
	} catch (e) {
		console.error('Erreur:', e.message || e);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

main();
