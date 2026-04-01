// src/lib/whatsapp.ts
// Lógica pura de armado de mensaje y URL de WhatsApp.
// Sin React, sin side effects, sin acoplamiento al modelo de Supabase.

import { cleanDigits, isValidPhone } from '@/lib/phone'

export type ResourceType = 'propiedad' | 'proyecto' | 'presupuesto'

export type ShareMessageInput = {
  type:            ResourceType
  resourceTitle:   string
  resourceUrl:     string
  resourceContext: string   // ej: "Venta · Departamento · USD 85.000"
  contactName:     string | null
  brandName:       string | null
}

/**
 * Arma el mensaje preformateado para compartir por WhatsApp.
 * El type está presente como discriminante para extensión futura —
 * hoy todos los recursos usan el mismo template base.
 */
export function buildShareMessage(input: ShareMessageInput): string {
  const { resourceTitle, resourceUrl, resourceContext, contactName, brandName } = input

  const greeting = contactName ? `Hola ${contactName}` : 'Hola'

  const lines: string[] = [
    `${greeting}, te comparto esto que puede interesarte:`,
    '',
    `*${resourceTitle}*`,
    resourceContext,
    '',
    resourceUrl,
  ]

  if (brandName) {
    lines.push('', `📩 ${brandName}`)
  }

  return lines.join('\n')
}

/**
 * Valida que el teléfono sea utilizable para WhatsApp.
 * Asume Paraguay (PY) como país por defecto, acorde al contexto del CRM.
 * Devuelve false si está vacío o no pasa la validación de libphonenumber-js.
 */
export function isPhoneUsable(phone: string): boolean {
  if (!cleanDigits(phone)) return false
  return isValidPhone(phone, 'PY')
}

/**
 * Construye la URL wa.me a partir de un teléfono en cualquier formato.
 *
 * Normalización del número paraguayo:
 * - Si después de limpiar ya empieza con 595 → lo usa tal cual.
 * - Si no → antepone 595.
 * - Devuelve null si el número está vacío o no es válido según isPhoneUsable().
 */
export function buildShareUrl(phone: string, message: string): string | null {
  if (!isPhoneUsable(phone)) return null

  const digits     = cleanDigits(phone)
  const normalized = digits.startsWith('595') ? digits : `595${digits}`
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
}
