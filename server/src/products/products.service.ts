import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ListQueryDto } from '../common/dto/list-query.dto';

@Injectable()
export class ProductsService {
	constructor(private readonly prisma: PrismaService) {}

	create(data: CreateProductDto) {
		return this.prisma.product.create({ 
			data,
			include: { defaultTaxRate: true }
		});
	}

	async findAll(query?: ListQueryDto) {
		const page = query?.page ? parseInt(query.page.toString(), 10) : 1;
		const pageSize = query?.pageSize ? parseInt(query.pageSize.toString(), 10) : 20;
		const skip = (page - 1) * pageSize;

		const where = query?.search
			? {
				OR: [
					{ name: { contains: query.search } },
					{ sku: { contains: query.search } }
				]
			}
			: undefined;

		const [items, total] = await this.prisma.$transaction([
			this.prisma.product.findMany({
				skip,
				take: pageSize,
				where,
				orderBy: query?.sortBy
					? { [query.sortBy]: (query.order ?? 'desc') as any }
					: { createdAt: 'desc' },
				include: { defaultTaxRate: true }
			}),
			this.prisma.product.count({ where })
		]);

		return {
			items,
			total,
			page,
			pageSize
		};
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


