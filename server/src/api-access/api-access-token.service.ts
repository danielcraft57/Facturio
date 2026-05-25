import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { BillingService } from '../billing/billing.service';
import {
	API_ACCESS_SCOPES,
	ApiAccessScope,
	parsePermissionsJson,
	serializePermissions,
} from './api-access-permissions';
import { CreateApiTokenDto } from './dto/create-api-token.dto';

const TOKEN_PREFIX = 'fact_';

export interface ApiAccessContext {
	tokenId: number;
	organizationId: number;
	permissions: ApiAccessScope[];
}

@Injectable()
export class ApiAccessTokenService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly billing: BillingService,
	) {}

	static hashToken(plain: string): string {
		return createHash('sha256').update(plain, 'utf8').digest('hex');
	}

	private generatePlainToken(): string {
		return TOKEN_PREFIX + randomBytes(24).toString('hex');
	}

	async listForOrganization(organizationId: number) {
		const rows = await this.prisma.apiAccessToken.findMany({
			where: { organizationId, revokedAt: null },
			orderBy: { createdAt: 'desc' },
		});
		return rows.map((r) => ({
			id: r.id,
			name: r.name,
			tokenPrefix: r.tokenPrefix,
			permissions: parsePermissionsJson(r.permissions),
			lastUsedAt: r.lastUsedAt,
			createdAt: r.createdAt,
		}));
	}

	async create(organizationId: number, dto: CreateApiTokenDto) {
		const plain = this.generatePlainToken();
		const tokenHash = ApiAccessTokenService.hashToken(plain);
		const tokenPrefix = plain.slice(0, 12) + '…';
		const permissions = serializePermissions(dto.permissions);
		const row = await this.prisma.apiAccessToken.create({
			data: {
				organizationId,
				name: dto.name.trim(),
				tokenPrefix,
				tokenHash,
				permissions,
			},
		});
		return {
			id: row.id,
			name: row.name,
			tokenPrefix: row.tokenPrefix,
			permissions: parsePermissionsJson(row.permissions),
			createdAt: row.createdAt,
			/** Affiché une seule fois à la création */
			token: plain,
		};
	}

	async revoke(id: number, organizationId: number) {
		const row = await this.prisma.apiAccessToken.findFirst({
			where: { id, organizationId, revokedAt: null },
		});
		if (!row) throw new NotFoundException('Jeton introuvable');
		await this.prisma.apiAccessToken.update({
			where: { id },
			data: { revokedAt: new Date() },
		});
		return { success: true };
	}

	async resolveBearer(authorizationHeader?: string): Promise<ApiAccessContext> {
		const raw = authorizationHeader?.trim();
		if (!raw?.toLowerCase().startsWith('bearer ')) {
			throw new UnauthorizedException('En-tête Authorization: Bearer <token> requis');
		}
		const plain = raw.slice(7).trim();
		if (!plain.startsWith(TOKEN_PREFIX) || plain.length < 20) {
			throw new UnauthorizedException('Jeton API invalide');
		}
		const tokenHash = ApiAccessTokenService.hashToken(plain);
		const row = await this.prisma.apiAccessToken.findFirst({
			where: { tokenHash, revokedAt: null },
		});
		if (!row) {
			throw new UnauthorizedException('Jeton API invalide ou révoqué');
		}
		await this.billing.assertCanUsePublicApi(row.organizationId);
		void this.prisma.apiAccessToken
			.update({
				where: { id: row.id },
				data: { lastUsedAt: new Date() },
			})
			.catch(() => undefined);
		return {
			tokenId: row.id,
			organizationId: row.organizationId,
			permissions: parsePermissionsJson(row.permissions),
		};
	}

	getScopesCatalog() {
		return {
			scopes: API_ACCESS_SCOPES,
		};
	}
}
