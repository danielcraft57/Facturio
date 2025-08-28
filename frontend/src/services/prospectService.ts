import { ApiClient } from './apiClient';
import type {
  Prospect,
  CreateProspectDto,
  UpdateProspectDto,
  ProspectFilters
} from '../types/prospect';
import { CompanySize, BudgetRange, ProspectStatus, SourceType, Priority } from '../types/prospect';

// Mock data pour le développement
const mockProspects: Prospect[] = [
  {
    id: '1',
    companyName: 'TechStartup Inc',
    industry: 'SaaS',
    size: CompanySize.STARTUP,
    website: 'https://techstartup.com',
    email: 'contact@techstartup.com',
    phone: '+33 1 23 45 67 89',
    address: '123 Rue de l\'Innovation',
    city: 'Paris',
    country: 'France',
    revenue: 500000,
    employees: 15,
    description: 'Startup spécialisée dans l\'IA pour PME',
    painPoints: ['Manque de visibilité', 'Difficulté de recrutement'],
    budget: BudgetRange.MEDIUM,
    decisionMaker: {
      name: 'Marie Dupont',
      position: 'CEO',
      email: 'marie@techstartup.com',
      linkedin: 'linkedin.com/in/mariedupont',
      isDecisionMaker: true
    },
    status: ProspectStatus.QUALIFIED,
    source: {
      id: '1',
      name: 'LinkedIn Ads',
      type: SourceType.PAID,
      cost: 150,
      conversionRate: 2.5
    },
    score: 85,
    priority: Priority.HIGH,
    assignedTo: 'sales1',
    lastContact: new Date('2024-01-15'),
    nextFollowUp: new Date('2024-01-22'),
    notes: ['Intéressé par notre solution de facturation', 'Budget disponible Q1 2024'],
    tags: ['SaaS', 'IA', 'PME'],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-15')
  }
];

// Service principal
export class ProspectService {
  private apiClient = ApiClient.getInstance();

  // Prospects
  async getProspects(filters?: ProspectFilters, page = 1, limit = 20): Promise<{ data: Prospect[]; total: number }> {
    // Mock pour le développement
    let filtered = [...mockProspects];
    
    if (filters?.status) {
      filtered = filtered.filter(p => filters.status!.includes(p.status));
    }
    if (filters?.industry) {
      filtered = filtered.filter(p => filters.industry!.includes(p.industry));
    }
    
    return {
      data: filtered.slice((page - 1) * limit, page * limit),
      total: filtered.length
    };
  }

  async createProspect(data: CreateProspectDto): Promise<Prospect> {
    const newProspect: Prospect = {
      ...data,
      id: Date.now().toString(),
      status: ProspectStatus.NEW,
      source: {
        id: data.source,
        name: data.source,
        type: SourceType.DIRECT
      },
      score: data.score || 50,
      priority: data.priority || Priority.MEDIUM,
      notes: data.notes || [],
      tags: data.tags || [],
      decisionMaker: data.decisionMaker ? {
        name: data.decisionMaker.name,
        position: data.decisionMaker.position,
        email: data.decisionMaker.email,
        phone: data.decisionMaker.phone,
        linkedin: data.decisionMaker.linkedin,
        isDecisionMaker: true
      } : undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockProspects.push(newProspect);
    return newProspect;
  }

  async updateProspect(id: string, data: UpdateProspectDto): Promise<Prospect> {
    const index = mockProspects.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Prospect non trouvé');
    
    const updatedProspect = {
      ...mockProspects[index],
      ...data,
      updatedAt: new Date()
    } as Prospect;

    // Gérer le decisionMaker si fourni
    if (data.decisionMaker) {
      (updatedProspect as any).decisionMaker = {
        name: data.decisionMaker.name,
        position: data.decisionMaker.position,
        email: data.decisionMaker.email,
        phone: data.decisionMaker.phone,
        linkedin: data.decisionMaker.linkedin,
        isDecisionMaker: true
      };
    }

    // Gérer la source si fournie
    if (typeof data.source === 'string') {
      (updatedProspect as any).source = {
        id: data.source,
        name: data.source,
        type: SourceType.DIRECT
      };
    }

    mockProspects[index] = updatedProspect;
    return updatedProspect;
  }

  async deleteProspect(id: string): Promise<void> {
    const index = mockProspects.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Prospect non trouvé');
    mockProspects.splice(index, 1);
  }

  // Métriques et analytics
  async getProspectMetrics(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byIndustry: Record<string, number>;
    conversionRate: number;
    averageScore: number;
  }> {
    const byStatus = mockProspects.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byIndustry = mockProspects.reduce((acc, p) => {
      acc[p.industry] = (acc[p.industry] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const averageScore = mockProspects.reduce((sum, p) => sum + p.score, 0) / mockProspects.length;
    
    return {
      total: mockProspects.length,
      byStatus,
      byIndustry,
      conversionRate: 15.5,
      averageScore: Math.round(averageScore)
    };
  }
}

export const prospectService = new ProspectService();
