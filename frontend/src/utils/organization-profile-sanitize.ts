import type { OrganizationProfile, UpdateOrganizationProfile } from '../services/organizationService'
import {
  digitsOnly,
  hasBlockingSirenError,
  hasBlockingSiretError,
  isValidSiren,
  isValidSiret,
} from './french-siret'

const MAX = {
  name: 200,
  legalName: 200,
  email: 254,
  phone: 32,
  website: 500,
  address: 300,
  city: 120,
  zipCode: 16,
  vatNumber: 32,
  rcs: 80,
  signatureChars: 600_000,
} as const

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function trim(value: unknown, max: number): string | null {
  if (value == null) return null
  const s = String(value).trim().slice(0, max)
  return s || null
}

function normalizeUrl(value: unknown): string | null {
  const s = trim(value, MAX.website)
  if (!s) return null
  if (/^https?:\/\//i.test(s)) return s
  return `https://${s}`
}

export function validateOrganizationForm(
  form: UpdateOrganizationProfile,
): { canSave: boolean; message: string | null } {
  const name = (form.name ?? '').trim()
  if (!name) {
    return { canSave: false, message: 'Le nom affiché est obligatoire.' }
  }
  if (hasBlockingSirenError(form.siren)) {
    return { canSave: false, message: 'Corrigez le SIREN avant enregistrement.' }
  }
  if (hasBlockingSiretError(form.siret, form.siren)) {
    return { canSave: false, message: 'Corrigez le SIRET avant enregistrement.' }
  }
  const email = (form.email ?? '').trim()
  if (email && !EMAIL_RE.test(email)) {
    return { canSave: false, message: 'Adresse email invalide.' }
  }
  const dpo = (form.dataControllerEmail ?? '').trim()
  if (dpo && !EMAIL_RE.test(dpo)) {
    return { canSave: false, message: 'Email contact données (RGPD) invalide.' }
  }
  const sig = form.signature ?? ''
  if (sig.length > MAX.signatureChars) {
    return { canSave: false, message: 'Image de signature trop volumineuse (max. ~400 Ko).' }
  }
  return { canSave: true, message: null }
}

/** Nettoie le formulaire avant envoi API (chiffres SIRET/SIREN, longueurs, URLs). */
export function buildSanitizedProfilePayload(
  form: UpdateOrganizationProfile,
  _profile?: OrganizationProfile | null,
): UpdateOrganizationProfile {
  const payload: UpdateOrganizationProfile = {}

  const set = (key: keyof UpdateOrganizationProfile, value: string | null) => {
    ;(payload as Record<string, unknown>)[key] = value
  }

  set('name', trim(form.name, MAX.name))
  set('legalName', trim(form.legalName, MAX.legalName))
  set('legalForm', trim(form.legalForm, 80))
  set('apeCode', trim(form.apeCode, 10))
  set('apeLabel', trim(form.apeLabel, 200))

  const siret = digitsOnly(form.siret ?? '')
  const siren = digitsOnly(form.siren ?? '')
  set('siret', siret ? (isValidSiret(siret) ? siret : null) : null)
  set('siren', siren ? (isValidSiren(siren) ? siren : null) : null)

  set('vatNumber', trim(form.vatNumber, MAX.vatNumber))
  set('rcs', trim(form.rcs, MAX.rcs))
  set('rcsCity', trim(form.rcsCity, MAX.city))

  set('address', trim(form.address, MAX.address))
  set('address2', trim(form.address2, MAX.address))
  set('city', trim(form.city, MAX.city))
  set('zipCode', trim(form.zipCode, MAX.zipCode))
  set('country', trim(form.country, 8) ?? 'FR')
  set('countryCode', trim(form.countryCode, 8) ?? 'FR')

  const email = trim(form.email, MAX.email)
  set('email', email ? email.toLowerCase() : null)
  set('phone', trim(form.phone, MAX.phone))
  set('website', normalizeUrl(form.website))

  set('privacyPolicyUrl', normalizeUrl(form.privacyPolicyUrl))
  const dpo = trim(form.dataControllerEmail, MAX.email)
  set('dataControllerEmail', dpo ? dpo.toLowerCase() : null)

  const numOrNull = (v: unknown): number | null => {
    if (v == null || v === '') return null
    const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'))
    return Number.isFinite(n) ? n : null
  }

  ;(payload as Record<string, unknown>).cfePropertyValue = numOrNull(form.cfePropertyValue)
  ;(payload as Record<string, unknown>).cfeCommunalRate = numOrNull(form.cfeCommunalRate)
  const activity = trim(form.cfeActivity, 20)
  set('cfeActivity', activity && ['SERVICE', 'COMMERCE', 'INDUSTRIE', 'ARTISANAT'].includes(activity) ? activity : 'SERVICE')
  ;(payload as Record<string, unknown>).isPmeEligible = form.isPmeEligible !== false
  ;(payload as Record<string, unknown>).capitalHeldByIndividuals = numOrNull(form.capitalHeldByIndividuals) ?? 100

  const sig = form.signature ?? ''
  if (sig.startsWith('data:image') && sig.length <= MAX.signatureChars) {
    set('signature', sig)
  } else if (sig && !sig.startsWith('data:')) {
    set('signature', trim(sig, 120))
  } else if (!sig) {
    set('signature', null)
  }

  return payload
}

export function formsEqual(a: UpdateOrganizationProfile, b: UpdateOrganizationProfile): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}
