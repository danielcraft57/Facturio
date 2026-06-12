#!/usr/bin/env node
/**
 * Gestion des codes beta testeurs (réutilisables, 3–6 caractères).
 *
 * Exemples :
 *   node scripts/generate-beta-invite-codes.js create DEV26 FACTIO --label="Twitter"
 *   node scripts/generate-beta-invite-codes.js random 3 --note="Campagne LinkedIn"
 *   node scripts/generate-beta-invite-codes.js list
 *   node scripts/generate-beta-invite-codes.js stats
 *   node scripts/generate-beta-invite-codes.js disable DEV26
 *   node scripts/generate-beta-invite-codes.js enable DEV26
 *
 * Variables (.env) : BETA_TESTER_MAX_SLOTS, BETA_TESTER_DURATION_DAYS,
 *   BETA_TESTER_PROGRAM_ENDS_AT, BETA_TESTER_CODE_MIN_LENGTH, BETA_TESTER_CODE_MAX_LENGTH
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

const CODE_MIN = Number(process.env.BETA_TESTER_CODE_MIN_LENGTH ?? 3);
const CODE_MAX = Number(process.env.BETA_TESTER_CODE_MAX_LENGTH ?? 6);

const VOCAB_ROOTS = [
	'DEV', 'FACT', 'FREE', 'PRO', 'CODE', 'STACK', 'WEB', 'API', 'BETA', 'SHIP',
	'BUILD', 'SHIP', 'CRAFT', 'TECH', 'SAAS', 'MVP', 'SHIP', 'LIVE', 'GO',
];

function usage() {
	console.log(`
Usage:
  node scripts/generate-beta-invite-codes.js create <CODE> [CODE2…] [--label="…"] [--note="…"] [--expires=YYYY-MM-DD] [--max=N]
  node scripts/generate-beta-invite-codes.js random <count> [--label="…"] [--note="…"] [--expires=YYYY-MM-DD] [--max=N]
  node scripts/generate-beta-invite-codes.js list [--active]
  node scripts/generate-beta-invite-codes.js stats
  node scripts/generate-beta-invite-codes.js disable <CODE>
  node scripts/generate-beta-invite-codes.js enable <CODE>

Codes : ${CODE_MIN} à ${CODE_MAX} caractères (A-Z, 0-9), réutilisables jusqu'au plafond global.
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

function normalizeCode(raw) {
	return String(raw).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function assertCodeFormat(code) {
	if (!code) throw new Error('Code vide.');
	if (code.length < CODE_MIN || code.length > CODE_MAX) {
		throw new Error(`Le code "${code}" doit faire entre ${CODE_MIN} et ${CODE_MAX} caractères.`);
	}
	if (!/^[A-Z0-9]+$/.test(code)) {
		throw new Error(`Le code "${code}" ne peut contenir que A-Z et 0-9.`);
	}
}

function parseExpires(flags) {
	if (!flags.expires) return null;
	const d = new Date(`${flags.expires}T23:59:59.999Z`);
	if (Number.isNaN(d.getTime())) throw new Error('--expires invalide (YYYY-MM-DD)');
	return d;
}

function parseMax(flags) {
	if (flags.max == null) return null;
	const n = Number(flags.max);
	if (!Number.isFinite(n) || n < 1) throw new Error('--max doit être un entier >= 1');
	return Math.floor(n);
}

async function randomUniqueCode() {
	for (let attempt = 0; attempt < 50; attempt += 1) {
		const root = VOCAB_ROOTS[crypto.randomInt(0, VOCAB_ROOTS.length)];
		const suffix = crypto.randomInt(0, 100).toString().padStart(2, '0');
		let code = `${root}${suffix}`.slice(0, CODE_MAX);
		if (code.length < CODE_MIN) code = code.padEnd(CODE_MIN, 'X');
		const existing = await prisma.betaInviteCode.findUnique({ where: { code } });
		if (!existing) return code;
	}
	const fallback = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, CODE_MAX);
	return fallback.length >= CODE_MIN ? fallback : fallback.padEnd(CODE_MIN, '0');
}

async function cmdCreate(codes, flags) {
	if (codes.length === 0) throw new Error('Indiquez au moins un code.');
	const expiresAt = parseExpires(flags);
	const maxRedemptions = parseMax(flags);
	const label = flags.label != null ? String(flags.label) : null;
	const note = flags.note != null ? String(flags.note) : null;
	const created = [];

	for (const raw of codes) {
		const code = normalizeCode(raw);
		assertCodeFormat(code);
		const row = await prisma.betaInviteCode.upsert({
			where: { code },
			create: { code, label, note, expiresAt, maxRedemptions, active: true },
			update: {
				label: label ?? undefined,
				note: note ?? undefined,
				expiresAt: expiresAt ?? undefined,
				maxRedemptions: maxRedemptions ?? undefined,
				active: true,
			},
		});
		created.push(row);
	}

	console.log(`${created.length} code(s) enregistré(s) :\n`);
	for (const row of created) {
		const exp = row.expiresAt ? row.expiresAt.toISOString().slice(0, 10) : '—';
		const max = row.maxRedemptions ?? '∞';
		console.log(
			`  ${row.code}\tinscriptions: ${row.redemptionCount}/${max}\texpire: ${exp}\tlabel: ${row.label ?? '—'}`,
		);
	}
}

async function cmdRandom(count, flags) {
	const n = Number(count);
	if (!Number.isFinite(n) || n <= 0 || n > 50) {
		throw new Error('count doit être entre 1 et 50');
	}
	const codes = [];
	for (let i = 0; i < n; i += 1) {
		codes.push(await randomUniqueCode());
	}
	await cmdCreate(codes, flags);
}

async function cmdList(flags) {
	const onlyActive = Boolean(flags.active);
	const rows = await prisma.betaInviteCode.findMany({
		orderBy: { code: 'asc' },
		include: {
			redemptions: {
				select: {
					redeemedAt: true,
					organization: {
						select: {
							id: true,
							name: true,
							users: { select: { email: true }, take: 1, orderBy: { id: 'asc' } },
						},
					},
				},
				orderBy: { redeemedAt: 'desc' },
				take: 3,
			},
		},
	});

	const filtered = onlyActive ? rows.filter((r) => r.active) : rows;
	if (filtered.length === 0) {
		console.log(onlyActive ? 'Aucun code actif.' : 'Aucun code beta.');
		return;
	}

	console.log('Code\tActif\tInscr.\tMax\tExpire\tLabel\tDernières orgs');
	for (const row of filtered) {
		const exp = row.expiresAt ? row.expiresAt.toISOString().slice(0, 10) : '—';
		const max = row.maxRedemptions ?? '∞';
		const recent = row.redemptions
			.map((r) => `#${r.organization.id} ${r.organization.users[0]?.email ?? ''}`)
			.join('; ');
		console.log(
			`${row.code}\t${row.active ? 'oui' : 'non'}\t${row.redemptionCount}\t${max}\t${exp}\t${row.label ?? '—'}\t${recent || '—'}`,
		);
	}
	console.log(`\n${filtered.length} code(s).`);
}

async function cmdStats() {
	const maxSlots = Number(process.env.BETA_TESTER_MAX_SLOTS ?? 20);
	const durationDays = Number(process.env.BETA_TESTER_DURATION_DAYS ?? 90);
	const programEndsAt = process.env.BETA_TESTER_PROGRAM_ENDS_AT ?? null;
	const totalCodes = await prisma.betaInviteCode.count();
	const activeCodes = await prisma.betaInviteCode.count({ where: { active: true } });
	const enrolled = await prisma.organization.count({ where: { betaTesterAt: { not: null } } });
	const activeBeta = await prisma.organization.count({
		where: { betaTesterAt: { not: null }, saasPlanExpiresAt: { gt: new Date() } },
	});
	const totalRedemptions = await prisma.betaInviteRedemption.count();

	console.log('Programme beta testeurs');
	console.log(`  Plafond testeurs    : ${maxSlots}`);
	console.log(`  Durée d'accès       : ${durationDays} jours`);
	console.log(`  Fin programme       : ${programEndsAt ?? '—'}`);
	console.log(`  Codes en base       : ${totalCodes} (${activeCodes} actifs)`);
	console.log(`  Inscriptions total  : ${totalRedemptions}`);
	console.log(`  Testeurs inscrits   : ${enrolled}`);
	console.log(`  Beta actifs         : ${activeBeta}`);
	console.log(`  Places restantes    : ${Math.max(0, maxSlots - enrolled)}`);
	console.log(`  Format code         : ${CODE_MIN}-${CODE_MAX} car. A-Z0-9`);
}

async function cmdSetActive(code, active) {
	const normalized = normalizeCode(code);
	assertCodeFormat(normalized);
	const row = await prisma.betaInviteCode.update({
		where: { code: normalized },
		data: { active },
	});
	console.log(`Code ${row.code} → ${active ? 'actif' : 'inactif'}`);
}

async function main() {
	const { positional, flags } = parseArgv(process.argv.slice(2));
	const [cmd, ...rest] = positional;

	if (!process.env.DATABASE_URL) {
		console.error('Erreur: DATABASE_URL manquant (.env dans server/).');
		process.exit(1);
	}

	try {
		if (cmd === 'list') {
			await cmdList(flags);
		} else if (cmd === 'stats') {
			await cmdStats();
		} else if (cmd === 'create') {
			await cmdCreate(rest, flags);
		} else if (cmd === 'random') {
			await cmdRandom(rest[0], flags);
		} else if (cmd === 'disable') {
			await cmdSetActive(rest[0], false);
		} else if (cmd === 'enable') {
			await cmdSetActive(rest[0], true);
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
