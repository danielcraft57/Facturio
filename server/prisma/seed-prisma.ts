import { PrismaClient } from '@prisma/client';
import { entityIdExtension } from '../src/prisma/entity-id.extension';

/** Client Prisma pour les seeds (génération auto des ids Client / Invoice / Quote). */
export function createSeedPrismaClient(): PrismaClient {
	const base = new PrismaClient();
	return base.$extends(entityIdExtension) as unknown as PrismaClient;
}
