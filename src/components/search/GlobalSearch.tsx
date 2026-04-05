// src/components/search/GlobalSearch.tsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router'
import { Search, X, Users, ClipboardList, MapPin, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Result =
  | { kind: 'client';   id: string; label: string; sub: string }
  | { kind: 'task';     id: string; label: string; sub: string; clientId?: string }
  | { kind: 'property'; id: string; label: string; sub: string }

const KIND_META = {
  client:   { icon: Users,         color: 'text-blue-500',   bg: 'bg-blue-50',   label: 'Cliente'    },
  task:     { icon: ClipboardList, color: 'text-amber-500',  bg: 'bg-amber-50',  label: 'Tarea'      },
  property: { icon: MapPin,        color: 'text-emerald-500',bg: 'bg-emerald-50',label: 'Propiedad'  },
}

async function search(q: string): Promise<Result[]> {
  const term = `%${q}%`
  const [clients, tasks, properties] = await Promise.all([
    supabase.from('clients').select('id, full_name, phone, fuente, tipo')
      .or(`full_name.ilike.${term},phone.ilike.${term}`)
      .limit(5),
    supabase.from('tasks').select('id, title, due_date, lead_id')
      .ilike('title', term)
      .limit(5),
    supabase.from('properties').select('id, titulo, direccion, ciudad')
      .or(`titulo.ilike.${term},direccion.ilike.${term}`)
      .limit(5),
  ])

  const results: Result[] = []

  ;(clients.data as any)?.forEach((c: any) => results.push({
    kind: 'client',
    id: c.id,
    label: c.full_name,
    sub: [c.tipo, c.phone, c.fuente].filter(Boolean).join(' · '),
  }))

  ;(tasks.data as any)?.forEach((t: any) => results.push({
    kind: 'task',
    id: t.id,
    label: t.title,
    sub: t.due_date,
    clientId: t.lead_id ?? undefined,
  }))

  ;(properties.data as any)?.forEach((p: any) => results.push({
    kind: 'property',
    id: p.id,
    label: p.titulo ?? 'Sin título',
    sub: [p.ciudad, p.direccion].filter(Boolean).join(' · '),
  }))

  return results
}

export function GlobalSearch() {
  const [open,    setOpen]    = useState(false)
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  // Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
    else { setQuery(''); setResults([]) }
  }, [open])

  // Debounce
  useEffect(() => {
    if (!query.trim() || query.length < 2) { setResults([]); return }
    const t = setTimeout(async () => {
      setLoading(true)
      try { setResults(await search(query)) }
      finally { setLoading(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  const go = useCallback((r: Result) => {
    setOpen(false)
    if (r.kind === 'client')   navigate(`/clientes/${r.id}`)
    if (r.kind === 'task')     navigate(r.clientId ? `/clientes/${r.clientId}` : '/tareas')
    if (r.kind === 'property') navigate(`/propiedades/${r.id}`)
  }, [navigate])

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-sidebar-accent/50 hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors text-sm"
      >
        <Search className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="flex-1 text-left">Buscar...</span>
        <kbd className="hidden md:inline text-[10px] bg-sidebar-accent px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
      </button>

      {/* Modal */}
      {open && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-start justify-center md:pt-16 md:px-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />

          {/* Panel */}
          <div className="relative w-full md:max-w-lg bg-white rounded-b-2xl md:rounded-2xl shadow-2xl overflow-hidden">

            {/* Input */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <Search className="w-5 h-5 flex-shrink-0" style={{ color: '#14223A' }} strokeWidth={2.5} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar clientes, tareas, propiedades..."
                className="flex-1 text-base outline-none text-gray-900 placeholder:text-gray-400 bg-transparent"
              />
              {loading
                ? <Loader2 className="w-4 h-4 text-gray-400 animate-spin flex-shrink-0" />
                : query
                  ? (
                    <button
                      onClick={() => setQuery('')}
                      className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"
                    >
                      <X className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                  ) : (
                    <kbd className="hidden md:inline text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded font-mono flex-shrink-0">⌘K</kbd>
                  )
              }
            </div>

            {/* Results */}
            {results.length > 0 && (
              <ul className="py-2 max-h-80 overflow-y-auto">
                {results.map((r, i) => {
                  const meta = KIND_META[r.kind]
                  const Icon = meta.icon
                  return (
                    <li key={i}>
                      <button
                        onClick={() => go(r)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className={`w-8 h-8 rounded-full ${meta.bg} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{r.label}</p>
                          <p className="text-xs text-gray-400 truncate">{meta.label}{r.sub ? ` · ${r.sub}` : ''}</p>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}

            {query.length >= 2 && !loading && results.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                Sin resultados para "{query}"
              </div>
            )}

            {!query && (
              <div className="px-5 py-5 text-sm text-gray-400">
                Clientes · Tareas · Propiedades
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
