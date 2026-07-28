'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Tarea, Empresa, TareaEstado, TareaPrioridad } from '@/lib/types'

const EMPRESAS_LIST: Empresa[] = ['ostara', 'hormiblock', 'blockera', 'granny']
const EMPRESA_LABEL: Record<Empresa, string> = {
  ostara: 'Ostara', hormiblock: 'Hormiblock', blockera: 'Blockera', granny: 'Granny'
}

interface Props {
  miId: string
  empresasPermitidas: Empresa[]
  onClose: () => void
  onCreada: (t: Tarea) => void
}

export default function NuevaTareaModal({ miId, empresasPermitidas, onClose, onCreada }: Props) {
  const [titulo, setTitulo]           = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [empresa, setEmpresa]         = useState<Empresa>(empresasPermitidas[0] ?? 'ostara')
  const [prioridad, setPrioridad]     = useState<TareaPrioridad>('media')
  const [fecha, setFecha]             = useState('')
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')

  async function crear() {
    if (!titulo.trim()) { setError('El título es obligatorio'); return }
    setSaving(true)
    const supabase = createClient()
    const { data, error: err } = await supabase
      .from('tareas')
      .insert({
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        empresa,
        prioridad,
        estado: 'pendiente' as TareaEstado,
        creado_por: miId,
        fecha_limite: fecha || null,
      })
      .select()
      .single()
    setSaving(false)
    if (err) { setError(err.message); return }
    onCreada(data as Tarea)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 p-0 md:p-4" onClick={onClose}>
      <div
        className="bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-2xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[var(--border)]">
          <h2 className="font-bold text-base">Nueva tarea</h2>
          <button onClick={onClose}><X size={18} className="text-[var(--muted-foreground)]" /></button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Título */}
          <div>
            <label className="text-xs font-semibold text-[var(--muted-foreground)] block mb-1">Título *</label>
            <input
              autoFocus
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="¿Qué hay que hacer?"
              className="w-full text-sm border border-[var(--border)] rounded-xl px-3 py-2.5 outline-none focus:border-[var(--primary)]"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="text-xs font-semibold text-[var(--muted-foreground)] block mb-1">Descripción</label>
            <textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Detalles opcionales..."
              rows={2}
              className="w-full text-sm border border-[var(--border)] rounded-xl px-3 py-2.5 outline-none focus:border-[var(--primary)] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Empresa */}
            <div>
              <label className="text-xs font-semibold text-[var(--muted-foreground)] block mb-1">Empresa</label>
              <select
                value={empresa}
                onChange={e => setEmpresa(e.target.value as Empresa)}
                className="w-full text-sm border border-[var(--border)] rounded-xl px-3 py-2.5 outline-none focus:border-[var(--primary)] bg-white"
              >
                {empresasPermitidas.map(e => (
                  <option key={e} value={e}>{EMPRESA_LABEL[e]}</option>
                ))}
              </select>
            </div>

            {/* Prioridad */}
            <div>
              <label className="text-xs font-semibold text-[var(--muted-foreground)] block mb-1">Prioridad</label>
              <select
                value={prioridad}
                onChange={e => setPrioridad(e.target.value as TareaPrioridad)}
                className="w-full text-sm border border-[var(--border)] rounded-xl px-3 py-2.5 outline-none focus:border-[var(--primary)] bg-white"
              >
                <option value="alta">🔴 Alta</option>
                <option value="media">🟡 Media</option>
                <option value="baja">⚪ Baja</option>
              </select>
            </div>
          </div>

          {/* Fecha límite */}
          <div>
            <label className="text-xs font-semibold text-[var(--muted-foreground)] block mb-1">Fecha límite</label>
            <input
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              className="w-full text-sm border border-[var(--border)] rounded-xl px-3 py-2.5 outline-none focus:border-[var(--primary)]"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-medium border border-[var(--border)] rounded-xl text-[var(--muted-foreground)]">
            Cancelar
          </button>
          <button onClick={crear} disabled={saving} className="flex-1 py-2.5 text-sm font-semibold bg-[var(--primary)] text-white rounded-xl disabled:opacity-60 flex items-center justify-center gap-2">
            {saving && <Loader2 size={14} className="animate-spin" />}
            Crear tarea
          </button>
        </div>
      </div>
    </div>
  )
}
