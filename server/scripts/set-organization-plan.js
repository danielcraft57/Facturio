#!/usr/bin/env node
/**
 * Changement manuel du plan SaaS d'une organisation (production).
 * À exécuter sur le serveur : cd /opt/facturio/server && node scripts/set-organization-plan.js …
 *
 * Prérequis : .env avec DATABASE_URL (PostgreSQL), client Prisma généré (npm run prisma:prod).
 *
 * Plans : FREE | PRO | PRO_EFACTURE | AGENCY
 * Alias : free, pro, pro-efacture, pro_efacture, efacture, agency, agence
 *
 * Afficher le plan d'un compte (email ou id org) :
 *   node scripts/set-organization-plan.js show user@example.com
 *   node scripts/set-organization-plan.js show org:42
 *
 * Passer en Pro (sans date de fin) :
 *   node scripts/set-organization-plan.js set user@example.com pro
 *
 * Pro + e-facture pour 12 mois :
 *   node scripts/set-organization-plan.js set user@example.com pro-efacture --months=12
 *
 * Repasser en Free (et détacher l'abonnement Stripe côté PrestaFacture) :
 *   node scripts/set-organization-plan.js set user@example.com free --clear-subscription
 *
 * Simulation sans écriture :
 *   node scripts/set-organization-plan.js set user@example.com pro --dry-run
 *
 * Lister les organisations et leurs plans :
 *   node scripts/set-organization-plan.js list
 *   node scripts/set-organization-plan.js list --plan=PRO
 */

const path = require('path');
const fs = require('fs');

const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  });
}

const { PrismaClient, SaasBillingPlan } = require('@prisma/client');

const prisma = new PrismaClient();

const VALID_PLANS = Object.values(SaasBillingPlan);

const PLAN_LABELS = {
  FREE: 'Free',
  PRO: 'Pro',
  PRO_EFACTURE: 'Pro + e-facture',
  AGENCY: 'Agence',
};

const PLAN_ALIASES = {
  free: 'FREE',
  pro: 'PRO',
  pro_efacture: 'PRO_EFACTURE',
  'pro-efacture': 'PRO_EFACTURE',
  'pro+efacture': 'PRO_EFACTURE',
  efacture: 'PRO_EFACTURE',
  proefacture: 'PRO_EFACTURE',
  agency: 'AGENCY',
  agence: 'AGENCY',
};

function usage() {
  console.log(`
Usage:
  node scripts/set-organization-plan.js show <email|org:id>
  node scripts/set-organization-plan.js set <email|org:id> <plan> [options]
  node scripts/set-organization-plan.js list [--plan=FREE|PRO|...]

Cible : email de connexion ou org:42 / #42

Plans (alias CLI → enum) :
  free              → FREE
  pro               → PRO
  pro-efacture      → PRO_EFACTURE  (alias pro_efacture, efacture)
  agency, agence    → AGENCY

Exemples :
  node scripts/set-organization-plan.js set user@example.com pro
  node scripts/set-organization-plan.js set user@example.com agency --months=12
  node scripts/set-organization-plan.js set user@example.com free --clear-subscription
  npm run plan:set -- user@example.com pro-efacture --months=12

Options (set) :
  --months=N           Fin d'accès dans N mois (plans payants)
  --expires=YYYY-MM-DD Fin d'accès à cette date (23:59 UTC)
  --clear-subscription Détache stripeSubscriptionId + statut (recommandé si passage en Free)
  --dry-run            Affiche la modification sans l'appliquer

Doc : docs/deployment/SCRIPTS_EXPLOITATION_PRODUCTION.md
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

function normalizePlan(input) {
  if (!input) return null;
  const raw = String(input).trim();
  const upper = raw.toUpperCase().replace(/-/g, '_');
  if (VALID_PLANS.includes(upper)) return upper;
  const alias = PLAN_ALIASES[raw.toLowerCase()];
  if (alias) return alias;
  return null;
}

function parseExpiresAt(flags, plan) {
  if (plan === 'FREE') return null;
  if (flags.months != null) {
    const n = Number(flags.months);
    if (!Number.isFinite(n) || n <= 0) {
      throw new Error('--months doit être un entier positif');
    }
    const d = new Date();
    d.setMonth(d.getMonth() + Math.floor(n));
    return d;
  }
  if (flags.expires != null) {
    const d = new Date(`${flags.expires}T23:59:59.999Z`);
    if (Number.isNaN(d.getTime())) {
      throw new Error('--expires invalide (attendu YYYY-MM-DD)');
    }
    return d;
  }
  return null;
}

function parseTarget(target) {
  if (!target) return null;
  const orgMatch = target.match(/^org:(\d+)$/i) || target.match(/^#(\d+)$/);
  if (orgMatch) return { organizationId: Number(orgMatch[1]) };
  return { email: target.trim().toLowerCase() };
}

async function resolveOrganization(target) {
  const parsed = parseTarget(target);
  if (!parsed) throw new Error('Cible manquante (email ou org:ID)');

  if (parsed.organizationId != null) {
    const org = await prisma.organization.findUnique({
      where: { id: parsed.organizationId },
      include: {
        users: { select: { id: true, email: true, role: true, status: true }, orderBy: { id: 'asc' } },
      },
    });
    if (!org) throw new Error(`Organisation #${parsed.organizationId} introuvable`);
    return org;
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.email },
    include: {
      organization: {
        include: {
          users: { select: { id: true, email: true, role: true, status: true }, orderBy: { id: 'asc' } },
        },
      },
    },
  });
  if (!user) throw new Error(`Utilisateur "${parsed.email}" introuvable`);
  if (!user.organization) throw new Error(`Utilisateur "${parsed.email}" sans organisation`);
  return user.organization;
}

function formatPlanLine(org) {
  const label = PLAN_LABELS[org.saasPlan] ?? org.saasPlan;
  const expires =
    org.saasPlanExpiresAt != null ? org.saasPlanExpiresAt.toISOString().slice(0, 10) : '—';
  const stripeSub = org.stripeSubscriptionId ? 'oui' : 'non';
  return (
    `Organisation #${org.id} "${org.name}"\n` +
    `  Plan        : ${org.saasPlan} (${label})\n` +
    `  Expire le   : ${expires}\n` +
    `  Statut SaaS : ${org.saasSubscriptionStatus ?? '—'}\n` +
    `  Stripe sub  : ${stripeSub} (${org.stripeSubscriptionId ?? '—'})\n` +
    `  Client Stripe: ${org.stripeCustomerId ?? '—'}`
  );
}

async function cmdShow(target) {
  const org = await resolveOrganization(target);
  console.log(formatPlanLine(org));
  if (org.users?.length) {
    console.log('  Utilisateurs :');
    for (const u of org.users) {
      console.log(`    - ${u.email} (${u.role}, ${u.status})`);
    }
  }
}

async function cmdList(flags) {
  const filterPlan = flags.plan ? normalizePlan(flags.plan) : null;
  if (flags.plan && !filterPlan) {
    throw new Error(`Plan filtre invalide : ${flags.plan}`);
  }

  const orgs = await prisma.organization.findMany({
    select: {
      id: true,
      name: true,
      saasPlan: true,
      saasPlanExpiresAt: true,
      saasSubscriptionStatus: true,
      stripeSubscriptionId: true,
      _count: { select: { users: true } },
    },
    orderBy: { id: 'asc' },
  });

  const filtered = filterPlan ? orgs.filter((o) => o.saasPlan === filterPlan) : orgs;
  if (filtered.length === 0) {
    console.log(filterPlan ? `Aucune organisation en plan ${filterPlan}.` : 'Aucune organisation.');
    return;
  }

  console.log(`ID\tPlan\t\tExpire\t\tUsers\tOrganisation`);
  for (const o of filtered) {
    const exp = o.saasPlanExpiresAt ? o.saasPlanExpiresAt.toISOString().slice(0, 10) : '—';
    console.log(`${o.id}\t${o.saasPlan}\t${exp}\t${o._count.users}\t${o.name}`);
  }
  console.log(`\n${filtered.length} organisation(s).`);
}

async function cmdSet(target, planInput, flags) {
  const plan = normalizePlan(planInput);
  if (!plan) {
    console.error(`Plan invalide : "${planInput}"`);
    usage();
    process.exit(1);
  }

  const org = await resolveOrganization(target);
  const expiresAt = parseExpiresAt(flags, plan);
  const clearSubscription = Boolean(flags['clear-subscription']);
  const dryRun = Boolean(flags['dry-run']);

  const data = {
    saasPlan: plan,
    saasPlanExpiresAt: expiresAt,
  };

  if (plan === 'FREE') {
    data.saasPlanExpiresAt = null;
    data.saasSubscriptionStatus = null;
    if (clearSubscription) {
      data.stripeSubscriptionId = null;
    }
  } else {
    data.saasSubscriptionStatus = 'admin_manual';
    if (clearSubscription) {
      data.stripeSubscriptionId = null;
    }
  }

  console.log(formatPlanLine(org));
  console.log('\n→ Modification prévue :');
  console.log(`  Plan        : ${org.saasPlan} → ${data.saasPlan} (${PLAN_LABELS[plan]})`);
  console.log(
    `  Expire le   : ${org.saasPlanExpiresAt?.toISOString().slice(0, 10) ?? '—'} → ${
      data.saasPlanExpiresAt?.toISOString().slice(0, 10) ?? '— (illimité)'
    }`,
  );
  console.log(
    `  Statut SaaS : ${org.saasSubscriptionStatus ?? '—'} → ${data.saasSubscriptionStatus ?? '—'}`,
  );
  if (clearSubscription) {
    console.log(
      `  Stripe sub  : ${org.stripeSubscriptionId ?? '—'} → ${data.stripeSubscriptionId ?? '—'}`,
    );
  }

  if (org.stripeSubscriptionId && plan === 'FREE' && !clearSubscription) {
    console.warn(
      '\n⚠ Abonnement Stripe encore lié — une synchro webhook pourrait réactiver un plan payant.',
      'Ajoutez --clear-subscription ou annulez l’abonnement dans Stripe.',
    );
  }

  if (dryRun) {
    console.log('\n(dry-run — aucune écriture en base)');
    return;
  }

  // Prod : saasPlan peut être TEXT (migration initiale) — SQL direct, sans cast enum Prisma.
  await applyPlanUpdate(org.id, data, clearSubscription);

  const updated = await prisma.organization.findUnique({
    where: { id: org.id },
    include: {
      users: { select: { email: true }, orderBy: { id: 'asc' } },
    },
  });

  console.log('\n✓ Plan mis à jour.');
  console.log(formatPlanLine(updated));
  if (updated.users.length) {
    console.log(`  Comptes : ${updated.users.map((u) => u.email).join(', ')}`);
  }
}

/** @param {number} organizationId */
async function applyPlanUpdate(organizationId, data, clearSubscription) {
  const payload = { ...data };
  if (clearSubscription) payload.stripeSubscriptionId = null;

  try {
    await prisma.organization.update({ where: { id: organizationId }, data: payload });
    return;
  } catch (err) {
    const msg = String(err.message || err);
    const enumMismatch =
      msg.includes('SaasBillingPlan') || msg.includes('42704') || msg.includes('42804');
    if (!enumMismatch) throw err;
  }

  // Ancienne prod : colonne TEXT sans enum PostgreSQL
  if (clearSubscription) {
    await prisma.$executeRaw`
      UPDATE "Organization"
      SET
        "saasPlan" = ${data.saasPlan},
        "saasPlanExpiresAt" = ${data.saasPlanExpiresAt},
        "saasSubscriptionStatus" = ${data.saasSubscriptionStatus},
        "stripeSubscriptionId" = NULL
      WHERE "id" = ${organizationId}
    `;
    return;
  }

  await prisma.$executeRaw`
    UPDATE "Organization"
    SET
      "saasPlan" = ${data.saasPlan},
      "saasPlanExpiresAt" = ${data.saasPlanExpiresAt},
      "saasSubscriptionStatus" = ${data.saasSubscriptionStatus}
    WHERE "id" = ${organizationId}
  `;
}

async function main() {
  const { positional, flags } = parseArgv(process.argv.slice(2));
  const [cmd, ...rest] = positional;

  if (!cmd || !['show', 'set', 'list'].includes(cmd)) {
    usage();
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error('Erreur: DATABASE_URL manquant (.env dans server/).');
    process.exit(1);
  }

  try {
    if (cmd === 'show') {
      if (!rest[0]) {
        console.error('Erreur: email ou org:id requis.');
        usage();
        process.exit(1);
      }
      await cmdShow(rest[0]);
    } else if (cmd === 'list') {
      await cmdList(flags);
    } else if (cmd === 'set') {
      const [target, planInput] = rest;
      if (!target || !planInput) {
        console.error('Erreur: cible et plan requis.');
        usage();
        process.exit(1);
      }
      await cmdSet(target, planInput, flags);
    }
  } catch (e) {
    console.error('Erreur:', e.message || e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
