import { apiClient } from './api'
import { unwrapApiPayload } from './clients'
import { resolveApiBaseUrl } from '../utils/resolveApiBaseUrl'

export type ComplianceCheck = {
  id: string
  label: string
  ok: boolean
  hint?: string
}

export type OrganizationReadiness = {
  ready: boolean
  score: number
  checks: ComplianceCheck[]
  planAllowsEInvoicing: boolean
  paConnected: boolean
  message: string
  reformDates?: { reception: string; emissionEti: string; emissionPme: string }
  nextSteps?: string[]
}

export type InvoiceReadiness = {
  invoiceId: number
  invoiceNumber: string
  status: string
  ready: boolean
  score: number
  checks: ComplianceCheck[]
  canGenerateFacturX: boolean
  organization?: OrganizationReadiness
  client?: { ready: boolean; score: number; checks: ComplianceCheck[] }
}

export type ReformMilestone = {
  kind: 'reception' | 'emission' | 'ereporting'
  date: string
  label: string
  description: string
  active: boolean
}

export type ReformSchedule = {
  companySize: string
  companySizeLabel: string
  receptionDate: string
  emissionDate: string
  ereportingDate: string
  milestones: ReformMilestone[]
  summary: string
  recommendation: string
}

export const eInvoicingService = {
  getReformSchedule: async (companySize?: string): Promise<ReformSchedule> => {
    const q = companySize ? `?companySize=${encodeURIComponent(companySize)}` : ''
    const res = await fetch(`${resolveApiBaseUrl()}/e-invoicing/reform-schedule${q}`, {
      credentials: 'include',
    })
    if (!res.ok) {
      throw new Error('Impossible de charger le calendrier réforme')
    }
    return res.json() as Promise<ReformSchedule>
  },

  getOrganizationReadiness: async (): Promise<OrganizationReadiness> => {
    const res = await apiClient.get<OrganizationReadiness>('e-invoicing/readiness')
    return unwrapApiPayload<OrganizationReadiness>(res)
  },

  getInvoiceReadiness: async (invoiceId: number): Promise<InvoiceReadiness> => {
    const res = await apiClient.get<InvoiceReadiness>(`e-invoicing/invoices/${invoiceId}/readiness`)
    return unwrapApiPayload<InvoiceReadiness>(res)
  },

  async downloadFacturX(invoiceId: number): Promise<void> {
    const base = resolveApiBaseUrl()
    const res = await fetch(`${base}/e-invoicing/invoices/${invoiceId}/factur-x`, { credentials: 'include' })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error((err as { message?: string }).message || 'Génération Factur-X impossible')
    }
    const blob = await res.blob()
    const disposition = res.headers.get('Content-Disposition')
    const match = disposition?.match(/filename="([^"]+)"/)
    const filename = match?.[1] || `factur-x-${invoiceId}.xml`
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  },
}
