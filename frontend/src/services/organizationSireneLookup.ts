import { apiClient } from './api'
import { unwrapApiPayload } from './clients'

export type SireneLookupResult = {
  siren: string
  siret: string | null
  legalName: string | null
  name: string | null
  legalForm: string | null
  apeCode: string | null
  address: string | null
  zipCode: string | null
  city: string | null
  country: string
  rcsCity: string | null
  companyStatus: 'AUTO_ENTREPRENEUR' | 'MICRO_ENTERPRISE' | null
  source: string
  partial: boolean
}

export function lookupOrganizationFromSiret(siretOrSiren: string): Promise<SireneLookupResult> {
  const digits = siretOrSiren.replace(/\D/g, '')
  return apiClient
    .get<SireneLookupResult>(`/organization/siret-lookup/${digits}`)
    .then((res) => unwrapApiPayload<SireneLookupResult>(res))
}

/** TVA intracommunautaire française à partir du SIREN (si assujetti). */
export function computeFrenchVatFromSiren(siren: string): string | null {
  const d = siren.replace(/\D/g, '')
  if (d.length !== 9) return null
  const sirenNum = Number(d)
  if (!Number.isFinite(sirenNum)) return null
  const key = (12 + 3 * (sirenNum % 97)) % 97
  return `FR${String(key).padStart(2, '0')}${d}`
}
