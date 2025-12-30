import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganizationsService {
	constructor(private readonly prisma: PrismaService) {}

	async getProfile(orgId: number) {
		const organization = await this.prisma.organization.findUnique({
			where: { id: orgId },
			include: {
				documents: {
					where: { status: 'VALIDATED' },
					orderBy: { createdAt: 'desc' },
				},
			},
		});

		if (!organization) {
			throw new NotFoundException('Organisation introuvable');
		}

		return organization;
	}

	async updateProfile(orgId: number, data: any) {
		return this.prisma.organization.update({
			where: { id: orgId },
			data: {
				name: data.name,
				legalName: data.legalName,
				siret: data.siret,
				siren: data.siren,
				rcs: data.rcs,
				rcsCity: data.rcsCity,
				vatNumber: data.vatNumber,
				companyStatus: data.companyStatus,
				companyType: data.companyType,
				address: data.address,
				address2: data.address2,
				city: data.city,
				zipCode: data.zipCode,
				country: data.country,
				countryCode: data.countryCode,
				email: data.email,
				phone: data.phone,
				website: data.website,
				capital: data.capital,
				legalForm: data.legalForm,
				apeCode: data.apeCode,
				apeLabel: data.apeLabel,
				legalRepresentative: data.legalRepresentative,
				legalRepresentativeRole: data.legalRepresentativeRole,
				accountingYearEnd: data.accountingYearEnd,
				fiscalYear: data.fiscalYear,
				taxRegime: data.taxRegime,
				urssafRate: data.urssafRate,
				urssafActivity: data.urssafActivity,
				urssafFiscalOption: data.urssafFiscalOption,
				urssafDeclarationFrequency: data.urssafDeclarationFrequency,
				urssafThreshold: data.urssafThreshold,
				logo: data.logo,
				signature: data.signature,
				defaultCurrency: data.defaultCurrency,
				defaultLanguage: data.defaultLanguage,
				timezone: data.timezone,
			},
			include: {
				documents: {
					where: { status: 'VALIDATED' },
					orderBy: { createdAt: 'desc' },
				},
			},
		});
	}
}

