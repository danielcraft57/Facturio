import { Injectable, NotFoundException } from '@nestjs/common';
import { BillingInterval, ProductKind } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateProductDto {
	name: string;
	sku?: string | null;
	kind?: ProductKind;
	unitPrice?: number | null;
	defaultTaxRateId?: number | null;
}

export interface UpdateProductDto {
	name?: string;
	sku?: string | null;
	kind?: ProductKind;
	unitPrice?: number | null;
	defaultTaxRateId?: number | null;
}

@Injectable()
export class ProductsService {
	constructor(private readonly prisma: PrismaService) {}

	create(data: CreateProductDto) {
		return this.prisma.product.create({ data });
	}

	findAll() {
		return this.prisma.product.findMany({ orderBy: { createdAt: 'desc' }, include: { defaultTaxRate: true } });
	}

	async findOne(id: number) {
		const product = await this.prisma.product.findUnique({ where: { id }, include: { defaultTaxRate: true } });
		if (!product) throw new NotFoundException('Produit non trouve');
		return product;
	}

	async update(id: number, data: UpdateProductDto) {
		await this.findOne(id);
		return this.prisma.product.update({ where: { id }, data, include: { defaultTaxRate: true } });
	}

	async remove(id: number) {
		await this.findOne(id);
		await this.prisma.product.delete({ where: { id } });
		return { success: true };
	}
}


