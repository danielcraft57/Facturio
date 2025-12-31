import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaxDeductionDto } from './dto/create-tax-deduction.dto';
import { UpdateTaxDeductionDto } from './dto/update-tax-deduction.dto';
import { ListQueryDto } from '../common/dto/list-query.dto';

/**
 * Service de gestion des déductions fiscales
 * 
 * Gère :
 * - Le CRUD complet des déductions fiscales
 * - La catégorisation automatique
 * - La validation des déductions
 * - Le calcul du montant déductible
 * - Le suivi par année fiscale
 * 
 * @see TaxDeductionsController pour les endpoints API
 */
@Injectable()
export class TaxDeductionsService {
	constructor(private readonly prisma: PrismaService) {}

	/**
	 * Crée une nouvelle déduction fiscale
	 * 
	 * @param organizationId - ID de l'organisation
	 * @param data - Données de la déduction
	 * @returns Déduction créée
	 * @throws {BadRequestException} Si validation échoue
	 */
	async create(organizationId: number, data: CreateTaxDeductionDto) {
		// Validation
		if (data.amount <= 0) {
			throw new BadRequestException('Le montant doit être positif');
		}

		// Vérifier que la facture existe si fournie
		if (data.invoiceId) {
			const invoice = await this.prisma.invoice.findUnique({
				where: { id: data.invoiceId },
			});
			if (!invoice) {
				throw new NotFoundException('Facture non trouvée');
			}
			// Vérifier que la facture appartient à l'organisation
			if (invoice.organizationId !== organizationId) {
				throw new BadRequestException('La facture n\'appartient pas à votre organisation');
			}
		}

		return this.prisma.taxDeduction.create({
			data: {
				organizationId,
				category: data.category,
				name: data.name,
				description: data.description,
				amount: data.amount,
				year: data.year,
				deductibleRate: data.deductibleRate ?? 1.0,
				invoiceId: data.invoiceId,
				documentId: data.documentId,
				notes: data.notes,
				status: 'PENDING',
			},
			include: {
				invoice: true,
				document: true,
			},
		});
	}

	/**
	 * Liste les déductions fiscales avec pagination
	 * 
	 * @param organizationId - ID de l'organisation
	 * @param query - Paramètres de pagination/recherche/filtre
	 * @returns Liste paginée de déductions
	 */
	async findAll(organizationId: number, query?: { page?: number; pageSize?: number; year?: number; category?: string; status?: string; search?: string; sortBy?: string; order?: 'asc' | 'desc' }) {
		const page = query?.page ? parseInt(query.page.toString(), 10) : 1;
		const pageSize = query?.pageSize ? parseInt(query.pageSize.toString(), 10) : 20;
		const skip = (page - 1) * pageSize;

		const where: any = {
			organizationId,
		};

		if (query?.year) {
			where.year = parseInt(query.year.toString(), 10);
		}

		if (query?.category) {
			where.category = query.category;
		}

		if (query?.status) {
			where.status = query.status;
		}

		if (query?.search) {
			where.OR = [
				{ name: { contains: query.search } },
				{ description: { contains: query.search } },
			];
		}

		const [items, total] = await this.prisma.$transaction([
			this.prisma.taxDeduction.findMany({
				skip,
				take: pageSize,
				where,
				orderBy: query?.sortBy
					? { [query.sortBy]: (query.order ?? 'desc') as any }
					: { createdAt: 'desc' },
				include: {
					invoice: true,
					document: true,
				},
			}),
			this.prisma.taxDeduction.count({ where }),
		]);

		return {
			items,
			total,
			page,
			pageSize,
		};
	}

	/**
	 * Récupère une déduction fiscale par ID
	 * 
	 * @param organizationId - ID de l'organisation
	 * @param id - ID de la déduction
	 * @returns Déduction trouvée
	 * @throws {NotFoundException} Si déduction non trouvée
	 */
	async findOne(organizationId: number, id: number) {
		const deduction = await this.prisma.taxDeduction.findFirst({
			where: { id, organizationId },
			include: {
				invoice: true,
				document: true,
			},
		});

		if (!deduction) {
			throw new NotFoundException('Déduction fiscale non trouvée');
		}

		return deduction;
	}

	/**
	 * Met à jour une déduction fiscale
	 * 
	 * @param organizationId - ID de l'organisation
	 * @param id - ID de la déduction
	 * @param data - Données de mise à jour
	 * @returns Déduction mise à jour
	 * @throws {NotFoundException} Si déduction non trouvée
	 */
	async update(organizationId: number, id: number, data: UpdateTaxDeductionDto) {
		await this.findOne(organizationId, id);

		return this.prisma.taxDeduction.update({
			where: { id },
			data: {
				category: data.category,
				name: data.name,
				description: data.description,
				amount: data.amount,
				year: data.year,
				deductibleRate: data.deductibleRate,
				status: data.status,
				notes: data.notes,
			},
			include: {
				invoice: true,
				document: true,
			},
		});
	}

	/**
	 * Supprime une déduction fiscale
	 * 
	 * @param organizationId - ID de l'organisation
	 * @param id - ID de la déduction
	 * @returns Confirmation de suppression
	 * @throws {NotFoundException} Si déduction non trouvée
	 */
	async remove(organizationId: number, id: number) {
		await this.findOne(organizationId, id);
		await this.prisma.taxDeduction.delete({ where: { id } });
		return { success: true };
	}

	/**
	 * Calcule le total des déductions pour une année
	 * 
	 * @param organizationId - ID de l'organisation
	 * @param year - Année fiscale
	 * @returns Total des déductions validées
	 */
	async getTotalDeductions(organizationId: number, year: number) {
		const deductions = await this.prisma.taxDeduction.findMany({
			where: {
				organizationId,
				year,
				status: 'VALIDATED',
			},
		});

		const total = deductions.reduce((sum, d) => {
			const amount = Number(d.amount);
			const rate = Number(d.deductibleRate);
			return sum + amount * rate;
		}, 0);

		return {
			year,
			total: Math.round(total * 100) / 100,
			count: deductions.length,
			byCategory: deductions.reduce((acc, d) => {
				const category = d.category;
				const amount = Number(d.amount) * Number(d.deductibleRate);
				acc[category] = (acc[category] || 0) + amount;
				return acc;
			}, {} as Record<string, number>),
		};
	}

	/**
	 * Valide une déduction fiscale
	 * 
	 * @param organizationId - ID de l'organisation
	 * @param id - ID de la déduction
	 * @returns Déduction validée
	 */
	async validate(organizationId: number, id: number) {
		return this.update(organizationId, id, { status: 'VALIDATED' });
	}

	/**
	 * Rejette une déduction fiscale
	 * 
	 * @param organizationId - ID de l'organisation
	 * @param id - ID de la déduction
	 * @param reason - Raison du rejet
	 * @returns Déduction rejetée
	 */
	async reject(organizationId: number, id: number, reason?: string) {
		return this.update(organizationId, id, {
			status: 'REJECTED',
			notes: reason,
		});
	}
}

