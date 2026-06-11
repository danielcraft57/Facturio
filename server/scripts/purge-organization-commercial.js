#!/usr/bin/env node
/**
 * Suppression définitive des données commerciales d'une organisation :
 * factures (+ paiements, avoirs liés, écritures), devis, clients.
 *
 * Ne touche pas : produits, compta hors liens facture/avoir, utilisateurs, jetons API, plan SaaS.
 *
 * cd server && node scripts/purge-organization-commercial.js stats user@example.com
 * cd server && node scripts/purge-organization-commercial.js purge user@example.com --confirm
 * npm run commercial:stats -- user@example.com
 * npm run commercial:purge -- user@example.com --confirm
 *
 * Shell Windows : scripts/windows/purge-commercial.ps1 -Target user@example.com -Confirm
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

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function usage() {
  console.log(`
Usage:
  node scripts/purge-organization-commercial.js stats <email|org:id>
  node scripts/purge-organization-commercial.js purge <email|org:id> [--confirm]

Options purge :
  --confirm          Exécute la suppression (sinon dry-run)
  --dry-run          Détail sans écriture (défaut si pas --confirm)

Exemples :
  node scripts/purge-organization-commercial.js stats daniel@danielcraft.fr
  node scripts/purge-organization-commercial.js purge daniel@danielcraft.fr
  node scripts/purge-organization-commercial.js purge org:1 --confirm
  npm run commercial:purge -- user@example.com --confirm

Conserve : produits, paramètres org, utilisateurs, jetons API.
Supprime : factures, devis, clients (et dépendances : paiements, avoirs, abonnements client, etc.).
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
    const org = await prisma.organization.findUnique({ where: { id: parsed.organizationId } });
    if (!org) throw new Error(`Organisation #${parsed.organizationId} introuvable`);
    return org;
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.email },
    include: { organization: true },
  });
  if (!user) throw new Error(`Utilisateur "${parsed.email}" introuvable`);
  if (!user.organization) throw new Error(`Utilisateur "${parsed.email}" sans organisation`);
  return user.organization;
}

async function deleteJournalEntriesForInvoices(tx, invoices) {
  const entryIdSet = new Set();

  for (const inv of invoices) {
    const num = inv.number;
    const entries = await tx.journalEntry.findMany({
      where: {
        OR: [
          { reference: `VENTE ${num}` },
          { reference: `PAIEMENT ${num}` },
          { reference: { startsWith: `PAIEMENT ${num}#` } },
          { reference: { startsWith: `REMBOURSEMENT ${num}` } },
        ],
      },
      select: { id: true },
    });
    for (const e of entries) entryIdSet.add(e.id);
  }

  const entryIds = [...entryIdSet];
  if (entryIds.length === 0) return 0;

  await tx.avoir.updateMany({
    where: { accountingEntryId: { in: entryIds } },
    data: { accountingEntryId: null },
  });

  await tx.journalLine.deleteMany({ where: { entryId: { in: entryIds } } });
  await tx.journalEntry.deleteMany({ where: { id: { in: entryIds } } });
  return entryIds.length;
}

async function purgeInvoices(tx, invoices) {
  const ids = invoices.map((i) => i.id);
  if (ids.length === 0) return { invoices: 0, journalEntries: 0, avoirs: 0 };

  const journalDeleted = await deleteJournalEntriesForInvoices(tx, invoices);

  const avoirsLinked = await tx.avoir.findMany({
    where: {
      OR: [{ invoiceId: { in: ids } }, { applications: { some: { invoiceId: { in: ids } } } }],
    },
    select: { id: true, accountingEntryId: true },
  });
  const avoirIds = avoirsLinked.map((a) => a.id);
  const extraEntryIds = avoirsLinked.map((a) => a.accountingEntryId).filter((id) => id != null);

  if (extraEntryIds.length > 0) {
    await tx.avoir.updateMany({
      where: { id: { in: avoirIds } },
      data: { accountingEntryId: null },
    });
    await tx.journalLine.deleteMany({ where: { entryId: { in: extraEntryIds } } });
    await tx.journalEntry.deleteMany({ where: { id: { in: extraEntryIds } } });
  }

  if (avoirIds.length > 0) {
    await tx.avoirApplication.deleteMany({
      where: { OR: [{ invoiceId: { in: ids } }, { avoirId: { in: avoirIds } }] },
    });
    await tx.avoirLine.deleteMany({ where: { avoirId: { in: avoirIds } } });
    await tx.avoir.deleteMany({ where: { id: { in: avoirIds } } });
  } else {
    await tx.avoirApplication.deleteMany({ where: { invoiceId: { in: ids } } });
  }

  await tx.refund.deleteMany({ where: { invoiceId: { in: ids } } });
  await tx.taxDeduction.deleteMany({ where: { invoiceId: { in: ids } } });
  await tx.emailEvent.deleteMany({ where: { invoiceId: { in: ids } } });
  await tx.payment.deleteMany({ where: { invoiceId: { in: ids } } });
  await tx.invoiceLine.deleteMany({ where: { invoiceId: { in: ids } } });
  const deleted = await tx.invoice.deleteMany({ where: { id: { in: ids } } });

  return {
    invoices: deleted.count,
    journalEntries: journalDeleted + extraEntryIds.length,
    avoirs: avoirIds.length,
  };
}

async function purgeRemainingAvoirs(tx, organizationId) {
  const avoirs = await tx.avoir.findMany({
    where: { organizationId },
    select: { id: true, accountingEntryId: true },
  });
  if (avoirs.length === 0) return 0;

  const avoirIds = avoirs.map((a) => a.id);
  const entryIds = avoirs.map((a) => a.accountingEntryId).filter((id) => id != null);

  if (entryIds.length > 0) {
    await tx.avoir.updateMany({
      where: { id: { in: avoirIds } },
      data: { accountingEntryId: null },
    });
    await tx.journalLine.deleteMany({ where: { entryId: { in: entryIds } } });
    await tx.journalEntry.deleteMany({ where: { id: { in: entryIds } } });
  }

  await tx.avoirApplication.deleteMany({ where: { avoirId: { in: avoirIds } } });
  await tx.avoirLine.deleteMany({ where: { avoirId: { in: avoirIds } } });
  await tx.avoir.deleteMany({ where: { id: { in: avoirIds } } });
  return avoirIds.length;
}

async function purgeQuotes(tx, organizationId) {
  const quotes = await tx.quote.findMany({
    where: { organizationId },
    select: { id: true, number: true, status: true, clientId: true },
  });
  const quoteIds = quotes.map((q) => q.id);
  if (quoteIds.length === 0) return { quotes: 0, preview: [] };

  await tx.emailEvent.deleteMany({ where: { quoteId: { in: quoteIds } } });
  await tx.quoteView.deleteMany({ where: { quoteId: { in: quoteIds } } });
  await tx.quoteLine.deleteMany({ where: { quoteId: { in: quoteIds } } });
  const deleted = await tx.quote.deleteMany({ where: { organizationId } });

  return { quotes: deleted.count, preview: quotes };
}

async function purgeClients(tx, organizationId) {
  const clients = await tx.client.findMany({
    where: { organizationId },
    select: { id: true, name: true, email: true, status: true },
  });
  const clientIds = clients.map((c) => c.id);
  if (clientIds.length === 0) return { clients: 0, subscriptions: 0, catalogItems: 0, preview: [] };

  const subs = await tx.subscription.deleteMany({
    where: { OR: [{ organizationId }, { clientId: { in: clientIds } }] },
  });
  const catalog = await tx.clientCatalogItem.deleteMany({ where: { clientId: { in: clientIds } } });
  const deleted = await tx.client.deleteMany({ where: { organizationId } });

  return {
    clients: deleted.count,
    subscriptions: subs.count,
    catalogItems: catalog.count,
    preview: clients,
  };
}

async function countCommercial(organizationId) {
  const [clients, quotes, invoices, subscriptions, avoirs] = await Promise.all([
    prisma.client.count({ where: { organizationId } }),
    prisma.quote.count({ where: { organizationId } }),
    prisma.invoice.count({ where: { organizationId } }),
    prisma.subscription.count({
      where: {
        OR: [
          { organizationId },
          { client: { organizationId } },
        ],
      },
    }),
    prisma.avoir.count({ where: { organizationId } }),
  ]);
  return { clients, quotes, invoices, subscriptions, avoirs };
}

async function cmdStats(target) {
  const org = await resolveOrganization(target);
  const counts = await countCommercial(org.id);

  console.log(`Organisation #${org.id} "${org.name}"`);
  console.log(`  Clients        : ${counts.clients}`);
  console.log(`  Devis          : ${counts.quotes}`);
  console.log(`  Factures       : ${counts.invoices}`);
  console.log(`  Abonnements    : ${counts.subscriptions}`);
  console.log(`  Avoirs (org)   : ${counts.avoirs}`);
}

function printPreview(org, counts, quotePreview, clientPreview) {
  console.log(`Organisation #${org.id} "${org.name}"`);
  console.log(
    `À supprimer : ${counts.invoices} facture(s), ${counts.quotes} devis, ${counts.clients} client(s)`,
  );
  console.log(`  (+ ${counts.avoirs} avoir(s), ${counts.subscriptions} abonnement(s) client)`);

  if (quotePreview.length > 0) {
    console.log('\nDevis (aperçu) :');
    for (const q of quotePreview.slice(0, 10)) {
      console.log(`  ${q.number.padEnd(14)} ${q.status.padEnd(10)} client=${q.clientId}`);
    }
    if (quotePreview.length > 10) console.log(`  … et ${quotePreview.length - 10} autre(s)`);
  }

  if (clientPreview.length > 0) {
    console.log('\nClients (aperçu) :');
    for (const c of clientPreview.slice(0, 10)) {
      console.log(`  ${c.email.padEnd(32)} ${c.name} (${c.status})`);
    }
    if (clientPreview.length > 10) console.log(`  … et ${clientPreview.length - 10} autre(s)`);
  }
}

async function cmdPurge(target, flags) {
  const org = await resolveOrganization(target);
  const counts = await countCommercial(org.id);
  const dryRun = !flags.confirm;
  const total = counts.clients + counts.quotes + counts.invoices;

  if (total === 0 && counts.avoirs === 0 && counts.subscriptions === 0) {
    console.log(`Organisation #${org.id} "${org.name}" — rien à supprimer.`);
    return;
  }

  const invoices = await prisma.invoice.findMany({
    where: { organizationId: org.id },
    select: { id: true, number: true },
  });

  const quoteData = await prisma.quote.findMany({
    where: { organizationId: org.id },
    select: { id: true, number: true, status: true, clientId: true },
  });

  const clientData = await prisma.client.findMany({
    where: { organizationId: org.id },
    select: { id: true, name: true, email: true, status: true },
  });

  printPreview(org, counts, quoteData, clientData);

  if (invoices.length > 0) {
    console.log(`\nFactures : ${invoices.length} (détail omis — voir invoices:list si besoin)`);
  }

  if (dryRun) {
    console.log('\n(dry-run) Ajoutez --confirm pour supprimer définitivement.');
    return;
  }

  console.log('\n⚠️  Suppression en cours (irréversible)…');

  const stats = await prisma.$transaction(async (tx) => {
    const invoiceStats = await purgeInvoices(tx, invoices);
    const remainingAvoirs = await purgeRemainingAvoirs(tx, org.id);
    const quoteStats = await purgeQuotes(tx, org.id);
    const clientStats = await purgeClients(tx, org.id);
    return {
      ...invoiceStats,
      remainingAvoirs,
      quotes: quoteStats.quotes,
      clients: clientStats.clients,
      subscriptions: clientStats.subscriptions,
      catalogItems: clientStats.catalogItems,
    };
  });

  const after = await countCommercial(org.id);

  console.log('\n✓ Terminé.');
  console.log(`  Factures supprimées     : ${stats.invoices}`);
  console.log(`  Devis supprimés         : ${stats.quotes}`);
  console.log(`  Clients supprimés       : ${stats.clients}`);
  console.log(`  Avoirs supprimés        : ${stats.avoirs + stats.remainingAvoirs}`);
  console.log(`  Abonnements supprimés   : ${stats.subscriptions}`);
  console.log(`  Lignes catalogue client : ${stats.catalogItems}`);
  console.log(`  Écritures comptables    : ~${stats.journalEntries}`);
  console.log(
    `\nReste : ${after.clients} client(s), ${after.quotes} devis, ${after.invoices} facture(s).`,
  );
  console.log('Produits, utilisateurs et jetons API inchangés.');
}

async function main() {
  const { positional, flags } = parseArgv(process.argv.slice(2));
  const [cmd, target] = positional;

  if (!cmd || !['stats', 'purge'].includes(cmd)) {
    usage();
    process.exit(1);
  }

  if (!target) {
    console.error('Erreur: email ou org:id requis.');
    usage();
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error('Erreur: DATABASE_URL manquant (.env dans server/).');
    process.exit(1);
  }

  try {
    if (cmd === 'stats') await cmdStats(target);
    else if (cmd === 'purge') await cmdPurge(target, flags);
  } catch (e) {
    console.error('Erreur:', e.message || e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
