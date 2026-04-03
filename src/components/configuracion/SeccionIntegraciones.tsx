// src/components/configuracion/SeccionIntegraciones.tsx
import { useState, useEffect } from 'react'
import { Calendar, Loader2, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface Props {
  simulador_publico: boolean
  onSimuladorChange: (v: boolean) => void
}

export function SeccionIntegraciones({ simulador_publico, onSimuladorChange }: Props) {
  const [gcalConnected,    setGcalConnected]    = useState<boolean | null>(null)
  const [gcalLoading,      setGcalLoading]      = useState(false)
  const [gcalDisconnecting, setGcalDisconnecting] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setGcalConnected(false); return }
      const { data } = await supabase.functions.invoke('google-oauth', {
        body: { action: 'status' },
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      setGcalConnected(data?.connected ?? false)
    }).catch(() => setGcalConnected(false))
  }, [])

  async function handleConnectGoogle() {
    setGcalLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { toast.error('No hay sesión activa. Volvé a iniciar sesión.'); return }

      const stateBytes = new Uint8Array(16)
      crypto.getRandomValues(stateBytes)
      const state = Array.from(stateBytes).map(b => b.toString(16).padStart(2, '0')).join('')

      const { data, error } = await supabase.functions.invoke('google-oauth', {
        body: { action: 'authorize', state },
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (error || !data?.url) { toast.error('No se pudo obtener la URL de autorización'); return }

      sessionStorage.setItem('gcal_oauth_state', state)
      window.location.href = data.url
    } finally {
      setGcalLoading(false)
    }
  }

  async function handleDisconnectGoogle() {
    setGcalDisconnecting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      await supabase.functions.invoke('google-oauth', {
        body: { action: 'disconnect' },
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      setGcalConnected(false)
      toast.success('Google Calendar desconectado')
    } catch {
      toast.error('No se pudo desconectar')
    } finally {
      setGcalDisconnecting(false)
    }
  }

  return (
    <div className="rounded-lg border bg-card p-5 flex flex-col gap-5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">🔗 Integraciones</p>

      {/* Google Calendar */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium text-gray-800">Google Calendar</p>
        </div>

        {gcalConnected === null ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Verificando conexión...
          </div>
        ) : gcalConnected ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100">
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">Conectado</span>
              </div>
              <button
                onClick={handleDisconnectGoogle}
                disabled={gcalDisconnecting}
                className="flex items-center gap-1 px-3 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {gcalDisconnecting && <Loader2 className="w-3 h-3 animate-spin" />}
                Desconectar
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Las tareas de tipo llamada, visita y reunión se sincronizan automáticamente al crearse.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Conectá la cuenta Google para que las tareas de tipo llamada, visita y reunión se agreguen automáticamente al calendario.
            </p>
            <button
              onClick={handleConnectGoogle}
              disabled={gcalLoading}
              className="self-start flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold disabled:opacity-50 hover:bg-gray-800 transition-colors"
            >
              {gcalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
              Conectar Google Calendar
            </button>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Simulador público */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-800">Simulador público</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Permite acceso sin login a <code className="text-xs">/simulador</code>
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSimuladorChange(!simulador_publico)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
            simulador_publico ? 'bg-emerald-500' : 'bg-gray-200'
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            simulador_publico ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
      </div>
    </div>
  )
}
