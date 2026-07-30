'use client'

import { useState, useEffect, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import { EMPRESAS, type Empresa } from '@/lib/utils'
import { Plus, Loader2, X, ExternalLink, CheckCircle, Clock, Archive, ChevronDown, ChevronUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Proyecto {
  id: string
  titulo: string
  descripcion: string
  empresa: Empresa
  estado: 'activo' | 'pendiente' | 'finalizado'
  fecha_inicio: string | null
  fecha_fin: string | null
  responsable: string
  asana_url: string
  created_at: string
}

const ESTADO_CONFIG = {
  activo:     { label: 'Activo',     icon: Clock,        color: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500'   },
  pendiente:  { label: 'Pendiente',  icon: Archive,      color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500'  },
  finalizado: { label: 'Finalizado', icon: CheckCircle,  color: 'bg-green-100 text-green-700', dot: 'bg-green-500'  },
}

const EMPRESAS_LIST: Empresa[] = ['ostara', 'hormiblock', 'blockera', 'granny']

function formatFecha(f: string | null) {
  if (!f) return ''
  return new Date(f + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ProyectosPage() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [expandido, setExpandido] = useState<string | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<Proyecto['estado'] | 'todos'>('todos')
  const [form, setForm] = useState({
    titulo: '', descripcion: '', empresa: 'ostara' as Empresa,
    estado: 'activo' as Proyecto['estado'],
    fecha_inicio: '', fecha_fin: '', responsable: '', asana_url: '',
  })

  const supabase = createClient()

  const cargar = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('proyectos')
      .select('*')
      .order('created_at', { ascending: false })
    setProyectos((data as Proyecto[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  async function guardar() {
    if (!form.titulo.trim()) return
    setGuardando(true)
    await supabase.from('proyectos').insert({
      titulo:      form.titulo.trim(),
      descripcion: form.descripcion.trim(),
      empresa:     form.empresa,
      estado:      form.estado,
      fecha_inicio: form.fecha_inicio || null,
      fecha_fin:    form.fecha_fin    || null,
      responsable:  form.responsable.trim(),
      asana_url:    form.asana_url.trim(),
    })
    setModal(false)
    setForm({ titulo:'', descripcion:'', empresa:'ostara', estado:'activo', fecha_inicio:'', fecha_fin:'', responsable:'', asana_url:'' })
    setGuardando(false)
    cargar()
  }

  async function cambiarEstado(id: string, estado: Proyecto['estado']) {
    await supabase.from('proyectos').update({ estado }).eq('id', id)
    setProyectos(prev => prev.map(p => p.id === id ? { ...p, estado } : p))
  }

  const filtrados = filtroEstado === 'todos'
    ? proyectos
    : proyectos.filter(p => p.estado === filtroEstado)

  const conteos = {
    activo:     proyectos.filter(p => p.estado === 'activo').length,
    pendiente:  proyectos.filter(p => p.estado === 'pendiente').length,
    finalizado: proyectos.filter(p => p.estado === 'finalizado').length,
  }

  return (
    <AppShell
      title="Proyectos"
      headerRight={
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-1.5 bg-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-xl"
        >
          <Plus size={14} /> Nuevo
        </button>
      }
    >
      <div className="p-4 space-y-4">

        {/* Resumen */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-[var(--border)] p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{conteos.activo}</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Activos</p>
          </div>
          <div className="bg-white rounded-2xl border border-[var(--border)] p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{conteos.pendiente}</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Pendientes</p>
          </div>
          <div className="bg-white rounded-2xl border border-[var(--border)] p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{conteos.finalizado}</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Finalizados</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['todos', 'activo', 'pendiente', 'finalizado'] as const).map(e => (
            <button
              key={e}
              onClick={() => setFiltroEstado(e)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                filtroEstado === e
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-white border border-[var(--border)] text-[var(--muted-foreground)]'
              }`}
            >
              {e === 'todos' ? 'Todos' : ESTADO_CONFIG[e].label}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-[var(--primary)]" />
          </div>
        ) : filtrados.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[var(--border)] p-8 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">Sin proyectos · tocá + Nuevo para agregar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtrados.map(p => {
              const emp    = EMPRESAS[p.empresa]
              const cfg    = ESTADO_CONFIG[p.estado]
              const EIcon  = cfg.icon
              const abierto = expandido === p.id

              return (
                <div key={p.id} className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
                  {/* Cabecera */}
                  <button
                    onClick={() => setExpandido(abierto ? null : p.id)}
                    className="w-full text-left px-4 py-4 flex items-start gap-3 active:bg-[var(--muted)] transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${cfg.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{p.titulo}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${emp.bg} ${emp.text}`}>
                          {emp.label}
                        </span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        {p.responsable && (
                          <span className="text-[10px] text-[var(--muted-foreground)]">👤 {p.responsable}</span>
                        )}
                        {p.fecha_fin && (
                          <span className="text-[10px] text-[var(--muted-foreground)]">📅 {formatFecha(p.fecha_fin)}</span>
                        )}
                      </div>
                    </div>
                    {abierto ? <ChevronUp size={16} className="text-[var(--muted-foreground)] mt-0.5 shrink-0" />
                              : <ChevronDown size={16} className="text-[var(--muted-foreground)] mt-0.5 shrink-0" />}
                  </button>

                  {/* Detalle expandido */}
                  {abierto && (
                    <div className="px-4 pb-4 space-y-3 border-t border-[var(--border)] pt-3">
                      {p.descripcion && (
                        <p className="text-sm text-[var(--muted-foreground)]">{p.descripcion}</p>
                      )}

                      {(p.fecha_inicio || p.fecha_fin) && (
                        <div className="flex gap-4 text-xs text-[var(--muted-foreground)]">
                          {p.fecha_inicio && <span>Inicio: <strong>{formatFecha(p.fecha_inicio)}</strong></span>}
                          {p.fecha_fin    && <span>Cierre: <strong>{formatFecha(p.fecha_fin)}</strong></span>}
                        </div>
                      )}

                      {/* Cambiar estado */}
                      <div>
                        <p className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase mb-1.5">Estado</p>
                        <div className="flex gap-2">
                          {(['activo', 'pendiente', 'finalizado'] as const).map(est => (
                            <button
                              key={est}
                              onClick={() => cambiarEstado(p.id, est)}
                              className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                                p.estado === est
                                  ? est === 'activo' ? 'bg-blue-500 text-white'
                                  : est === 'pendiente' ? 'bg-amber-500 text-white'
                                  : 'bg-green-500 text-white'
                                  : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                              }`}
                            >
                              {ESTADO_CONFIG[est].label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Link Asana */}
                      {p.asana_url ? (
                        <a
                          href={p.asana_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-2 w-full bg-[#F06A6A] text-white font-semibold py-2.5 rounded-xl text-sm"
                        >
                          <ExternalLink size={15} />
                          Ver en Asana
                        </a>
                      ) : (
                        <p className="text-center text-xs text-[var(--muted-foreground)]">Sin link de Asana</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

      </div>

      {/* Modal nuevo proyecto */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setModal(false)}>
          <div className="bg-white w-full rounded-t-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="font-bold text-lg">Nuevo proyecto</p>
              <button onClick={() => setModal(false)}><X size={20} /></button>
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--muted-foreground)] mb-1 block">Título *</label>
              <input autoFocus className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--primary)]"
                placeholder="Ej: Lanzamiento campaña Ostara Q3"
                value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[var(--muted-foreground)] mb-1 block">Empresa</label>
                <select className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm"
                  value={form.empresa} onChange={e => setForm(f => ({ ...f, empresa: e.target.value as Empresa }))}>
                  {EMPRESAS_LIST.map(e => <option key={e} value={e}>{EMPRESAS[e].label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--muted-foreground)] mb-1 block">Estado</label>
                <select className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm"
                  value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value as Proyecto['estado'] }))}>
                  <option value="activo">Activo</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="finalizado">Finalizado</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--muted-foreground)] mb-1 block">Responsable</label>
              <input className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--primary)]"
                placeholder="Nombre del responsable"
                value={form.responsable} onChange={e => setForm(f => ({ ...f, responsable: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[var(--muted-foreground)] mb-1 block">Fecha inicio</label>
                <input type="date" className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm"
                  value={form.fecha_inicio} onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--muted-foreground)] mb-1 block">Fecha cierre</label>
                <input type="date" className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm"
                  value={form.fecha_fin} onChange={e => setForm(f => ({ ...f, fecha_fin: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--muted-foreground)] mb-1 block">Descripción</label>
              <textarea className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-[var(--primary)]"
                rows={2} placeholder="Objetivo, contexto..."
                value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--muted-foreground)] mb-1 block">Link de Asana (opcional)</label>
              <input className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--primary)]"
                placeholder="https://app.asana.com/..."
                value={form.asana_url} onChange={e => setForm(f => ({ ...f, asana_url: e.target.value }))} />
            </div>

            <button onClick={guardar} disabled={!form.titulo.trim() || guardando}
              className="w-full bg-[var(--primary)] text-white font-semibold py-3.5 rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2">
              {guardando && <Loader2 size={16} className="animate-spin" />}
              Guardar proyecto
            </button>
          </div>
        </div>
      )}
    </AppShell>
  )
}
