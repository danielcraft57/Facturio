import { Module } from '@nestjs/common';
import { UrssafController } from './urssaf.controller';
import { UrssafService } from './urssaf.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AccountingModule } from '../accounting/accounting.module';
import { FilingsModule } from '../filings/filings.module';

/**
 * Module URSSAF
 * 
 * Gère les cotisations URSSAF pour auto-entrepreneurs et micro-entreprises :
 * - Calcul des cotisations basées sur le CA
 * - Création de déclarations automatiques (mensuelles/trimestrielles)
 * - Configuration des paramètres URSSAF par organisation
 * - Vérification des seuils de CA annuel
 * 
 * @see UrssafService pour la logique métier
 * @see UrssafController pour les endpoints API
 */
@Module({
	imports: [PrismaModule, AccountingModule, FilingsModule],
	controllers: [UrssafController],
	providers: [UrssafService],
	exports: [UrssafService],
})
export class UrssafModule {}

