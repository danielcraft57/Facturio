import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AccountingService } from '../accounting/accounting.service';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateInvestmentDto, CreateInvestorDto } from './dto/investments.dto';

/**
 * Service investisseurs et investissements (apports, prêts, subventions).
 */
@Injectable()
export class InvestmentsService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly accounting: AccountingService,
	) {}

	/**
	 * Vérifie qu'une organisation est présente.
	 * @param organizationId - Identifiant
	 */
	private assertOrg(organizationId?: number): number {
		if (organizationId == null) throw new BadRequestException('Organisation requise');
		return organizationId;
	}

	/**
	 * Liste les investisseurs.
	 * @param organizationId - Organisation
	 */
	async listInvestors(organizationId?: number) {
		const orgId = this.assertOrg(organizationId);
		return this.prisma.investor.findMany({
			where: { organizationId: orgId },
			orderBy: { name: 'asc' },
			include: {
				_count: { select: { investments: true } },
			},
		});
	}

	/**
	 * Crée un investisseur.
	 * @param organizationId - Organisation
	 * @param dto - Données
	 */
	async createInvestor(organizationId: number | undefined, dto: CreateInvestorDto) {
		const orgId = this.assertOrg(organizationId);
		return this.prisma.investor.create({
			data: {
				organizationId: orgId,
				name: dto.name.trim(),
				email: dto.email?.trim() || null,
				phone: dto.phone?.trim() || null,
				type: dto.type || 'INDIVIDUAL',
				notes: dto.notes?.trim() || null,
			},
		});
	}

	/**
	 * Liste les investissements.
	 * @param organizationId - Organisation
	 */
	async listInvestments(organizationId?: number) {
		const orgId = this.assertOrg(organizationId);
		return this.prisma.investment.findMany({
			where: { organizationId: orgId },
			orderBy: { date: 'desc' },
			include: {
				investor: { select: { id: true, name: true, type: true } },
			},
		});
	}

	/**
	 * Synthèse des investissements actifs.
	 * @param organizationId - Organisation
	 */
	async getSummary(organizationId?: number) {
		const orgId = this.assertOrg(organizationId);
		const rows = await this.prisma.investment.findMany({
			where: { organizationId: orgId, status: 'ACTIVE' },
			select: { amount: true, type: true },
		});
		const toN = (n: unknown) =>
			(n as { toNumber?: () => number })?.toNumber?.() ?? Number(n ?? 0);
		const byType: Record<string, number> = {};
		let total = 0;
		for (const r of rows) {
			const a = toN(r.amount);
			total += a;
			byType[r.type] = (byType[r.type] || 0) + a;
		}
		return { totalActive: total, byType, count: rows.length };
	}

	/**
	 * Enregistre un investissement et optionnellement une écriture comptable.
	 * @param organizationId - Organisation
	 * @param dto - Données
	 */
	async createInvestment(organizationId: number | undefined, dto: CreateInvestmentDto) {
		const orgId = this.assertOrg(organizationId);
		if (dto.investorId != null) {
			const inv = await this.prisma.investor.findFirst({
				where: { id: dto.investorId, organizationId: orgId },
			});
			if (!inv) throw new NotFoundException('Investisseur introuvable');
		}

		const investment = await this.prisma.investment.create({
			data: {
				organizationId: orgId,
				investorId: dto.investorId ?? null,
				label: dto.label.trim(),
				type: dto.type || 'CAPITAL_CONTRIBUTION',
				amount: dto.amount,
				date: new Date(dto.date),
				ownershipPercent: dto.ownershipPercent ?? null,
				expectedReturnPercent: dto.expectedReturnPercent ?? null,
				maturityDate: dto.maturityDate ? new Date(dto.maturityDate) : null,
				notes: dto.notes?.trim() || null,
			},
			include: {
				investor: { select: { id: true, name: true, type: true } },
			},
		});

		if (dto.postAccounting) {
			const equityAccount =
				(dto.type || 'CAPITAL_CONTRIBUTION') === 'LOAN' ? '164' : '101';
			try {
				await this.accounting.postEntry({
					organizationId: orgId,
					journalCode: 'OD',
					date: new Date(dto.date),
					reference: `INV-${investment.id}`,
					memo: dto.label,
					lines: [
						{ accountCode: '512', debit: dto.amount, credit: 0, description: 'Encaissement' },
						{
							accountCode: equityAccount,
							debit: 0,
							credit: dto.amount,
							description: dto.label,
						},
					],
				});
			} catch {
				// L'investissement reste enregistré même si la compta échoue
			}
		}

		return investment;
	}

	/**
	 * Clôture un investissement.
	 * @param organizationId - Organisation
	 * @param id - Identifiant
	 */
	async closeInvestment(organizationId: number | undefined, id: number) {
		const orgId = this.assertOrg(organizationId);
		const row = await this.prisma.investment.findFirst({
			where: { id, organizationId: orgId },
		});
		if (!row) throw new NotFoundException('Investissement introuvable');
		return this.prisma.investment.update({
			where: { id },
			data: { status: 'CLOSED' },
		});
	}
}
