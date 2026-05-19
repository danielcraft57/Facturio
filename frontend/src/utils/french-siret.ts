/** Chiffres uniquement (stockage / API). */
export function digitsOnly(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '')
}

/** SIREN affiché : 123 456 789 */
export function formatSiren(digits: string): string {
  const d = digitsOnly(digits).slice(0, 9)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`
}

/** SIRET affiché : 123 456 789 00012 */
export function formatSiret(digits: string): string {
  const d = digitsOnly(digits).slice(0, 14)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 9)} ${d.slice(9)}`
}

export function parseSirenInput(value: string): string {
  return digitsOnly(value).slice(0, 9)
}

export function parseSiretInput(value: string): string {
  return digitsOnly(value).slice(0, 14)
}

export function sirenFromSiret(siret: string): string {
  const d = digitsOnly(siret)
  return d.length >= 9 ? d.slice(0, 9) : ''
}

/** Clé de contrôle Luhn (SIREN / SIRET français). */
export function passesLuhnCheck(digits: string): boolean {
  if (!/^\d+$/.test(digits) || digits.length === 0) return false
  let sum = 0
  let alt = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i])
    if (alt) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
    alt = !alt
  }
  return sum % 10 === 0
}

export function isValidSiren(digits: string | null | undefined): boolean {
  const d = digitsOnly(digits)
  return d.length === 9 && passesLuhnCheck(d)
}

export function isValidSiret(digits: string | null | undefined): boolean {
  const d = digitsOnly(digits)
  return d.length === 14 && passesLuhnCheck(d)
}

export type SiretValidationState = 'idle' | 'incomplete' | 'invalid' | 'valid'

export function getSirenValidation(digits: string | null | undefined): {
  state: SiretValidationState
  message: string
} {
  const d = digitsOnly(digits)
  if (!d.length) {
    return { state: 'idle', message: '9 chiffres — ex. 443 061 841' }
  }
  if (d.length < 9) {
    return { state: 'incomplete', message: `${d.length} / 9 chiffres` }
  }
  if (!passesLuhnCheck(d)) {
    return { state: 'invalid', message: 'SIREN invalide (vérifiez la clé de contrôle)' }
  }
  return { state: 'valid', message: 'SIREN valide' }
}

export function getSiretValidation(
  siretDigits: string | null | undefined,
  sirenDigits?: string | null,
): { state: SiretValidationState; message: string } {
  const d = digitsOnly(siretDigits)
  if (!d.length) {
    return { state: 'idle', message: '14 chiffres — SIREN (9) + NIC établissement (5)' }
  }
  if (d.length < 14) {
    return { state: 'incomplete', message: `${d.length} / 14 chiffres` }
  }
  if (!passesLuhnCheck(d)) {
    return { state: 'invalid', message: 'SIRET invalide (vérifiez la clé de contrôle)' }
  }
  const siren = digitsOnly(sirenDigits)
  if (siren.length === 9 && d.slice(0, 9) !== siren) {
    return {
      state: 'invalid',
      message: 'Le SIRET ne correspond pas au SIREN saisi',
    }
  }
  return { state: 'valid', message: 'SIRET valide' }
}

export function hasBlockingSirenError(digits: string | null | undefined): boolean {
  const d = digitsOnly(digits)
  if (!d.length) return false
  return !isValidSiren(d)
}

export function hasBlockingSiretError(
  siret: string | null | undefined,
  siren?: string | null,
): boolean {
  const d = digitsOnly(siret)
  if (!d.length) return false
  return getSiretValidation(d, siren).state === 'invalid'
}
