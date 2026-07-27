'use client'

import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { EMPRESAS, formatFecha, diasRestantes, type Empresa } from '@/lib/utils'
import { AlertTriangle, Calendar, Mail } from 'lucide-react'

const RESUMEN_EMPRESAS = [
  { id: 'ostara' as const,     tareasUrgentes: 3, tareasTotal: 12, mailsPendientes: 7  },
  { id: 'hormiblock' as const, tareasUrgentes: 1, tareasTotal: 5,  mailsPendientes: 2  },
  { id: 'blockera' as const,   tareasUrgentes: 2, tareasTotal: 8,  mailsPendientes: 4  },
  { id: 'granny' as const,     tareasUrgentes: 0, tareasTotal: 3,  mailsPendientes: 1  },
]

const EVENTOS_DEMO = [
  { id: '1',  titulo: 'Stand-up Ostara',            empresa: 'ostara' as Empresa,     fecha: '2026-07-07', hora: '09:00' },
  { id: '2',  titulo: 'Envío propuesta TOYOTA',      empresa: 'ostara' as Empresa,     fecha: '2026-07-07', hora: '12:00' },
  { id: '3',  titulo: 'Reunión proveedor cemento',   empresa: 'hormiblock' as Empresa, fecha: '2026-07-08', hora: '11:00' },
  { id: '4',  titulo: 'Cierre licitación Municipal', empresa: 'blockera' as Empresa,   fecha: '2026-07-09', hora: '17:00' },
  { id: '5',  titulo: 'Lanzamiento IVECO',           empresa: 'ostara' as Empresa,     fecha: '2026-07-10', hora: '19:00' },
  { id: '6',  titulo: 'Revisión cultivos Granny',    empresa: 'granny' as Empresa,     fecha: '2026-07-11', hora: '08:00' },
  { id: '7',  titulo: 'Reunión contador',            empresa: 'granny' as Empresa,     fecha: '2026-07-11', hora: '10:30' },
  { id: '8',  titulo: 'Call con ZEBRA',              empresa: 'ostara' as Empresa,     fecha: '2026-07-11', hora: '15:00' },
]

const ALERTAS = [
  { empresa: 'blockera' as Empresa,   texto: 'Cierre licitación Municipal', fecha: '2026-07-09', dias: 3 },
  { empresa: 'ostara' as Empresa,     texto: 'Enviar propuesta TOYOTA',     fecha: '2026-07-07', dias: 1 },
  { empresa: 'hormiblock' as Empresa, texto: 'Reunión proveedor cemento',   fecha: '2026-07-08', dias: 2 },
]

const DIAS_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function getInicioSemana(fecha: Date) {
  const d = new Date(fecha)
  const dia = d.getDay()
  d.setDate(d.getDate() - dia)
  d.setHours(0, 0, 0, 0)
  return d
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function DashboardPage() {
  const hoy = new Date()
  const [semanaOffset, setSemanaOffset] = useState(0)

  const inicioSemana = getInicioSemana(hoy)
  inicioSemana.setDate(inicioSemana.getDate() + semanaOffset * 7)

  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicioSemana)
    d.setDate(inicioSemana.getDate() + i)
    return d
  })

  const diaNombre = hoy.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
  const hoyStr = toDateStr(hoy)

  const eventosDelDia = (fechaStr: string) =>
    EVENTOS_DEMO.filter(e => e.fecha === fechaStr)

  const labelSemana = () => {
    const ini = diasSemana[0]
    const fin = diasSemana[6]
    if (semanaOffset === 0) return 'Esta semana'
    if (semanaOffset === 1) return 'Próxima semana'
    if (semanaOffset === -1) return 'Semana pasada'
    return `${ini.getDate()} al ${fin.getDate()} ${fin.toLocaleDateString('es-AR', { month: 'long' })}`
  }

  return (
    <AppShell title="Franco Hub">
      <div className="flex flex-col">

        {/* Header */}
        <div className="bg-[var(--primary)] px-4 pt-4 pb-6">
          <p className="text-white/60 text-xs capitalize mb-0.5">{diaNombre}</p>
          <p className="text-white text-2xl font-bold">Buenos días, Franco</p>
          <p className="text-white/70 text-sm mt-1">
            {ALERTAS.length} alertas · {EVENTOS_DEMO.filter(e => e.fecha === hoyStr).length} reuniones hoy
          </p>
        </div>

        <div className="p-4 space-y-4 -mt-2">

          {/* ── CALENDARIO SEMANAL ── */}
          <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">

            {/* Header semana */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-[var(--primary)]" />
                <span className="font-semibold text-sm">{labelSemana()}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSemanaOffset(o => o - 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)] text-lg leading-none"
                >‹</button>
                {semanaOffset !== 0 && (
                  <button
                    onClick={() => setSemanaOffset(0)}
                    className="text-[10px] font-semibold text-[var(--primary)] px-1.5 py-0.5 rounded-lg bg-[var(--primary)]/10"
                  >Hoy</button>
                )}
                <button
                  onClick={() => setSemanaOffset(o => o + 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)] text-lg leading-none"
                >›</button>
              </div>
            </div>

            {/* Fila de días */}
            <div className="grid grid-cols-7 border-b border-[var(--border)]">
              {diasSemana.map((d) => {
                const str = toDateStr(d)
                const esHoy = str === hoyStr
                const eventos = eventosDelDia(str)
                return (
                  <div
                    key={str}
                    className={`flex flex-col items-center py-2 px-0.5 ${esHoy ? 'bg-[var(--primary)]/5' : ''}`}
                  >
                    <span className="text-[10px] font-medium text-[var(--muted-foreground)]">
                      {DIAS_CORTO[d.getDay()]}
                    </span>
                    <span className={`text-sm font-bold mt-0.5 w-7 h-7 flex items-center justify-center rounded-full ${
                      esHoy ? 'bg-[var(--primary)] text-white' : 'text-[var(--foreground)]'
                    }`}>
                      {d.getDate()}
                    </span>
                    {/* Puntos de colores por empresa */}
                    <div className="flex gap-0.5 mt-1 min-h-[8px]">
                      {eventos.slice(0, 3).map((ev, i) => (
                        <span key={i} className={`w-1.5 h-1.5 rounded-full ${EMPRESAS[ev.empresa].dot}`} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Lista de eventos de la semana */}
            <div className="divide-y divide-[var(--border)]">
              {diasSemana.map((d) => {
                const str = toDateStr(d)
                const eventos = eventosDelDia(str)
                if (eventos.length === 0) return null
                const esHoy = str === hoyStr
                return (
                  <div key={str}>
                    <div className={`px-4 py-1.5 ${esHoy ? 'bg-[var(--primary)]/5' : 'bg-[var(--muted)]'}`}>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${esHoy ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}>
                        {esHoy ? '📍 Hoy · ' : ''}{d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    {eventos.map((ev) => {
                      const emp = EMPRESAS[ev.empresa]
                      return (
                        <div key={ev.id} className="flex items-center gap-3 px-4 py-2.5">
                          <div className={`w-1 h-8 rounded-full shrink-0 ${emp.dot}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{ev.titulo}</p>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${emp.bg} ${emp.text}`}>
                              {emp.label}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-[var(--muted-foreground)] shrink-0">{ev.hora}</span>
                        </div>
                      )
                    })}
                  </div>
                )
              })}

              {diasSemana.every(d => eventosDelDia(toDateStr(d)).length === 0) && (
                <p className="text-center text-sm text-[var(--muted-foreground)] py-6">Sin reuniones esta semana</p>
              )}
            </div>
          </div>

          {/* Alertas */}
          {ALERTAS.length > 0 && (
            <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
                <AlertTriangle size={16} className="text-red-500" />
                <span className="font-semibold text-sm">Alertas activas</span>
              </div>
              {ALERTAS.map((a, i) => {
                const emp = EMPRESAS[a.empresa]
                const urgente = a.dias <= 1
                return (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] last:border-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${emp.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.texto}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{emp.label} · {formatFecha(a.fecha)}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${urgente ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {a.dias === 0 ? 'Hoy' : a.dias === 1 ? 'Mañana' : `${a.dias}d`}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Resumen empresas */}
          <div className="grid grid-cols-2 gap-3">
            {RESUMEN_EMPRESAS.map((e) => {
              const emp = EMPRESAS[e.id]
              return (
                <div key={e.id} className="bg-white rounded-2xl border border-[var(--border)] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${emp.dot}`} />
                    <span className="text-xs font-bold">{emp.label}</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-[11px] text-[var(--muted-foreground)]">Tareas</span>
                      <span className="text-xs font-semibold">
                        {e.tareasUrgentes > 0 && <span className="text-red-600 mr-1">⚠ {e.tareasUrgentes}</span>}
                        {e.tareasTotal} total
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[11px] text-[var(--muted-foreground)]">Mails</span>
                      <span className="text-xs font-semibold">{e.mailsPendientes} pend.</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Emails resumen */}
          <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-[var(--primary)]" />
                <span className="font-semibold text-sm">Emails pendientes</span>
              </div>
              <span className="text-sm font-bold text-red-600">
                {RESUMEN_EMPRESAS.reduce((s, e) => s + e.mailsPendientes, 0)} total
              </span>
            </div>
            {RESUMEN_EMPRESAS.map((e) => {
              const emp = EMPRESAS[e.id]
              return (
                <div key={e.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--border)] last:border-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${emp.dot}`} />
                  <span className="text-sm flex-1">{emp.label}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${e.mailsPendientes > 3 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                    {e.mailsPendientes} sin respuesta
                  </span>
                </div>
              )
            })}
          </div>

        </div>
      </div>
    </AppShell>
  )
}
