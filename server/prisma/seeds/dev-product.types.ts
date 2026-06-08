import type { ProductKind } from '@prisma/client';
import type { TechStackAssembly } from '../../src/catalog/tech-assembly.types';

/** Produit développeur = livrable facturable + assemblage techno explicite. */
export type DevProductSeed = {
	name: string;
	sku: string;
	kind: ProductKind;
	unitPrice: number;
	category: string;
	purpose?: string;
	/** Stack livrée : langages, frameworks, CMS, BDD, DevOps… */
	assembly: TechStackAssembly;
	estimatedHours?: number | null;
	description: string;
	details: string[];
	iconName: string;
	visualType?: 'icon' | 'library' | 'custom';
	imageData?: string;
	/** junior = premier client / étudiant ; standard = freelance ; expert = agence */
	profile?: 'junior' | 'standard' | 'expert';
};
