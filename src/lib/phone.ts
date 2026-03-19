// src/lib/phone.ts
import { parsePhoneNumberFromString, AsYouType } from 'libphonenumber-js'

// Max digits by country (without dial code)
const MAX_DIGITS: Record<string, number> = {
  PY: 9, AR: 10, BR: 11, UY: 8, ES: 9, DE: 11, US: 10,
}

export function getMaxDigits(countryCode: string): number {
  return MAX_DIGITS[countryCode] ?? 12
}

/** Strip non-digit characters */
export function cleanDigits(value: string): string {
  return value.replace(/\D/g, '')
}

/** Format as-you-type using country code */
export function formatPhone(raw: string, countryCode: string): string {
  return new AsYouType(countryCode as never).input(raw)
}

/** Returns true if the phone number is valid for the given country */
export function isValidPhone(raw: string, countryCode: string): boolean {
  try {
    const parsed = parsePhoneNumberFromString(raw, countryCode as never)
    return parsed ? parsed.isValid() : false
  } catch {
    return false
  }
}

/** Build wa.me URL from dial code + raw digits + name */
export function buildWhatsAppUrl(dial: string, rawDigits: string, name: string): string | null {
  if (!rawDigits) return null
  const full = dial.replace('+', '') + rawDigits
  const msg  = encodeURIComponent(`Hola ${name}, te contacto en relación a tu consulta en Kohan & Campos.`)
  return `https://wa.me/${full}?text=${msg}`
}
