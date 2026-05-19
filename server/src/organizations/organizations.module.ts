import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { SireneLookupService } from './sirene-lookup.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
	imports: [PrismaModule],
	controllers: [OrganizationsController],
	providers: [OrganizationsService, SireneLookupService],
	exports: [OrganizationsService],
})
export class OrganizationsModule {}

