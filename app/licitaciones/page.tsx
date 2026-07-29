'use client'

import { useState, useEffect, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import { EMPRESAS, formatFecha, diasRestantes, type Empresa } from '@/lib/utils'
import { FileWarning, Plus, CheckCircle, Loader2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Licitacion {
  id: string
  titulo: string
  empresa: Empresa
  fecha_cierre: string
  monto: string
  estado: 'activa' | 'cerrada' | 'adjudicada'
  descripcion: string
}

function urgenciaColor(dias: number, estado: string) {
  if (estado !== 'activa') return 'bg-green-100 text-green-700'
  if (dias < 0) return 'bg-slate-100 text-slate-500'
  if (dias <= 2) return 'bg-red-100 text-red-700'
  if (dias <= 7) return 'bg-amber-100 text-amber-700'
  return 'bg-blue-100 text-blue-700'
}

function urgenciaLabel(dias: number, estado: string) {
  if (estado !== 'activa') return estado === 'adjudicada' ? 'Adjudicada' : 'Cerrada'
  if (dias < 0) return 'Vencida'
  if (dias === 0) return '¡Hoy!'
  if (dias === 1) return 'Mañana'
  return `${dias} días`
}

const EMPRESAS_LIST: Empresa[] = ['ostara', 'hormiblock', 'blockera', 'granny']

export default function LicitacionesPage() {
  const [licitaciones, setLicitaciones] = useState<Licitacion[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [form, setForm] = useState({
    titulo: '', empresa: 'ostara' as Empresa, fecha_cierre: '',
    monto: '', descripcion: '', estado: 'activa' as Licitacion['estado'],
  })

  const supabase = createClient()

  const cargar = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('licitaciones')
      .select('*')
      .order('fecha_cierre', { ascending: true })
    setLicitaciones((data as Licitacion[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  async function guardar() {
    if (!form.titulo || !form.fecha_cierre) return
    setGuardando(true)
    await supabase.from('licitaciones').insert({
      titulo: form.titulo,
      empresa: form.empresa,
      fecha_cierre: form.fecha_cierre,
      monto: form.monto,
      descripcion: form.descripcion,
      estado: form.estado,
    })
    setModal(false)
    setForm({ titulo: '', empresa: 'ostara', fecha_cierre: '', monto: '', descripcion: '', estado: 'activa' })
    setGuardando(false)
    cargar()
  }

  const activas  = licitaciones.filter(l => l.estado === 'activa')
  const cerradas = licitaciones.filter(l => l.estado !== 'activa')

  return (
    <AppShell
      title="Licitaciones"
      headerRight={
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-1.5 bg-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-xl"
        >
          <Plus size={14} /> Nueva
        </button>
      }
    >
      <div className="p-4 space-y-4">

        {/* Resumen */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-[var(--border)] p-3 text-center">
            <p className="text-2xl font-bold text-[var(--primary)]">{activas.length}</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Activas</p>
          </div>
          <div className="bg-white rounded-2xl border border-[var(--border)] p-3 text-center">
            <p className="text-2xl font-bold text-red-600">
              {activas.filter(l => l.fecha_cierre && diasRestantes(l.fecha_cierre) <= 3).length}
            </p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Urgentes</p>
          </div>
          <div className="bg-white rounded-2xl border border-[var(--border)] p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{cerradas.length}</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Cerradas</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-[var(--primary)]" />
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
                <FileWarning size={16} className="text-amber-500" />
                <span className="font-semibold text-sm">Activas — ordenadas por cierre</span>
              </div>
              {activas.length === 0 ? (
                <p className="text-center text-sm text-[var(--muted-foreground)] py-8">Sin licitaciones activas · tocá + Nueva para agregar</p>
              ) : activas.map((l) => {
                const emp = EMPRESAS[l.empresa]
                const dias = l.fecha_cierre ? diasRestantes(l.fecha_cierre) : 99
                return (
                  <div key={l.id} className="px-4 py-4 border-b border-[var(--border)] last:border-0">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="text-sm font-semibold leading-snug flex-1">{l.titulo}</p>
                      <span className={`text-xs font-bold px-2 py-1 rounded-xl whitespace-nowrap ${urgenciaColor(dias, l.estado)}`}>
                        {urgenciaLabel(dias, l.estado)}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)] mb-2">{l.descripcion}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${emp.bg} ${emp.text}`}>
                        {emp.label}
                      </span>
                      {l.fecha_cierre && (
                        <span className="text-xs text-[var(--muted-foreground)]">Cierre: {formatFecha(l.fecha_cierre)}</span>
                      )}
                      {l.monto && (
                        <span className="text-xs font-semibold text-[var(--foreground)] ml-auto">{l.monto}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {cerradas.length > 0 && (
              <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
                  <CheckCircle size={16} className="text-green-500" />
                  <span className="font-semibold text-sm">Cerradas / Adjudicadas</span>
                </div>
                {cerradas.map((l) => {
                  const emp = EMPRESAS[l.empresa]
                  return (
                    <div key={l.id} className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] last:border-0 opacity-70">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{l.titulo}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">{emp.label}{l.monto ? ` · ${l.monto}` : ''}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg ${urgenciaColor(0, l.estado)}`}>
                        {l.estado === 'adjudicada' ? 'Adjudicada' : 'Cerrada'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setModal(false)}>
          <div className="bg-white w-full rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="font-bold text-lg">Nueva licitación</p>
              <button onClick={() => setModal(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[var(--muted-foreground)] mb-1 block">Título *</label>
                <input className="w-full border border-[var(--border)] rounded-xl px-3 py-2 text-sm" placeholder="Ej: Provisión hormigón — Ruta 7" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--muted-foreground)] mb-1 block">Empresa</label>
                  <select className="w-full border border-[var(--border)] rounded-xl px-3 py-2 text-sm" value={form.empresa} onChange={e => setForm(f => ({ ...f, empresa: e.target.value as Empresa }))}>
                    {EMPRESAS_LIST.map(e => <option key={e} value={e}>{EMPRESAS[e].label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--muted-foreground)] mb-1 block">Estado</label>
                  <select className="w-full border border-[var(--border)] rounded-xl px-3 py-2 text-sm" value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value as Licitacion['estado'] }))}>
                    <option value="activa">Activa</option>
                    <option value="cerrada">Cerrada</option>
                    <option value="adjudicada">Adjudicada</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--muted-foreground)] mb-1 block">Fecha cierre *</label>
                  <input type="date" className="w-full border border-[var(--border)] rounded-xl px-3 py-2 text-sm" value={form.fecha_cierre} onChange={e => setForm(f => ({ ...f, fecha_cierre: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--muted-foreground)] mb-1 block">Monto</label>
                  <input className="w-full border border-[var(--border)] rounded-xl px-3 py-2 text-sm" placeholder="Ej: $4.500.000" value={form.monto} onChange={e => setForm(f => ({ ...f, monto: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--muted-foreground)] mb-1 block">Descripción</label>
                <textarea className="w-full border border-[var(--border)] rounded-xl px-3 py-2 text-sm resize-none" rows={2} placeholder="Organismo, detalles..." value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
              </div>
            </div>
            <button onClick={guardar} disabled={!form.titulo || !form.fecha_cierre || guardando} className="w-full bg-[var(--primary)] text-white font-semibold py-3 rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2">
              {guardando && <Loader2 size={16} className="animate-spin" />}
              Guardar licitación
            </button>
          </div>
        </div>
      )}
    </AppShell>
  )
}
