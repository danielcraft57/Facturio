#!/usr/bin/env node
/**
 * Script de gestion des utilisateurs en production (ajout / suppression).
 * À exécuter depuis la racine du serveur : node scripts/manage-user.js [add|remove] ...
 *
 * Prérequis : .env avec DATABASE_URL (PostgreSQL). Prisma client généré (npm run prisma:prod).
 *
 * Ajouter un utilisateur :
 *   node scripts/manage-user.js add <email> <mot_de_passe> [nom_organisation] [prenom] [nom] [role]
 *   node scripts/manage-user.js add user@example.com "MonMotDePasse" "Ma Societe" Jean Dupont ADMIN
 *
 * Supprimer un utilisateur (par email) :
 *   node scripts/manage-user.js remove <email>
 *   node scripts/manage-user.js remove user@example.com
 *
 * Lister les utilisateurs :
 *   node scripts/manage-user.js list
 */

const path = require('path');
const fs = require('fs');

// Charger .env depuis le répertoire server
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  });
}

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const ROLES = ['SUPER_ADMIN', 'ADMIN', 'USER', 'VIEWER'];

function usage() {
  console.log(`
Usage:
  node scripts/manage-user.js add <email> <password> [organizationName] [firstName] [lastName] [role]
  node scripts/manage-user.js remove <email>
  node scripts/manage-user.js list

Examples:
  node scripts/manage-user.js add admin@example.com "Secret123" "Mon Entreprise" Jean Dupont ADMIN
  node scripts/manage-user.js remove old@example.com
  node scripts/manage-user.js list
`);
}

async function addUser(args) {
  const [email, password, organizationName, firstName, lastName, roleArg] = args;
  if (!email || !password) {
    console.error('Erreur: email et mot de passe requis.');
    usage();
    process.exit(1);
  }
  const orgName = organizationName || 'Organisation';
  const role = roleArg && ROLES.includes(roleArg.toUpperCase()) ? roleArg.toUpperCase() : 'ADMIN';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.error(`Erreur: un utilisateur avec l'email "${email}" existe déjà.`);
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const organization = await prisma.organization.create({
    data: { name: orgName, companyType: 'B2B' },
  });
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName: firstName || null,
      lastName: lastName || null,
      organizationId: organization.id,
      status: 'ACTIVE',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      role,
    },
    include: { organization: true },
  });
  console.log(`Utilisateur créé: id=${user.id} email=${user.email} org="${organization.name}" role=${user.role}`);
}

async function removeUser(args) {
  const [email] = args;
  if (!email) {
    console.error('Erreur: email requis.');
    usage();
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { organization: { include: { users: true } } },
  });
  if (!user) {
    console.error(`Erreur: aucun utilisateur avec l'email "${email}".`);
    process.exit(1);
  }

  const org = user.organization;
  const otherUsersInOrg = org.users.filter((u) => u.id !== user.id);

  await prisma.user.delete({ where: { id: user.id } });
  if (otherUsersInOrg.length === 0) {
    await prisma.organization.delete({ where: { id: org.id } });
    console.log(`Utilisateur "${email}" et organisation "${org.name}" (vide) supprimés.`);
  } else {
    console.log(`Utilisateur "${email}" supprimé. Organisation "${org.name}" conservée.`);
  }
}

async function listUsers() {
  const users = await prisma.user.findMany({
    include: { organization: { select: { name: true } } },
    orderBy: { id: 'asc' },
  });
  if (users.length === 0) {
    console.log('Aucun utilisateur.');
    return;
  }
  console.log('ID\tEmail\t\t\tOrganisation\tRole\tStatus');
  users.forEach((u) => {
    console.log(`${u.id}\t${u.email}\t${u.organization?.name || '-'}\t${u.role}\t${u.status}`);
  });
}

async function main() {
  const [, , cmd, ...args] = process.argv;
  if (!cmd || !['add', 'remove', 'list'].includes(cmd)) {
    usage();
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error('Erreur: DATABASE_URL manquant. Fichier .env présent dans /opt/facturio/server ?');
    process.exit(1);
  }

  try {
    if (cmd === 'add') await addUser(args);
    else if (cmd === 'remove') await removeUser(args);
    else if (cmd === 'list') await listUsers();
  } catch (e) {
    console.error('Erreur:', e.message || e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
