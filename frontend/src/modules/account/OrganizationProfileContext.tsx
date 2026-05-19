import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  organizationService,
  type OrganizationProfile,
  type UpdateOrganizationProfile,
} from '../../services/organizationService'
import { unwrapApiPayload } from '../../services/clients'
import { digitsOnly } from '../../utils/french-siret'
import {
  buildSanitizedProfilePayload,
  formsEqual,
  validateOrganizationForm,
} from '../../utils/organization-profile-sanitize'
import { useDebouncedEffect } from '../../hooks/useDebouncedEffect'
import {
  lookupOrganizationFromSiret,
  type SireneLookupResult,
} from '../../services/organizationSireneLookup'
import { isValidSiret } from '../../utils/french-siret'

export type AutoSaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

type OrganizationProfileContextValue = {
  profile: OrganizationProfile | null
  setProfile: React.Dispatch<React.SetStateAction<OrganizationProfile | null>>
  form: UpdateOrganizationProfile
  loading: boolean
  loaded: boolean
  saving: boolean
  autoSaveStatus: AutoSaveStatus
  validationMessage: string | null
  error: string | null
  setError: (e: string | null) => void
  success: boolean
  setSuccess: (v: boolean) => void
  handleChange: (field: keyof UpdateOrganizationProfile) => (e: React.ChangeEvent<HTMLInputElement>) => void
  setField: (field: keyof UpdateOrganizationProfile, value: string) => void
  applyRegistryLookup: (data: SireneLookupResult, options?: { onlyEmpty?: boolean }) => void
  lookupFromRegistry: (siretOrSiren: string, options?: { onlyEmpty?: boolean }) => Promise<void>
  registryLookupMessage: string | null
  registryLookupLoading: boolean
  save: () => Promise<boolean>
  refresh: () => Promise<void>
}

const OrganizationProfileContext = createContext<OrganizationProfileContextValue | null>(null)

const AUTO_SAVE_DELAY_MS = 900

function profileToForm(data: OrganizationProfile): UpdateOrganizationProfile {
  return {
    name: data.name ?? '',
    legalName: data.legalName ?? '',
    siret: digitsOnly(data.siret ?? ''),
    siren: digitsOnly(data.siren ?? ''),
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
    signature: data.signature ?? '',
  }
}

export function OrganizationProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<OrganizationProfile | null>(null)
  const [form, setForm] = useState<UpdateOrganizationProfile>({})
  const [savedForm, setSavedForm] = useState<UpdateOrganizationProfile>({})
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const skipAutoSaveRef = useRef(true)
  const lastRegistryLookupRef = useRef('')
  const [registryLookupLoading, setRegistryLookupLoading] = useState(false)
  const [registryLookupMessage, setRegistryLookupMessage] = useState<string | null>(null)

  const validation = useMemo(() => validateOrganizationForm(form), [form])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await organizationService.getProfile()
      const data = unwrapApiPayload<OrganizationProfile>(res)
      if (data) {
        const next = profileToForm(data)
        skipAutoSaveRef.current = true
        setProfile(data)
        setForm(next)
        setSavedForm(next)
        setLoaded(true)
        setAutoSaveStatus('idle')
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

  useEffect(() => {
    if (loaded) {
      const t = window.setTimeout(() => {
        skipAutoSaveRef.current = false
      }, 100)
      return () => window.clearTimeout(t)
    }
  }, [loaded])

  const handleChange = useCallback((field: keyof UpdateOrganizationProfile) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
      setError(null)
      setSuccess(false)
      setAutoSaveStatus('pending')
    }
  }, [])

  const setField = useCallback((field: keyof UpdateOrganizationProfile, value: string) => {
    if (field === 'siret' || field === 'siren') {
      lastRegistryLookupRef.current = ''
    }
    setForm((prev) => ({ ...prev, [field]: value }))
    setError(null)
    setSuccess(false)
    setAutoSaveStatus('pending')
  }, [])

  const applyRegistryLookup = useCallback((data: SireneLookupResult, options?: { onlyEmpty?: boolean }) => {
    const onlyEmpty = options?.onlyEmpty ?? false
    const pick = (next: string | null | undefined, prev: string | null | undefined) => {
      if (!next) return prev ?? ''
      if (onlyEmpty && (prev ?? '').trim()) return prev ?? ''
      return next
    }

    skipAutoSaveRef.current = true
    setForm((prev) => ({
      ...prev,
      siren: pick(data.siren, prev.siren) || data.siren,
      siret: pick(data.siret ?? null, prev.siret) || prev.siret || data.siret || '',
      legalName: pick(data.legalName, prev.legalName),
      name: pick(data.name ?? data.legalName, prev.name) || pick(data.legalName, prev.name),
      legalForm: pick(data.legalForm, prev.legalForm),
      apeCode: pick(data.apeCode, prev.apeCode),
      address: pick(data.address, prev.address),
      zipCode: pick(data.zipCode, prev.zipCode),
      city: pick(data.city, prev.city),
      country: pick(data.country, prev.country) || 'FR',
      countryCode: 'FR',
      rcsCity: pick(data.rcsCity, prev.rcsCity),
    }))
    setAutoSaveStatus('pending')
    window.setTimeout(() => {
      skipAutoSaveRef.current = false
    }, 80)
  }, [])

  const lookupFromRegistry = useCallback(
    async (siretOrSiren: string, options?: { onlyEmpty?: boolean }) => {
      const digits = digitsOnly(siretOrSiren)
      if (digits.length !== 9 && digits.length !== 14) return
      if (!options?.onlyEmpty && lastRegistryLookupRef.current === digits) return
      if (!options?.onlyEmpty) lastRegistryLookupRef.current = digits

      setRegistryLookupLoading(true)
      setRegistryLookupMessage(null)
      try {
        const data = await lookupOrganizationFromSiret(digits)
        applyRegistryLookup(data, options)
        if (options?.onlyEmpty) {
          if (data.partial) {
            setRegistryLookupMessage(
              'Certaines données sont masquées au registre public (diffusion restreinte). Complétez dénomination et adresse depuis l’INPI si besoin.',
            )
          }
        } else if (data.partial) {
          setRegistryLookupMessage(
            'Données partielles (diffusion restreinte au RNE) : complétez dénomination et adresse depuis votre espace INPI.',
          )
        } else {
          setRegistryLookupMessage('Informations importées depuis le registre des entreprises.')
        }
      } catch (err: unknown) {
        setRegistryLookupMessage(
          err instanceof Error ? err.message : 'Recherche impossible',
        )
      } finally {
        setRegistryLookupLoading(false)
      }
    },
    [applyRegistryLookup],
  )

  const save = useCallback(async (): Promise<boolean> => {
    if (!validation.canSave) {
      setError(validation.message)
      return false
    }
    if (formsEqual(form, savedForm)) {
      setAutoSaveStatus('saved')
      return true
    }

    setSaving(true)
    setAutoSaveStatus('saving')
    setError(null)
    setSuccess(false)
    try {
      const payload = buildSanitizedProfilePayload(form, profile)
      const res = await organizationService.updateProfile(payload)
      const updated = unwrapApiPayload<OrganizationProfile>(res)
      const nextForm = profileToForm(updated ?? { ...profile!, ...payload })
      skipAutoSaveRef.current = true
      setProfile((prev) => updated ?? (prev ? { ...prev, ...payload } : null))
      setForm(nextForm)
      setSavedForm(nextForm)
      setSuccess(true)
      setAutoSaveStatus('saved')
      window.setTimeout(() => skipAutoSaveRef.current = false, 50)
      return true
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement'
      setError(msg)
      setAutoSaveStatus('error')
      return false
    } finally {
      setSaving(false)
    }
  }, [form, savedForm, profile, validation])

  useDebouncedEffect(
    () => {
      if (skipAutoSaveRef.current || !loaded) return
      if (formsEqual(form, savedForm)) {
        setAutoSaveStatus('idle')
        return
      }
      if (!validation.canSave) {
        setAutoSaveStatus('idle')
        return
      }
      void save()
    },
    [form, savedForm, loaded, validation.canSave, save],
    AUTO_SAVE_DELAY_MS,
  )

  const value = useMemo(
    () => ({
      profile,
      setProfile,
      form,
      loading: loading && !loaded,
      loaded,
      saving,
      autoSaveStatus,
      validationMessage: validation.canSave ? null : validation.message,
      error,
      setError,
      success,
      setSuccess,
      handleChange,
      setField,
      applyRegistryLookup,
      lookupFromRegistry,
      registryLookupMessage,
      registryLookupLoading,
      save,
      refresh: load,
    }),
    [
      profile,
      form,
      loading,
      loaded,
      saving,
      autoSaveStatus,
      validation,
      error,
      success,
      handleChange,
      setField,
      applyRegistryLookup,
      lookupFromRegistry,
      registryLookupMessage,
      registryLookupLoading,
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
