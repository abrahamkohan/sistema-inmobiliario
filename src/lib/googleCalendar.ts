// src/lib/googleCalendar.ts
// Lógica pura de construcción de URL para "Agregar a Google Calendar".
// Sin React, sin side effects. Fácil de ajustar si hay diferencias de timezone.

import type { Database } from '@/types/database'

type TaskRow = Database['public']['Tables']['tasks']['Row']

// ── Tipos soportados ──────────────────────────────────────────────────────────

export const GCAL_SUPPORTED_TYPES: ReadonlyArray<TaskRow['type']> = ['call', 'meeting', 'visit']

// ── Duraciones por tipo (minutos) ─────────────────────────────────────────────

const DURATION_MIN: Partial<Record<TaskRow['type'], number>> = {
  call:    30,
  meeting: 60,
  visit:   60,
}

// ── Formateo de fecha ─────────────────────────────────────────────────────────

/**
 * Convierte un Date a formato YYYYMMDDTHHMMSS (tiempo local, sin sufijo Z).
 * Google Calendar interpreta esta cadena en el timezone del navegador del usuario,
 * que es coherente con cómo TaskItem muestra la hora.
 *
 * NOTA DE TIMEZONE: si due_date se persiste en UTC en Supabase y el usuario opera
 * desde un timezone con offset, el evento puede aparecer desplazado respecto a
 * lo que muestra el CRM. En ese caso, cambiar a toGCalDateUTC() que agrega 'Z'.
 * Dejar esta decisión para validación en la prueba real.
 */
function toGCalDateLocal(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return (
    `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}` +
    `T${p(date.getHours())}${p(date.getMinutes())}${p(date.getSeconds())}`
  )
}

// Alternativa UTC — descomentar y usar en buildGoogleCalendarUrl si se detecta
// desplazamiento de timezone en la prueba real.
// function toGCalDateUTC(date: Date): string {
//   const p = (n: number) => String(n).padStart(2, '0')
//   return (
//     `${date.getUTCFullYear()}${p(date.getUTCMonth() + 1)}${p(date.getUTCDate())}` +
//     `T${p(date.getUTCHours())}${p(date.getUTCMinutes())}${p(date.getUTCSeconds())}Z`
//   )
// }

// ── Builder principal ─────────────────────────────────────────────────────────

export type GCalInput = {
  task:      TaskRow
  leadName?: string | null
}

/**
 * Construye la URL de Google Calendar para pre-cargar un evento desde una tarea.
 * Devuelve null si:
 *   - el tipo no es call / meeting / visit
 *   - due_date está ausente o no es parseable
 */
export function buildGoogleCalendarUrl({ task, leadName }: GCalInput): string | null {
  if (!GCAL_SUPPORTED_TYPES.includes(task.type)) return null
  if (!task.due_date) return null

  const start = new Date(task.due_date)
  if (isNaN(start.getTime())) return null

  const end = new Date(start.getTime() + (DURATION_MIN[task.type] ?? 60) * 60 * 1000)

  // ── Título ──
  const title = leadName ? `${task.title} — ${leadName}` : task.title

  // ── Details ──
  const parts: string[] = []
  if (leadName)       parts.push(`Contacto: ${leadName}`)
  if (task.notes)     parts.push(task.notes)
  if (task.meet_link) parts.push(`Link de reunión: ${task.meet_link}`)
  const details = parts.join('\n\n')

  // ── URL ──
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text:   title,
    dates:  `${toGCalDateLocal(start)}/${toGCalDateLocal(end)}`,
    sf:     'true',
  })
  if (details) params.set('details', details)

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
