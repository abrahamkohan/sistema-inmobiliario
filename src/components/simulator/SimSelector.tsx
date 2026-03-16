// src/components/simulator/SimSelector.tsx
import { useEffect, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useProjects } from '@/hooks/useProjects'
import { useTypologies } from '@/hooks/useTypologies'
import { useClients } from '@/hooks/useClients'
import { useSimStore } from '@/simulator/store'

export function SimSelector() {
  const { data: projects = [] } = useProjects()
  const { data: clients = [] } = useClients()

  const { projectId, typologyId, clientId, setSelection, setBaseValues } = useSimStore()
  const { data: typologies = [] } = useTypologies(projectId ?? '')

  // Filter by category
  const units = typologies.filter((t) => !t.category || t.category === 'unidad')
  const cocheras = typologies.filter((t) => t.category === 'cochera')
  const bauleras = typologies.filter((t) => t.category === 'baulera')

  const NONE = 'none'
  const [cocheraId, setCocheraId] = useState<string>(NONE)
  const [bauleraId, setBauleraId] = useState<string>(NONE)
  const [priceInput, setPriceInput] = useState<string>('')

  // Reset extras when project changes
  useEffect(() => {
    setCocheraId(NONE)
    setBauleraId(NONE)
    setPriceInput('')
  }, [projectId])

  useEffect(() => {
    setPriceInput('')
  }, [typologyId])

  function handlePriceChange(val: string) {
    setPriceInput(val)
    const price = parseFloat(val)
    if (!isNaN(price) && price > 0) {
      setBaseValues({
        price_usd: price,
        cochera_price: 0,
        baulera_price: 0,
      })
    }
  }

  function handleProjectChange(pid: string) {
    setSelection(pid, '', clientId ?? '')
  }

  function handleTypologyChange(tid: string) {
    setSelection(projectId ?? '', tid, clientId ?? '')
  }

  function handleClientChange(cid: string) {
    setSelection(projectId ?? '', typologyId ?? '', cid)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Row 1: Project + Typology + Client */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label className="text-xs text-gray-500">Proyecto</Label>
          <Select value={projectId ?? ''} onValueChange={handleProjectChange}>
            <SelectTrigger><SelectValue placeholder="Seleccioná un proyecto" /></SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label className="text-xs text-gray-500">Tipología</Label>
          <Select
            value={typologyId ?? ''}
            onValueChange={handleTypologyChange}
            disabled={!projectId || units.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={!projectId ? 'Primero seleccioná proyecto' : 'Seleccioná tipología'} />
            </SelectTrigger>
            <SelectContent>
              {units.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name} — {t.area_m2} m²
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label className="text-xs text-gray-500">Cliente</Label>
          <Select value={clientId ?? ''} onValueChange={handleClientChange}>
            <SelectTrigger><SelectValue placeholder="Seleccioná un cliente" /></SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Precio manual */}
      {typologyId && (
        <div className="grid gap-1.5 sm:max-w-[200px]">
          <Label className="text-xs text-gray-500">Precio USD *</Label>
          <Input
            type="number"
            min={1}
            step={1}
            placeholder="Ej: 85000"
            value={priceInput}
            onChange={(e) => handlePriceChange(e.target.value)}
          />
        </div>
      )}

      {/* Row 2: Cochera + Baulera (only shown if project has them) */}
      {(cocheras.length > 0 || bauleras.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {cocheras.length > 0 && (
            <div className="grid gap-1.5">
              <Label className="text-xs text-gray-500">Cochera <span className="text-gray-300">(opcional)</span></Label>
              <Select value={cocheraId} onValueChange={setCocheraId} disabled={!typologyId}>
                <SelectTrigger><SelectValue placeholder="Sin cochera" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin cochera</SelectItem>
                  {cocheras.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {bauleras.length > 0 && (
            <div className="grid gap-1.5">
              <Label className="text-xs text-gray-500">Baulera <span className="text-gray-300">(opcional)</span></Label>
              <Select value={bauleraId} onValueChange={setBauleraId} disabled={!typologyId}>
                <SelectTrigger><SelectValue placeholder="Sin baulera" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin baulera</SelectItem>
                  {bauleras.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
