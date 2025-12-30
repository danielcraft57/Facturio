import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListQueryDto } from '../common/dto/list-query.dto';
import { CreateProspectDto } from './dto/create-prospect.dto';
import { UpdateProspectDto } from './dto/update-prospect.dto';

@Injectable()
export class ProspectsService {
	constructor(private readonly prisma: PrismaService) {}

	async create(data: CreateProspectDto) {
		const prospect = await this.prisma.prospect.create({
			data: {
				companyName: data.companyName,
				industry: data.industry,
				size: data.size as any,
				website: data.website,
				email: data.email,
				phone: data.phone,
				address: data.address,
				city: data.city,
				country: data.country,
				revenue: data.revenue,
				employees: data.employees,
				description: data.description,
				painPoints: data.painPoints ? JSON.stringify(data.painPoints) : null,
				budget: data.budget as any,
				decisionMakerName: data.decisionMaker?.name,
				decisionMakerPosition: data.decisionMaker?.position,
				decisionMakerEmail: data.decisionMaker?.email,
				decisionMakerPhone: data.decisionMaker?.phone,
				decisionMakerLinkedin: data.decisionMaker?.linkedin,
				sourceType: (data.source as any) || 'DIRECT',
				sourceName: data.source,
				score: data.score ?? 50,
				priority: (data.priority as any) || 'MEDIUM',
				assignedTo: data.assignedTo,
				notes: data.notes ? JSON.stringify(data.notes) : null,
				tags: data.tags ? JSON.stringify(data.tags) : null
			}
		});

		return this.formatProspect(prospect);
	}

	async findAll(query: ListQueryDto) {
		const page = query?.page ? parseInt(query.page.toString(), 10) : 1;
		const pageSize = query?.pageSize ? parseInt(query.pageSize.toString(), 10) : 20;
		const skip = (page - 1) * pageSize;

		const where: any = {};
		if (query.search) {
			where.OR = [
				{ companyName: { contains: query.search } },
				{ industry: { contains: query.search } },
				{ email: { contains: query.search } }
			];
		}

		const [items, total] = await this.prisma.$transaction([
			this.prisma.prospect.findMany({
				skip,
				take: pageSize,
				where,
				orderBy: query.sortBy ? { [query.sortBy]: (query.order ?? 'desc') as any } : { createdAt: 'desc' }
			}),
			this.prisma.prospect.count({ where })
		]);

		return {
			data: items.map((p) => this.formatProspect(p)),
			total,
			page,
			pageSize
		};
	}

	async findOne(id: number) {
		const prospect = await this.prisma.prospect.findUnique({ where: { id } });
		if (!prospect) {
			throw new NotFoundException('Prospect non trouve');
		}
		return this.formatProspect(prospect);
	}

	async update(id: number, data: UpdateProspectDto) {
		await this.findOne(id);

		const updateData: any = {};
		if (data.companyName !== undefined) updateData.companyName = data.companyName;
		if (data.industry !== undefined) updateData.industry = data.industry;
		if (data.size !== undefined) updateData.size = data.size as any;
		if (data.website !== undefined) updateData.website = data.website;
		if (data.email !== undefined) updateData.email = data.email;
		if (data.phone !== undefined) updateData.phone = data.phone;
		if (data.address !== undefined) updateData.address = data.address;
		if (data.city !== undefined) updateData.city = data.city;
		if (data.country !== undefined) updateData.country = data.country;
		if (data.revenue !== undefined) updateData.revenue = data.revenue;
		if (data.employees !== undefined) updateData.employees = data.employees;
		if (data.description !== undefined) updateData.description = data.description;
		if (data.painPoints !== undefined) updateData.painPoints = JSON.stringify(data.painPoints);
		if (data.budget !== undefined) updateData.budget = data.budget as any;
		if (data.decisionMaker) {
			if (data.decisionMaker.name !== undefined) updateData.decisionMakerName = data.decisionMaker.name;
			if (data.decisionMaker.position !== undefined) updateData.decisionMakerPosition = data.decisionMaker.position;
			if (data.decisionMaker.email !== undefined) updateData.decisionMakerEmail = data.decisionMaker.email;
			if (data.decisionMaker.phone !== undefined) updateData.decisionMakerPhone = data.decisionMaker.phone;
			if (data.decisionMaker.linkedin !== undefined) updateData.decisionMakerLinkedin = data.decisionMaker.linkedin;
		}
		if (data.status !== undefined) updateData.status = data.status as any;
		if (data.source !== undefined) {
			updateData.sourceType = data.source as any;
			updateData.sourceName = data.source;
		}
		if (data.score !== undefined) updateData.score = data.score;
		if (data.priority !== undefined) updateData.priority = data.priority as any;
		if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo;
		if (data.lastContact !== undefined) updateData.lastContact = new Date(data.lastContact);
		if (data.nextFollowUp !== undefined) updateData.nextFollowUp = new Date(data.nextFollowUp);
		if (data.notes !== undefined) updateData.notes = JSON.stringify(data.notes);
		if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags);

		const updated = await this.prisma.prospect.update({
			where: { id },
			data: updateData
		});

		return this.formatProspect(updated);
	}

	async remove(id: number) {
		await this.findOne(id);
		await this.prisma.prospect.delete({ where: { id } });
		return { success: true };
	}

	async getMetrics() {
		const total = await this.prisma.prospect.count();
		const byStatus = await this.prisma.prospect.groupBy({
			by: ['status'],
			_count: { id: true }
		});
		const byIndustry = await this.prisma.prospect.groupBy({
			by: ['industry'],
			_count: { id: true }
		});

		const avgScore = await this.prisma.prospect.aggregate({
			_avg: { score: true }
		});

		return {
			total,
			byStatus: byStatus.reduce((acc, s) => {
				acc[s.status] = s._count.id;
				return acc;
			}, {} as Record<string, number>),
			byIndustry: byIndustry.reduce((acc, i) => {
				acc[i.industry] = i._count.id;
				return acc;
			}, {} as Record<string, number>),
			conversionRate: 15.5, // TODO: calculer depuis les données
			averageScore: Math.round(avgScore._avg.score || 50)
		};
	}

	private formatProspect(p: any) {
		return {
			id: String(p.id),
			companyName: p.companyName,
			industry: p.industry,
			size: p.size.toLowerCase(),
			website: p.website,
			email: p.email,
			phone: p.phone,
			address: p.address,
			city: p.city,
			country: p.country,
			revenue: p.revenue ? Number(p.revenue) : undefined,
			employees: p.employees,
			description: p.description,
			painPoints: p.painPoints ? JSON.parse(p.painPoints) : [],
			budget: p.budget ? p.budget.toLowerCase() : undefined,
			decisionMaker: p.decisionMakerName
				? {
						name: p.decisionMakerName,
						position: p.decisionMakerPosition,
						email: p.decisionMakerEmail,
						phone: p.decisionMakerPhone,
						linkedin: p.decisionMakerLinkedin,
						isDecisionMaker: true
					}
				: undefined,
			status: p.status.toLowerCase(),
			source: {
				id: p.sourceType || 'DIRECT',
				name: p.sourceName || p.sourceType || 'Direct',
				type: (p.sourceType || 'DIRECT').toLowerCase(),
				cost: p.sourceCost ? Number(p.sourceCost) : undefined,
				conversionRate: p.sourceConversionRate ? Number(p.sourceConversionRate) : undefined
			},
			score: p.score,
			priority: p.priority.toLowerCase(),
			assignedTo: p.assignedTo,
			lastContact: p.lastContact,
			nextFollowUp: p.nextFollowUp,
			notes: p.notes ? JSON.parse(p.notes) : [],
			tags: p.tags ? JSON.parse(p.tags) : [],
			createdAt: p.createdAt,
			updatedAt: p.updatedAt
		};
	}
}

