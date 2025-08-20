import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateTaxDto {
	name: string;
	rate: number; // 0.2 pour 20%
	isDefault?: boolean;
}

export interface UpdateTaxDto {
	name?: string;
	rate?: number;
	isDefault?: boolean;
}

@Injectable()
export class TaxesService {
	constructor(private readonly prisma: PrismaService) {}

	create(data: CreateTaxDto) {
		// Validation
		if (!data.name) {
			throw new BadRequestException('Le nom est requis');
		}
		if (data.rate < 0 || data.rate > 1) {
			throw new BadRequestException('Le taux doit être entre 0 et 1 (0% à 100%)');
		}
		return this.prisma.taxRate.create({ data });
	}

	findAll(query?: { search?: string; isDefault?: boolean }) {
		const where = query?.search
			? { name: { contains: query.search } }
			: query?.isDefault !== undefined
			? { isDefault: query.isDefault }
			: undefined;

		return this.prisma.taxRate.findMany({ 
			where,
			orderBy: { createdAt: 'desc' } 
		});
	}

	async findOne(id: number) {
		const tax = await this.prisma.taxRate.findUnique({ where: { id } });
		if (!tax) throw new NotFoundException('Taux non trouve');
		return tax;
	}

	async update(id: number, data: UpdateTaxDto) {
		await this.findOne(id);
		return this.prisma.taxRate.update({ where: { id }, data });
	}

	async remove(id: number) {
		await this.findOne(id);
		await this.prisma.taxRate.delete({ where: { id } });
		return { success: true };
	}
}


