/** Chiffres uniquement pour validation. */
export function phoneDigitsOnly(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '')
}

/** Normalise la saisie (conserve un + en tête si présent). */
export function parsePhoneInput(value: string): string {
  const trimmed = value.trim()
  const hasPlus = trimmed.startsWith('+')
  const digits = phoneDigitsOnly(trimmed).slice(0, 15)
  if (!digits) return hasPlus ? '+' : ''
  return hasPlus ? `+${digits}` : digits
}

/** Affichage lisible (FR 0X XX XX XX XX ou +33 X XX XX XX XX). */
export function formatPhoneDisplay(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  const hasPlus = trimmed.startsWith('+')
  let digits = phoneDigitsOnly(trimmed)

  if (hasPlus) {
    if (digits.startsWith('33')) {
      const national = digits.slice(2)
      if (national.length === 0) return '+33'
      const grouped = groupPairs(national)
      return `+33 ${grouped}`.trim()
    }
    return `+${groupPairs(digits)}`
  }

  if (digits.startsWith('33') && digits.length > 10) {
    digits = `0${digits.slice(2)}`
  }
  if (digits.startsWith('0')) {
    return groupPairs(digits.slice(0, 10))
  }
  return groupPairs(digits.slice(0, 15))
}

function groupPairs(digits: string): string {
  if (!digits) return ''
  const parts: string[] = []
  let i = 0
  if (digits.length >= 2 && digits.startsWith('0')) {
    parts.push(digits.slice(0, 2))
    i = 2
  } else if (digits.length >= 1) {
    parts.push(digits.slice(0, 1))
    i = 1
  }
  while (i < digits.length) {
    parts.push(digits.slice(i, i + 2))
    i += 2
  }
  return parts.join(' ')
}

export type PhoneValidationState = 'idle' | 'incomplete' | 'invalid' | 'valid'

export function getPhoneValidation(phone: string | null | undefined): {
  state: PhoneValidationState
  message: string
} {
  const raw = (phone ?? '').trim()
  if (!raw) {
    return { state: 'idle', message: 'Optionnel — ex. 06 12 34 56 78 ou +33 6 12 34 56 78' }
  }
  const digits = phoneDigitsOnly(raw)
  if (digits.length < 10) {
    return { state: 'incomplete', message: `${digits.length} / 10 chiffres minimum` }
  }
  if (digits.length > 15) {
    return { state: 'invalid', message: 'Numéro trop long' }
  }
  if (raw.startsWith('+') && !digits.startsWith('33') && digits.length < 11) {
    return { state: 'incomplete', message: 'Numéro international incomplet' }
  }
  if (!raw.startsWith('+') && digits.startsWith('0') && digits.length !== 10) {
    return { state: 'incomplete', message: 'Format national : 10 chiffres (0X XX XX XX XX)' }
  }
  if (digits.startsWith('33') && digits.length !== 11) {
    return { state: 'incomplete', message: 'Format +33 : 11 chiffres après indicatif' }
  }
  return { state: 'valid', message: 'Numéro valide' }
}

export function isPhoneValid(phone: string | null | undefined): boolean {
  const s = getPhoneValidation(phone).state
  return s === 'idle' || s === 'valid'
}
