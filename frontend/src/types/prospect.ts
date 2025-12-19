export interface Prospect {
  id: string;
  companyName: string;
  industry: string;
  size: CompanySize;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country: string;
  revenue?: number;
  employees?: number;
  description?: string;
  painPoints?: string[];
  budget?: BudgetRange;
  decisionMaker?: ContactPerson;
  status: ProspectStatus;
  source: LeadSource;
  score: number; // 0-100
  priority: Priority;
  assignedTo?: string;
  lastContact?: Date;
  nextFollowUp?: Date;
  notes: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactPerson {
  name: string;
  position: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  isDecisionMaker: boolean;
}

export interface LeadSource {
  id: string;
  name: string;
  type: SourceType;
  cost?: number;
  conversionRate?: number;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  type: CampaignType;
  status: CampaignStatus;
  startDate: Date;
  endDate?: Date;
  budget?: number;
  targetAudience: TargetAudience;
  channels: Channel[];
  metrics: CampaignMetrics;
  createdAt: Date;
  updatedAt: Date;
}

export interface TargetAudience {
  industries?: string[];
  companySizes?: CompanySize[];
  countries?: string[];
  revenueRange?: BudgetRange;
  painPoints?: string[];
  tags?: string[];
}

export interface Channel {
  type: ChannelType;
  name: string;
  cost?: number;
  reach?: number;
  conversionRate?: number;
}

export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  cost: number;
  revenue: number;
  roi: number;
  ctr: number;
  cpc: number;
}

export interface Opportunity {
  id: string;
  prospectId: string;
  title: string;
  description?: string;
  value: number;
  probability: number; // 0-100
  stage: SalesStage;
  expectedCloseDate: Date;
  assignedTo?: string;
  activities: Activity[];
  notes: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  date: Date;
  duration?: number; // minutes
  outcome?: string;
  nextAction?: string;
  assignedTo?: string;
}

export interface OSINTData {
  id: string;
  prospectId: string;
  source: OSINTSource;
  data: Record<string, any>;
  confidence: number; // 0-100
  lastUpdated: Date;
}

export interface MarketResearch {
  id: string;
  title: string;
  description?: string;
  industry: string;
  data: MarketData[];
  insights: string[];
  recommendations: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketData {
  metric: string;
  value: number;
  unit: string;
  period: string;
  trend: Trend;
}

export interface Competitor {
  id: string;
  name: string;
  website: string;
  industry: string;
  strengths: string[];
  weaknesses: string[];
  marketShare?: number;
  pricing?: PricingStrategy;
  features: string[];
  lastAnalysis: Date;
}

export interface PricingStrategy {
  model: PricingModel;
  basePrice?: number;
  tiers?: PricingTier[];
  currency: string;
}

export interface PricingTier {
  name: string;
  price: number;
  features: string[];
  limits?: Record<string, number>;
}

// Enums
export enum CompanySize {
  STARTUP = 'startup',
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  ENTERPRISE = 'enterprise'
}

export enum BudgetRange {
  LOW = 'low', // < 10k
  MEDIUM = 'medium', // 10k - 50k
  HIGH = 'high', // 50k - 200k
  ENTERPRISE = 'enterprise' // > 200k
}

export enum ProspectStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  PROPOSAL = 'proposal',
  NEGOTIATION = 'negotiation',
  CLOSED_WON = 'closed_won',
  CLOSED_LOST = 'closed_lost',
  DISQUALIFIED = 'disqualified'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum SourceType {
  ORGANIC = 'organic',
  PAID = 'paid',
  REFERRAL = 'referral',
  PARTNERSHIP = 'partnership',
  EVENT = 'event',
  SOCIAL = 'social',
  DIRECT = 'direct'
}

export enum CampaignType {
  EMAIL = 'email',
  SOCIAL = 'social',
  CONTENT = 'content',
  PAID_ADS = 'paid_ads',
  EVENT = 'event',
  PARTNERSHIP = 'partnership'
}

export enum CampaignStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum ChannelType {
  EMAIL = 'email',
  LINKEDIN = 'linkedin',
  FACEBOOK = 'facebook',
  GOOGLE_ADS = 'google_ads',
  CONTENT_MARKETING = 'content_marketing',
  EVENTS = 'events',
  REFERRALS = 'referrals'
}

export enum SalesStage {
  PROSPECTING = 'prospecting',
  QUALIFICATION = 'qualification',
  PROPOSAL = 'proposal',
  NEGOTIATION = 'negotiation',
  CLOSING = 'closing',
  CLOSED = 'closed'
}

export enum ActivityType {
  CALL = 'call',
  EMAIL = 'email',
  MEETING = 'meeting',
  DEMO = 'demo',
  PROPOSAL = 'proposal',
  FOLLOW_UP = 'follow_up'
}

export enum OSINTSource {
  WEBSITE = 'website',
  LINKEDIN = 'linkedin',
  CRUNCHBASE = 'crunchbase',
  GLASSDOOR = 'glassdoor',
  NEWS = 'news',
  SOCIAL_MEDIA = 'social_media',
  PUBLIC_RECORDS = 'public_records'
}

export enum PricingModel {
  ONE_TIME = 'one_time',
  SUBSCRIPTION = 'subscription',
  USAGE_BASED = 'usage_based',
  FREEMIUM = 'freemium',
  ENTERPRISE = 'enterprise'
}

export enum Trend {
  UP = 'up',
  DOWN = 'down',
  STABLE = 'stable',
  VOLATILE = 'volatile'
}

// DTOs pour l'API
export interface CreateProspectDto {
  companyName: string;
  industry: string;
  size: CompanySize;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country: string;
  revenue?: number;
  employees?: number;
  description?: string;
  painPoints?: string[];
  budget?: BudgetRange;
  decisionMaker?: Omit<ContactPerson, 'isDecisionMaker'>;
  source: string;
  score?: number;
  priority?: Priority;
  assignedTo?: string;
  notes?: string[];
  tags?: string[];
}

export interface UpdateProspectDto extends Partial<CreateProspectDto> {
  status?: ProspectStatus;
  lastContact?: Date;
  nextFollowUp?: Date;
}

export interface CreateCampaignDto {
  name: string;
  description?: string;
  type: CampaignType;
  startDate: Date;
  endDate?: Date;
  budget?: number;
  targetAudience: TargetAudience;
  channels: Omit<Channel, 'conversionRate'>[];
}

export interface CreateOpportunityDto {
  prospectId: string;
  title: string;
  description?: string;
  value: number;
  probability: number;
  stage: SalesStage;
  expectedCloseDate: Date;
  assignedTo?: string;
}

export interface CreateActivityDto {
  type: ActivityType;
  title: string;
  description?: string;
  date: Date;
  duration?: number;
  outcome?: string;
  nextAction?: string;
  assignedTo?: string;
}

// Filtres et recherche
export interface ProspectFilters {
  status?: ProspectStatus[];
  industry?: string[];
  size?: CompanySize[];
  country?: string[];
  source?: string[];
  priority?: Priority[];
  assignedTo?: string;
  tags?: string[];
  scoreMin?: number;
  scoreMax?: number;
  createdAfter?: Date;
  createdBefore?: Date;
  search?: string;
}

export interface CampaignFilters {
  type?: CampaignType[];
  status?: CampaignStatus[];
  startDate?: Date;
  endDate?: Date;
  budgetMin?: number;
  budgetMax?: number;
}

export interface OpportunityFilters {
  stage?: SalesStage[];
  assignedTo?: string;
  valueMin?: number;
  valueMax?: number;
  probabilityMin?: number;
  probabilityMax?: number;
  expectedCloseAfter?: Date;
  expectedCloseBefore?: Date;
}
