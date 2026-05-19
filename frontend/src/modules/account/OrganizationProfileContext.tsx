import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  organizationService,
  type OrganizationProfile,
  type UpdateOrganizationProfile,
} from '../../services/organizationService'
import { unwrapApiPayload } from '../../services/clients'

type OrganizationProfileContextValue = {
  profile: OrganizationProfile | null
  setProfile: React.Dispatch<React.SetStateAction<OrganizationProfile | null>>
  form: UpdateOrganizationProfile
  loading: boolean
  loaded: boolean
  saving: boolean
  error: string | null
  setError: (e: string | null) => void
  success: boolean
  setSuccess: (v: boolean) => void
  handleChange: (field: keyof UpdateOrganizationProfile) => (e: React.ChangeEvent<HTMLInputElement>) => void
  setField: (field: keyof UpdateOrganizationProfile, value: string) => void
  save: () => Promise<void>
  refresh: () => Promise<void>
}

const OrganizationProfileContext = createContext<OrganizationProfileContextValue | null>(null)

function profileToForm(data: OrganizationProfile): UpdateOrganizationProfile {
  return {
    name: data.name ?? '',
    legalName: data.legalName ?? '',
    siret: data.siret ?? '',
    siren: data.siren ?? '',
    rcs: data.rcs ?? '',
    rcsCity: data.rcsCity ?? '',
    vatNumber: data.vatNumber ?? '',
    address: data.address ?? '',
    address2: data.address2 ?? '',
    city: data.city ?? '',
    zipCode: data.zipCode ?? '',
    country: data.country ?? 'FR',
    countryCode: data.countryCode ?? 'FR',
    email: data.email ?? '',
    phone: data.phone ?? '',
    website: data.website ?? '',
    capital: data.capital ?? '',
    legalForm: data.legalForm ?? '',
    apeCode: data.apeCode ?? '',
    apeLabel: data.apeLabel ?? '',
    legalRepresentative: data.legalRepresentative ?? '',
    legalRepresentativeRole: data.legalRepresentativeRole ?? '',
    privacyPolicyUrl: data.privacyPolicyUrl ?? '',
    dataControllerEmail: data.dataControllerEmail ?? '',
  }
}

export function OrganizationProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<OrganizationProfile | null>(null)
  const [form, setForm] = useState<UpdateOrganizationProfile>({})
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await organizationService.getProfile()
      const data = unwrapApiPayload<OrganizationProfile>(res)
      if (data) {
        setProfile(data)
        setForm(profileToForm(data))
        setLoaded(true)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Impossible de charger le profil')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleChange = useCallback((field: keyof UpdateOrganizationProfile) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
      setError(null)
      setSuccess(false)
    }
  }, [])

  const setField = useCallback((field: keyof UpdateOrganizationProfile, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError(null)
    setSuccess(false)
  }, [])

  const save = useCallback(async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const payload: UpdateOrganizationProfile = {}
      Object.keys(form).forEach((k) => {
        const key = k as keyof UpdateOrganizationProfile
        const v = form[key]
        if (v !== undefined && v !== '') (payload as Record<string, unknown>)[key] = v
        else if (v === '') (payload as Record<string, unknown>)[key] = null
      })
      await organizationService.updateProfile(payload)
      setSuccess(true)
      setProfile((prev) => (prev ? { ...prev, ...payload } : null))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }, [form])

  const value = useMemo(
    () => ({
      profile,
      setProfile,
      form,
      loading: loading && !loaded,
      loaded,
      saving,
      error,
      setError,
      success,
      setSuccess,
      handleChange,
      setField,
      save,
      refresh: load,
    }),
    [
      profile,
      form,
      loading,
      loaded,
      saving,
      error,
      success,
      handleChange,
      setField,
      save,
      load,
    ],
  )

  return (
    <OrganizationProfileContext.Provider value={value}>{children}</OrganizationProfileContext.Provider>
  )
}

export function useOrganizationProfile() {
  const ctx = useContext(OrganizationProfileContext)
  if (!ctx) {
    throw new Error('useOrganizationProfile doit être utilisé dans OrganizationProfileProvider')
  }
  return ctx
}
