import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { FilingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FilingCalculatorRegistry } from './calculators/filing-calculator.registry';
import type { FilingCalculateOptions } from './calculators/filing-calculation.types';

/**
 * Données de création de déclaration fiscale
 */
export interface CreateFilingDto {
	/** Type de déclaration (VAT_CA3, VAT_CA12, URSSAF_MONTHLY, IS, CFE…) */
	type: string;
	/** Autorité (URSSAF, DGFIP, etc.) */
	authority?: string;
	/**
	 * Période formatée :
	 * - Trimestre : "2026-Q1"
	 * - Année (IS/CFE) : "2026" ou "2026-Y"
	 * - Mois : "2026-M01"
	 */
	period?: string;
	periodStart?: string | Date;
	periodEnd?: string | Date;
	dueDate?: string | Date;
	notes?: string;
	organizationId?: number;
}

/**
 * Données de mise à jour de déclaration
 */
export interface UpdateFilingDto {
	status?: FilingStatus;
	notes?: string;
}

/**
 * Service de gestion des déclarations fiscales.
 *
 * Le calcul délégué à FilingCalculatorRegistry (TVA, IS, CFE).
 * URSSAF reste sur le module dédié `/urssaf`.
 */
@Injectable()
export class FilingsService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly calculators: FilingCalculatorRegistry,
	) {}

	/**
	 * Parse une période textuelle en dates.
	 * @param period - "2026-Q1" | "2026" | "2026-Y" | "2026-M01"
	 */
	private parsePeriod(period: string): { periodStart: Date; periodEnd: Date; dueDate: Date } {
		const yearOnly = period.match(/^(\d{4})(?:-Y)?$/);
		if (yearOnly) {
			const year = parseInt(yearOnly[1], 10);
			return {
				periodStart: new Date(year, 0, 1),
				periodEnd: new Date(year, 11, 31),
				dueDate: new Date(year + 1, 4, 15), // 15 mai N+1 (approx IS)
			};
		}

		const month = period.match(/^(\d{4})-M(\d{2})$/);
		if (month) {
			const year = parseInt(month[1], 10);
			const m = parseInt(month[2], 10) - 1;
			if (m < 0 || m > 11) throw new BadRequestException('Mois invalide');
			return {
				periodStart: new Date(year, m, 1),
				periodEnd: new Date(year, m + 1, 0),
				dueDate: new Date(year, m + 2, 0),
			};
		}

		const quarter = period.match(/^(\d{4})-Q(\d)$/);
		if (quarter) {
			const year = parseInt(quarter[1], 10);
			const q = parseInt(quarter[2], 10);
			if (q < 1 || q > 4) throw new BadRequestException('Trimestre invalide (1-4)');
			const monthStart = (q - 1) * 3;
			return {
				periodStart: new Date(year, monthStart, 1),
				periodEnd: new Date(year, monthStart + 3, 0),
				dueDate: new Date(year, monthStart + 3, 0),
			};
		}

		throw new BadRequestException(
			'Format de période invalide. Utilisez YYYY, YYYY-Y, YYYY-QN ou YYYY-MNN',
		);
	}

	/**
	 * Crée une nouvelle déclaration fiscale.
	 * @param data - Données de création
	 */
	create(data: CreateFilingDto) {
		let periodStart: Date;
		let periodEnd: Date;
		let dueDate: Date;

		if (data.period) {
			const parsed = this.parsePeriod(data.period);
			periodStart = parsed.periodStart;
			periodEnd = parsed.periodEnd;
			dueDate = parsed.dueDate;
		} else {
			if (!data.periodStart || !data.periodEnd || !data.dueDate) {
				throw new BadRequestException(
					'periodStart, periodEnd et dueDate requis si period absent',
				);
			}
			periodStart = new Date(data.periodStart);
			periodEnd = new Date(data.periodEnd);
			dueDate = new Date(data.dueDate);
		}

		let typeValue: string = data.type ?? 'VAT_CA3';
		if (typeValue === 'VAT') typeValue = 'VAT_CA3';

		// Autorité par défaut selon le type
		let authorityValue = data.authority;
		if (!authorityValue) {
			authorityValue =
				typeValue.startsWith('URSSAF') ? 'URSSAF' : 'DGFIP';
		}

		return this.prisma.filing.create({
			data: {
				type: typeValue as any,
				authority: authorityValue as any,
				periodStart,
				periodEnd,
				dueDate,
				notes: data.notes,
				organizationId: data.organizationId,
			},
		});
	}

	/**
	 * Liste les déclarations d'une organisation.
	 * @param organizationId - Filtre multi-tenant
	 */
	findAll(organizationId?: number) {
		const where = organizationId != null ? { organizationId } : {};
		return this.prisma.filing.findMany({
			where,
			orderBy: { createdAt: 'desc' },
			include: { lines: true, payments: true },
		});
	}

	/**
	 * Récupère une déclaration par ID.
	 * @param id - Identifiant
	 * @param organizationId - Organisation attendue
	 */
	async findOne(id: number, organizationId?: number) {
		const where: { id: number; organizationId?: number } = { id };
		if (organizationId != null) where.organizationId = organizationId;
		const f = await this.prisma.filing.findFirst({
			where,
			include: { lines: true, payments: true },
		});
		if (!f) throw new NotFoundException('Declaration introuvable');
		return f;
	}

	/**
	 * Met à jour une déclaration.
	 */
	async update(id: number, data: UpdateFilingDto, organizationId?: number) {
		await this.findOne(id, organizationId);
		return this.prisma.filing.update({ where: { id }, data });
	}

	/**
	 * Supprime une déclaration.
	 */
	async remove(id: number, organizationId?: number) {
		await this.findOne(id, organizationId);
		await this.prisma.filing.delete({ where: { id } });
		return { success: true };
	}

	/**
	 * Calcule une déclaration via le registre (TVA, IS, CFE).
	 * @param id - Identifiant déclaration
	 * @param organizationId - Organisation
	 * @param options - Surcharges optionnelles
	 */
	async calculate(
		id: number,
		organizationId?: number,
		options?: FilingCalculateOptions,
	) {
		const filing = await this.findOne(id, organizationId);
		const orgId = organizationId ?? filing.organizationId;
		if (orgId == null) {
			throw new BadRequestException('Organisation requise pour calculer');
		}

		const calculator = this.calculators.get(filing.type);
		const result = await calculator.calculate({
			filingId: id,
			organizationId: orgId,
			type: filing.type,
			periodStart: new Date(filing.periodStart),
			periodEnd: new Date(filing.periodEnd),
			options,
		});

		await this.prisma.filing.update({
			where: { id },
			data: {
				status: 'CALCULATED' as FilingStatus,
				amountDue: result.amountDue,
				notes: result.notes,
				calculationSnapshot: result.snapshot as any,
				lines: {
					deleteMany: {},
					create: result.lines.map((l) => ({
						taxRate: l.taxRate as any,
						taxableBase: l.taxableBase as any,
						taxAmount: l.taxAmount as any,
					})),
				},
			},
		});

		const updated = await this.findOne(id, organizationId);
		return {
			...updated,
			...result.snapshot,
			amountDue: result.amountDue,
		};
	}

	/**
	 * @deprecated Utiliser calculate() - conservé pour compat.
	 */
	async calculateVatReturn(id: number, organizationId?: number) {
		return this.calculate(id, organizationId);
	}

	/**
	 * Ajoute un paiement autorité.
	 */
	async addAuthorityPayment(
		id: number,
		amount: number,
		date?: string | Date,
		reference?: string,
		notes?: string,
		organizationId?: number,
	) {
		await this.findOne(id, organizationId);
		if (amount < 0) throw new BadRequestException('Montant invalide');
		const filing = await this.findOne(id, organizationId);
		const created = await this.prisma.authorityPayment.create({
			data: {
				filingId: id,
				authority: filing.authority,
				amount,
				date: date ? new Date(date) : undefined,
				reference,
				notes,
			},
		});
		const agg = await this.prisma.authorityPayment.aggregate({
			where: { filingId: id },
			_sum: { amount: true },
		});
		const paid = agg?._sum?.amount
			? (agg._sum.amount as any).toNumber?.() ?? Number(agg._sum.amount)
			: 0;
		const due = (filing.amountDue as any)?.toNumber?.() ?? Number(filing.amountDue);
		const newStatus: FilingStatus =
			paid >= due ? ('PAID' as FilingStatus) : (filing.status as FilingStatus);
		await this.prisma.filing.update({
			where: { id },
			data: { amountPaid: paid, status: newStatus },
		});
		return {
			...created,
			amount: (created.amount as any)?.toNumber?.() ?? Number(created.amount),
		} as any;
	}
}
