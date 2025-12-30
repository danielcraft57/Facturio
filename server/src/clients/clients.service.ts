import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ListQueryDto } from '../common/dto/list-query.dto';


@Injectable()
export class ClientsService {
	constructor(private readonly prisma: PrismaService) {}

	async create(data: CreateClientDto, organizationId?: number) {
		// Validation nom
		if (!data.name) {
			throw new BadRequestException('Le nom est requis');
		}
		// Validation email
		if (!data.email) {
			throw new BadRequestException('Email requis');
		}
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(data.email)) {
			throw new BadRequestException('Email invalide');
		}
		
		// Nettoyer les données pour Prisma
		const cleanData: any = {
			...data,
			taxRateOverrideId: data.taxRateOverrideId || undefined
		};
		
		// Ajouter organizationId si fourni (pour compatibilité multi-tenant)
		if (organizationId) {
			cleanData.organizationId = organizationId;
		}
		
		return this.prisma.client.create({ data: cleanData });
	}

	async findAll(query: ListQueryDto, organizationId?: number) {
		const page = query.page ? parseInt(query.page.toString(), 10) : 1;
		const pageSize = query.pageSize ? parseInt(query.pageSize.toString(), 10) : 20;
		const skip = (page - 1) * pageSize;
		const where: any = query.search
			? {
				OR: [
					{ name: { contains: query.search } },
					{ email: { contains: query.search } },
					{ companyName: { contains: query.search } }
				]
			}
			: {};
		
		// Filtrer par organisation si fournie
		if (organizationId) {
			where.organizationId = organizationId;
		}
		const [items, total] = await this.prisma.$transaction([
			this.prisma.client.findMany({
				skip,
				take: pageSize,
				where,
				orderBy: query.sortBy
					? { [query.sortBy]: (query.order ?? 'desc') as any }
					: { createdAt: 'desc' }
			}),
			this.prisma.client.count({ where })
		]);
		return { items, total, page, pageSize };
	}

	async findOne(id: number, organizationId?: number) {
		const where: any = { id };
		if (organizationId) {
			where.organizationId = organizationId;
		}
		const client = await this.prisma.client.findUnique({ where });
		if (!client) throw new NotFoundException('Client non trouve');
		return client;
	}

	async update(id: number, data: UpdateClientDto, organizationId?: number) {
		await this.findOne(id, organizationId);
		
		// Nettoyer les données pour Prisma
		const cleanData = {
			...data,
			taxRateOverrideId: data.taxRateOverrideId || undefined
		};
		
		return this.prisma.client.update({ where: { id }, data: cleanData });
	}

	async remove(id: number, organizationId?: number) {
		await this.findOne(id, organizationId);
		await this.prisma.client.delete({ where: { id } });
		return { success: true };
	}
}


