export interface Client {
  id: string;
  name: string;
  email: string;
  address?: string;
  isCompany: boolean;
  companyName?: string;
  vatNumber?: string;
  isVatExempt: boolean;
  countryCode?: string;
  createdAt: string;
  updatedAt: string;
}

export type ClientStatus = 'active' | 'inactive';

export interface CreateClientData {
  name: string;
  email: string;
  address?: string;
  isCompany?: boolean;
  companyName?: string;
  vatNumber?: string;
  isVatExempt?: boolean;
  countryCode?: string;
}

export interface UpdateClientData {
  name?: string;
  email?: string;
  address?: string;
  isCompany?: boolean;
  companyName?: string;
  vatNumber?: string;
  isVatExempt?: boolean;
  countryCode?: string;
}

export interface ClientFilters {
  status?: ClientStatus;
  search?: string;
  isCompany?: boolean;
}

export interface ClientListResponse {
  data: Client[];
  total: number;
  page: number;
  limit: number;
}
