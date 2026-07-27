'use client'

import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { EMPRESAS, PRIORIDAD_COLOR, type Empresa } from '@/lib/utils'
import { Plus, LayoutGrid, List, Building2 } from 'lucide-react'

const COLUMNAS = ['pendiente', 'en_curso', 'bloqueado', 'completado'] as const
const COLUMNA_LABEL: Record<string, string> = {
  pendiente:  'Pendiente',
  en_curso:   'En curso',
  bloqueado:  'Bloqueado',
  completado: 'Completado',
}

const TAREAS = [
  { id: '1',  titulo: 'Enviar propuesta TOYOTA',        empresa: 'ostara' as Empresa,     estado: 'en_curso',   prioridad: 'alta',  fecha: '2026-07-07' },
  { id: '2',  titulo: 'Diseñar stand IVECO',            empresa: 'ostara' as Empresa,     estado: 'pendiente',  prioridad: 'alta',  fecha: '2026-07-10' },
  { id: '3',  titulo: 'Cotizar catering Banco Central', empresa: 'ostara' as Empresa,     estado: 'pendiente',  prioridad: 'media', fecha: '2026-07-12' },
  { id: '4',  titulo: 'Pedido de cemento urgente',      empresa: 'hormiblock' as Empresa, estado: 'pendiente',  prioridad: 'alta',  fecha: '2026-07-08' },
  { id: '5',  titulo: 'Mantenimiento mixer 3',          empresa: 'hormiblock' as Empresa, estado: 'en_curso',   prioridad: 'media', fecha: '2026-07-09' },
  { id: '6',  titulo: 'Licitación calle San Martín',    empresa: 'blockera' as Empresa,   estado: 'en_curso',   prioridad: 'alta',  fecha: '2026-07-09' },
  { id: '7',  titulo: 'Presupuesto obra particular',    empresa: 'blockera' as Empresa,   estado: 'pendiente',  prioridad: 'media', fecha: '2026-07-11' },
  { id: '8',  titulo: 'Análisis suelo lote norte',      empresa: 'granny' as Empresa,     estado: 'pendiente',  prioridad: 'baja',  fecha: '2026-07-15' },
  { id: '9',  titulo: 'Renovar contrato arrendamiento', empresa: 'granny' as Empresa,     estado: 'bloqueado',  prioridad: 'alta',  fecha: '2026-07-14' },
  { id: '10', titulo: 'Cerrar propuesta ZEBRA',         empresa: 'ostara' as Empresa,     estado: 'completado', prioridad: 'alta',  fecha: '2026-07-05' },
  { id: '11', titulo: 'Entrega hormigón Obra Norte',    empresa: 'hormiblock' as Empresa, estado: 'completado', prioridad: 'media', fecha: '2026-07-04' },
]

type Vista = 'kanban' | 'lista' | 'empresa'

export default function PendientesPage() {
  const [filtroEmpresa, setFiltroEmpresa] = useState<Empresa | 'todas'>('todas')
  const [vista, setVista] = useState<Vista>('kanban')

  const tareas = filtroEmpresa === 'todas' ? TAREAS : TAREAS.filter(t => t.empresa === filtroEmpresa)
  const urgentes = tareas.filter(t => t.prioridad === 'alta' && t.estado !== 'completado').length
  const activas = tareas.filter(t => t.estado !== 'completado').length

  return (
    <AppShell
      title="Pendientes"
      headerRight={
        <button className="flex items-center gap-1.5 bg-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-xl">
          <Plus size={14} /> Nueva
        </button>
      }
    >
      <div className="p-4 space-y-4">

        {/* Controles */}
        <div className="flex items-center gap-2">
          {/* Toggle vista */}
          <div className="flex bg-white border border-[var(--border)] rounded-xl p-1 gap-1 shrink-0">
            {([['kanban', LayoutGrid], ['lista', List], ['empresa', Building2]] as const).map(([v, Icon]) => (
              <button key={v} onClick={() => setVista(v)}
                className={`p-1.5 rounded-lg transition-colors ${vista === v ? 'bg-[var(--primary)] text-white' : 'text-[var(--muted-foreground)]'}`}>
                <Icon size={15} />
              </button>
            ))}
          </div>
          {/* Filtro empresa */}
          <div className="flex gap-1.5 overflow-x-auto">
            {(['todas', 'ostara', 'hormiblock', 'blockera', 'granny'] as const).map((e) => {
              const emp = e === 'todas' ? null : EMPRESAS[e]
              return (
                <button key={e} onClick={() => setFiltroEmpresa(e)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                    filtroEmpresa === e ? 'bg-[var(--primary)] text-white' : 'bg-white border border-[var(--border)] text-[var(--muted-foreground)]'
                  }`}>
                  {emp && <span className={`w-1.5 h-1.5 rounded-full ${emp.dot}`} />}
                  {e === 'todas' ? 'Todas' : emp!.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Contador */}
        <p className="text-xs text-[var(--muted-foreground)]">
          <span className="font-semibold text-[var(--foreground)]">{activas}</span> activas
          {urgentes > 0 && <span className="text-red-500 font-semibold ml-2">· {urgentes} urgentes</span>}
        </p>

        {/* ── KANBAN ── */}
        {vista === 'kanban' && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {COLUMNAS.map((col) => {
              const grupo = tareas.filter(t => t.estado === col)
              return (
                <div key={col} className="flex-shrink-0 w-64 md:flex-1">
                  <div className="bg-[var(--muted)] rounded-2xl p-3">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold">{COLUMNA_LABEL[col]}</span>
                      <span className="text-xs text-[var(--muted-foreground)] bg-white px-1.5 py-0.5 rounded-lg">{grupo.length}</span>
                    </div>
                    <div className="space-y-2">
                      {grupo.map(t => {
                        const emp = EMPRESAS[t.empresa]
                        return (
                          <div key={t.id} className={`bg-white rounded-xl p-3 border border-[var(--border)] cursor-pointer hover:shadow-sm transition-shadow ${t.estado === 'completado' ? 'opacity-50' : ''}`}>
                            <p className={`text-sm font-medium mb-2 leading-snug ${t.estado === 'completado' ? 'line-through' : ''}`}>{t.titulo}</p>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${emp.bg} ${emp.text}`}>{emp.label}</span>
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${PRIORIDAD_COLOR[t.prioridad]}`}>{t.prioridad}</span>
                              <span className="text-[10px] text-[var(--muted-foreground)] ml-auto">
                                {new Date(t.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                      {grupo.length === 0 && <p className="text-center text-xs text-[var(--muted-foreground)] py-4">Sin tareas</p>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── LISTA ── */}
        {vista === 'lista' && (
          <div className="space-y-3">
            {(['alta', 'media', 'baja'] as const).map(prioridad => {
              const grupo = tareas.filter(t => t.prioridad === prioridad && t.estado !== 'completado')
              if (grupo.length === 0) return null
              const iconos = { alta: '🔴', media: '🟡', baja: '⚪' }
              return (
                <div key={prioridad} className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-[var(--border)] flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wide">{iconos[prioridad]} Prioridad {prioridad}</span>
                    <span className="text-xs text-[var(--muted-foreground)]">{grupo.length} tareas</span>
                  </div>
                  <div className="divide-y divide-[var(--border)]">
                    {grupo.map(t => {
                      const emp = EMPRESAS[t.empresa]
                      const vencida = new Date(t.fecha) < new Date()
                      return (
                        <div key={t.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--muted)] cursor-pointer">
                          <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                            t.estado === 'en_curso' ? 'border-blue-500 bg-blue-50' :
                            t.estado === 'bloqueado' ? 'border-red-400 bg-red-50' : 'border-[var(--border)]'
                          }`}>
                            {t.estado === 'en_curso' && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{t.titulo}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-[10px] font-semibold px-1 py-0.5 rounded ${emp.bg} ${emp.text}`}>{emp.label}</span>
                              <span className={`text-[10px] ${vencida ? 'text-red-500 font-semibold' : 'text-[var(--muted-foreground)]'}`}>
                                {vencida ? '⚠ Vencida' : new Date(t.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                              </span>
                            </div>
                          </div>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-lg ${
                            t.estado === 'en_curso' ? 'bg-blue-100 text-blue-700' :
                            t.estado === 'bloqueado' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                          }`}>{COLUMNA_LABEL[t.estado]}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
            {tareas.filter(t => t.estado === 'completado').length > 0 && (
              <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden opacity-60">
                <div className="px-4 py-2.5 border-b border-[var(--border)]">
                  <span className="text-xs font-bold uppercase tracking-wide">✅ Completadas</span>
                </div>
                {tareas.filter(t => t.estado === 'completado').map(t => {
                  const emp = EMPRESAS[t.empresa]
                  return (
                    <div key={t.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--border)] last:border-0">
                      <span className="text-green-500 text-sm">✓</span>
                      <p className="text-sm line-through text-[var(--muted-foreground)] flex-1">{t.titulo}</p>
                      <span className={`text-[10px] font-semibold px-1 py-0.5 rounded ${emp.bg} ${emp.text}`}>{emp.label}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── POR EMPRESA ── */}
        {vista === 'empresa' && (
          <div className="space-y-4">
            {(Object.keys(EMPRESAS) as Empresa[])
              .filter(e => filtroEmpresa === 'todas' || e === filtroEmpresa)
              .map(e => {
                const emp = EMPRESAS[e]
                const tareasEmp = tareas.filter(t => t.empresa === e)
                if (tareasEmp.length === 0) return null
                const completadas = tareasEmp.filter(t => t.estado === 'completado').length
                const pct = Math.round((completadas / tareasEmp.length) * 100)
                const activas = tareasEmp.filter(t => t.estado !== 'completado')
                return (
                  <div key={e} className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
                    <div className="px-4 py-3 border-b border-[var(--border)]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${emp.dot}`} />
                          <span className="font-bold text-sm">{emp.label}</span>
                        </div>
                        <span className="text-xs font-semibold text-[var(--muted-foreground)]">{pct}% completo</span>
                      </div>
                      <div className="h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: emp.color }} />
                      </div>
                    </div>
                    <div className="divide-y divide-[var(--border)]">
                      {activas.map(t => (
                        <div key={t.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--muted)] cursor-pointer">
                          <div className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 ${
                            t.estado === 'en_curso' ? 'border-blue-500 bg-blue-100' :
                            t.estado === 'bloqueado' ? 'border-red-400 bg-red-100' : 'border-[var(--border)]'
                          }`} />
                          <p className="text-sm flex-1 truncate">{t.titulo}</p>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-lg ${PRIORIDAD_COLOR[t.prioridad]}`}>{t.prioridad}</span>
                        </div>
                      ))}
                      {activas.length === 0 && <p className="text-center text-xs text-green-600 font-medium py-4">✓ Todo al día</p>}
                    </div>
                  </div>
                )
              })}
          </div>
        )}

      </div>
    </AppShell>
  )
}
