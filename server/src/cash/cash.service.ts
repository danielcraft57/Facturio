import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AccountingService } from '../accounting/accounting.service';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateCashMovementDto, CreateCashRegisterDto } from './dto/cash.dto';

/**
 * Service de gestion de caisse (fond de caisse + mouvements).
 * Met à jour le solde et peut poster une écriture 53/512 pour les transferts banque.
 */
@Injectable()
export class CashService {
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
	 * Convertit Decimal en number.
	 * @param n - Valeur
	 */
	private toNumber(n: unknown): number {
		if (n == null) return 0;
		return (n as { toNumber?: () => number })?.toNumber?.() ?? Number(n);
	}

	/**
	 * Liste les caisses.
	 * @param organizationId - Organisation
	 */
	async listRegisters(organizationId?: number) {
		const orgId = this.assertOrg(organizationId);
		return this.prisma.cashRegister.findMany({
			where: { organizationId: orgId },
			orderBy: { name: 'asc' },
			include: {
				_count: { select: { movements: true } },
			},
		});
	}

	/**
	 * Crée une caisse avec solde d'ouverture.
	 * @param organizationId - Organisation
	 * @param dto - Données
	 */
	async createRegister(organizationId: number | undefined, dto: CreateCashRegisterDto) {
		const orgId = this.assertOrg(organizationId);
		const opening = dto.openingBalance ?? 0;
		return this.prisma.cashRegister.create({
			data: {
				organizationId: orgId,
				name: dto.name.trim(),
				currency: dto.currency || 'EUR',
				openingBalance: opening,
				currentBalance: opening,
				notes: dto.notes?.trim() || null,
			},
		});
	}

	/**
	 * Récupère une caisse avec ses derniers mouvements.
	 * @param organizationId - Organisation
	 * @param id - Identifiant caisse
	 */
	async getRegister(organizationId: number | undefined, id: number) {
		const orgId = this.assertOrg(organizationId);
		const reg = await this.prisma.cashRegister.findFirst({
			where: { id, organizationId: orgId },
			include: {
				movements: { orderBy: { date: 'desc' }, take: 100 },
			},
		});
		if (!reg) throw new NotFoundException('Caisse introuvable');
		return reg;
	}

	/**
	 * Enregistre un mouvement et met à jour le solde.
	 * @param organizationId - Organisation
	 * @param cashRegisterId - Caisse
	 * @param dto - Mouvement
	 * @param postAccounting - Poster en compta (53/512) pour transferts banque
	 */
	async addMovement(
		organizationId: number | undefined,
		cashRegisterId: number,
		dto: CreateCashMovementDto,
		postAccounting = false,
	) {
		const orgId = this.assertOrg(organizationId);
		const reg = await this.getRegister(organizationId, cashRegisterId);
		const amount = dto.amount;
		let delta = 0;
		if (dto.type === 'IN') delta = amount;
		else if (dto.type === 'OUT') delta = -amount;
		else {
			// ADJUSTMENT : amount = nouveau solde cible
			delta = amount - this.toNumber(reg.currentBalance);
		}

		const newBalance =
			dto.type === 'ADJUSTMENT' ? amount : this.toNumber(reg.currentBalance) + delta;
		if (newBalance < -0.001) {
			throw new BadRequestException('Solde de caisse insuffisant');
		}

		const date = dto.date ? new Date(dto.date) : new Date();

		const [movement] = await this.prisma.$transaction([
			this.prisma.cashMovement.create({
				data: {
					organizationId: orgId,
					cashRegisterId,
					type: dto.type,
					amount: dto.type === 'ADJUSTMENT' ? Math.abs(delta) : amount,
					date,
					label: dto.label.trim(),
					category: dto.category?.trim() || null,
					reference: dto.reference?.trim() || null,
					notes: dto.notes?.trim() || null,
				},
			}),
			this.prisma.cashRegister.update({
				where: { id: cashRegisterId },
				data: { currentBalance: newBalance },
			}),
		]);

		if (postAccounting && (dto.category === 'bank_deposit' || dto.category === 'bank_withdrawal')) {
			try {
				const isDeposit = dto.category === 'bank_deposit';
				await this.accounting.postEntry({
					organizationId: orgId,
					journalCode: 'BQ',
					date,
					reference: `CAISSE-${movement.id}`,
					memo: dto.label,
					lines: isDeposit
						? [
								{ accountCode: '512', debit: amount, credit: 0, description: 'Dépôt banque' },
								{ accountCode: '53', debit: 0, credit: amount, description: 'Sortie caisse' },
							]
						: [
								{ accountCode: '53', debit: amount, credit: 0, description: 'Retrait caisse' },
								{ accountCode: '512', debit: 0, credit: amount, description: 'Sortie banque' },
							],
				});
			} catch {
				// La caisse reste cohérente même si la compta échoue (compte manquant, etc.)
			}
		}

		return { movement, currentBalance: newBalance };
	}
}
