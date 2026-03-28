// src/styles/design-system.ts
// Sistema de diseño unificado para el CRM Kohan & Campos
// Usar estos tokens para mantener consistencia entre módulos.
//
// Estándar actual del proyecto (NO cambiar sin migrar todos los componentes):
// - Inputs: h-12, text-base, rounded-xl, border-gray-200, bg-gray-50
// - Labels: text-xs font-medium text-gray-500
// - Botones primarios: bg-gray-900 text-white
// - Chips: flex-wrap gap-2 rounded-full border
// - Modales: Modal (sm/md/lg) + MobileFormScreen para mobile

// ─── INPUTS ───────────────────────────────────────────────────────────────────

export const INPUT_CLS =
  'w-full h-12 px-3 border border-gray-200 bg-gray-50 rounded-xl text-base placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-gray-900 transition-colors'

export const LABEL_CLS =
  'text-xs font-medium text-gray-500 mb-1.5 block'

export const TEXTAREA_CLS =
  'w-full px-3 py-2.5 border border-gray-200 bg-gray-50 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-gray-900 transition-colors resize-none'

// ─── BOTONES ──────────────────────────────────────────────────────────────────

export const BTN = {
  primary:   'h-12 px-5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-40',
  secondary: 'h-12 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors',
  ghost:     'px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors',
  danger:    'h-12 px-5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-40',
  icon:      'w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors',
  iconDanger:'w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors',
}

// ─── CHIPS / BADGES ───────────────────────────────────────────────────────────

export const BADGE = {
  base:    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold',
  blue:    'bg-blue-50 text-blue-600',
  emerald: 'bg-emerald-50 text-emerald-700',
  amber:   'bg-amber-50 text-amber-700',
  red:     'bg-red-50 text-red-600',
  gray:    'bg-gray-100 text-gray-500',
}

// ─── CHIPS SELECCIONABLES (tipo/estado) ───────────────────────────────────────

export const CHIP = {
  active:   'flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-900 bg-gray-900 text-white text-[13px] font-medium',
  inactive: 'flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-gray-400 hover:bg-gray-50 text-[13px] font-medium transition-all',
}

// ─── LAYOUT ───────────────────────────────────────────────────────────────────

export const GRID = {
  cols2: 'grid grid-cols-1 md:grid-cols-2 gap-4',
  cols3: 'grid grid-cols-1 md:grid-cols-3 gap-4',
}

export const CARD = {
  base:    'bg-white rounded-2xl border border-gray-100 shadow-sm p-4',
  hover:   'bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer active:scale-[0.99] transition-transform',
  section: 'bg-gray-50 rounded-2xl p-4',
}

// ─── SECCIONES COLAPSABLES ────────────────────────────────────────────────────

export const SECTION_DIVIDER = 'flex items-center gap-3 my-1'
export const SECTION_LINE    = 'flex-1 h-px bg-gray-100'
export const SECTION_LABEL   = 'text-[10px] font-semibold text-gray-400 uppercase tracking-wider'

// ─── NOTAS / ALERTAS ─────────────────────────────────────────────────────────

export const ALERT = {
  amber: 'px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800',
  blue:  'px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800',
  green: 'px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800',
}
