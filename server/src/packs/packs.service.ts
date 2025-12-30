import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListQueryDto } from '../common/dto/list-query.dto';
import { CreatePackDto } from './dto/create-pack.dto';
import { UpdatePackDto } from './dto/update-pack.dto';

@Injectable()
export class PacksService {
	constructor(private readonly prisma: PrismaService) {}

	async create(data: CreatePackDto) {
		// Calculer totalHours et totalPrice depuis les produits
		const productIds = data.products.map((id) => Number(id)).filter((id) => !isNaN(id));
		const products = await this.prisma.product.findMany({
			where: { id: { in: productIds } }
		});

		// Estimation simple: 1h par produit, prix = somme des prix unitaires
		const totalHours = products.length; // TODO: calculer depuis les produits réels
		const totalPrice = products.reduce((sum, p) => sum + Number(p.unitPrice || 0), 0);

		const pack = await this.prisma.pack.create({
			data: {
				name: data.name,
				type: data.type as any,
				description: data.description,
				details: data.details,
				products: JSON.stringify(data.products),
				totalHours,
				totalPrice,
				features: data.features ? JSON.stringify(data.features) : null,
				deliveryTime: data.deliveryTime
			}
		});

		return this.formatPack(pack);
	}

	async findAll(query: ListQueryDto) {
		const page = query?.page ? parseInt(query.page.toString(), 10) : 1;
		const pageSize = query?.pageSize ? parseInt(query.pageSize.toString(), 10) : 20;
		const skip = (page - 1) * pageSize;

		const where: any = {};
		if (query.search) {
			where.OR = [{ name: { contains: query.search } }, { description: { contains: query.search } }];
		}

		const [items, total] = await this.prisma.$transaction([
			this.prisma.pack.findMany({
				skip,
				take: pageSize,
				where,
				orderBy: query.sortBy ? { [query.sortBy]: (query.order ?? 'desc') as any } : { createdAt: 'desc' }
			}),
			this.prisma.pack.count({ where })
		]);

		return {
			packs: items.map((p) => this.formatPack(p)),
			total,
			page,
			limit: pageSize
		};
	}

	async findOne(id: number) {
		const pack = await this.prisma.pack.findUnique({ where: { id } });
		if (!pack) {
			throw new NotFoundException('Pack non trouve');
		}
		return this.formatPack(pack);
	}

	async update(id: number, data: UpdatePackDto) {
		await this.findOne(id);

		const updateData: any = {};
		if (data.name !== undefined) updateData.name = data.name;
		if (data.type !== undefined) updateData.type = data.type as any;
		if (data.description !== undefined) updateData.description = data.description;
		if (data.details !== undefined) updateData.details = data.details;
		if (data.products !== undefined) {
			updateData.products = JSON.stringify(data.products);
			// Recalculer totalHours et totalPrice
			const productIds = data.products.map((id) => Number(id)).filter((id) => !isNaN(id));
			const products = await this.prisma.product.findMany({
				where: { id: { in: productIds } }
			});
			updateData.totalHours = products.length;
			updateData.totalPrice = products.reduce((sum, p) => sum + Number(p.unitPrice || 0), 0);
		}
		if (data.features !== undefined) updateData.features = JSON.stringify(data.features);
		if (data.deliveryTime !== undefined) updateData.deliveryTime = data.deliveryTime;

		const updated = await this.prisma.pack.update({
			where: { id },
			data: updateData
		});

		return this.formatPack(updated);
	}

	async remove(id: number) {
		await this.findOne(id);
		await this.prisma.pack.delete({ where: { id } });
		return { success: true };
	}

	private formatPack(p: any) {
		return {
			id: String(p.id),
			name: p.name,
			type: p.type,
			description: p.description,
			details: p.details,
			products: p.products ? JSON.parse(p.products) : [],
			totalHours: p.totalHours,
			totalPrice: Number(p.totalPrice),
			isTemplate: p.isTemplate,
			templateId: p.templateId,
			features: p.features ? JSON.parse(p.features) : [],
			deliveryTime: p.deliveryTime,
			createdAt: p.createdAt.toISOString(),
			updatedAt: p.updatedAt.toISOString()
		};
	}
}




