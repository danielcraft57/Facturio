import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateSupplierDto } from './dto/create-supplier.dto';
import type { UpdateSupplierDto } from './dto/update-supplier.dto';

/**
 * Service du référentiel fournisseurs.
 * Gère le CRUD multi-tenant et le lien optionnel avec les créanciers de dettes.
 */
@Injectable()
export class SuppliersService {
	constructor(private readonly prisma: PrismaService) {}

	/**
	 * Vérifie qu'une organisation est présente.
	 * @param organizationId - Identifiant d'organisation
	 * @returns L'identifiant validé
	 * @throws BadRequestException si absent
	 */
	private assertOrg(organizationId?: number): number {
		if (organizationId == null) throw new BadRequestException('Organisation requise');
		return organizationId;
	}

	/**
	 * Liste les fournisseurs de l'organisation.
	 * @param organizationId - Organisation courante
	 * @param activeOnly - Si true, filtre les fournisseurs actifs
	 */
	async findAll(organizationId?: number, activeOnly = false) {
		const orgId = this.assertOrg(organizationId);
		return this.prisma.supplier.findMany({
			where: {
				organizationId: orgId,
				...(activeOnly ? { isActive: true } : {}),
			},
			orderBy: { name: 'asc' },
		});
	}

	/**
	 * Récupère un fournisseur par id.
	 * @param organizationId - Organisation courante
	 * @param id - Identifiant fournisseur
	 */
	async findOne(organizationId: number | undefined, id: number) {
		const orgId = this.assertOrg(organizationId);
		const supplier = await this.prisma.supplier.findFirst({
			where: { id, organizationId: orgId },
			include: {
				creditors: {
					select: { id: true, name: true, email: true },
				},
			},
		});
		if (!supplier) throw new NotFoundException('Fournisseur introuvable');
		return supplier;
	}

	/**
	 * Crée un fournisseur.
	 * @param organizationId - Organisation courante
	 * @param dto - Données de création
	 */
	async create(organizationId: number | undefined, dto: CreateSupplierDto) {
		const orgId = this.assertOrg(organizationId);
		return this.prisma.supplier.create({
			data: {
				organizationId: orgId,
				name: dto.name.trim(),
				legalName: dto.legalName?.trim() || null,
				siret: dto.siret?.trim() || null,
				vatNumber: dto.vatNumber?.trim() || null,
				email: dto.email?.trim() || null,
				phone: dto.phone?.trim() || null,
				address: dto.address?.trim() || null,
				city: dto.city?.trim() || null,
				zipCode: dto.zipCode?.trim() || null,
				country: dto.country?.trim() || 'FR',
				paymentTermsDays: dto.paymentTermsDays ?? 30,
				iban: dto.iban?.trim() || null,
				bic: dto.bic?.trim() || null,
				notes: dto.notes?.trim() || null,
				isActive: dto.isActive ?? true,
			},
		});
	}

	/**
	 * Met à jour un fournisseur.
	 * @param organizationId - Organisation courante
	 * @param id - Identifiant fournisseur
	 * @param dto - Champs à modifier
	 */
	async update(organizationId: number | undefined, id: number, dto: UpdateSupplierDto) {
		await this.findOne(organizationId, id);
		const orgId = this.assertOrg(organizationId);
		return this.prisma.supplier.update({
			where: { id },
			data: {
				...(dto.name != null ? { name: dto.name.trim() } : {}),
				...(dto.legalName !== undefined ? { legalName: dto.legalName?.trim() || null } : {}),
				...(dto.siret !== undefined ? { siret: dto.siret?.trim() || null } : {}),
				...(dto.vatNumber !== undefined ? { vatNumber: dto.vatNumber?.trim() || null } : {}),
				...(dto.email !== undefined ? { email: dto.email?.trim() || null } : {}),
				...(dto.phone !== undefined ? { phone: dto.phone?.trim() || null } : {}),
				...(dto.address !== undefined ? { address: dto.address?.trim() || null } : {}),
				...(dto.city !== undefined ? { city: dto.city?.trim() || null } : {}),
				...(dto.zipCode !== undefined ? { zipCode: dto.zipCode?.trim() || null } : {}),
				...(dto.country !== undefined ? { country: dto.country?.trim() || 'FR' } : {}),
				...(dto.paymentTermsDays !== undefined ? { paymentTermsDays: dto.paymentTermsDays } : {}),
				...(dto.iban !== undefined ? { iban: dto.iban?.trim() || null } : {}),
				...(dto.bic !== undefined ? { bic: dto.bic?.trim() || null } : {}),
				...(dto.notes !== undefined ? { notes: dto.notes?.trim() || null } : {}),
				...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
				organizationId: orgId,
			},
		});
	}

	/**
	 * Désactive un fournisseur (soft delete).
	 * @param organizationId - Organisation courante
	 * @param id - Identifiant fournisseur
	 */
	async deactivate(organizationId: number | undefined, id: number) {
		await this.findOne(organizationId, id);
		return this.prisma.supplier.update({
			where: { id },
			data: { isActive: false },
		});
	}

	/**
	 * Crée un créancier de dette lié à ce fournisseur (pont vers le module dettes).
	 * @param organizationId - Organisation courante
	 * @param supplierId - Identifiant fournisseur
	 */
	async linkAsCreditor(organizationId: number | undefined, supplierId: number) {
		const supplier = await this.findOne(organizationId, supplierId);
		const orgId = this.assertOrg(organizationId);
		const existing = await this.prisma.payableCreditor.findFirst({
			where: { organizationId: orgId, supplierId },
		});
		if (existing) return existing;
		return this.prisma.payableCreditor.create({
			data: {
				organizationId: orgId,
				supplierId,
				name: supplier.name,
				email: supplier.email,
				notes: supplier.notes,
			},
		});
	}
}
