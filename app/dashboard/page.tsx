'use client'

import { useState, useEffect, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import { EMPRESAS, type Empresa } from '@/lib/utils'
import { AlertTriangle, Calendar, Mail, Loader2, RefreshCw, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { usePerfil } from '@/lib/hooks/usePerfil'
import type { Tarea } from '@/lib/types'

const DIAS_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getInicioSemana(fecha: Date) {
  const d = new Date(fecha)
  d.setDate(d.getDate() - d.getDay())
  d.setHours(0, 0, 0, 0)
  return d
}

function formatHora(isoStr: string) {
  try {
    return new Date(isoStr).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' })
  } catch { return '' }
}

interface CalEvent { id: string; titulo: string; inicio: string; fin: string; allDay: boolean; meet: string | null }
interface GmailThread { id: string; subject: string; from: string; snippet: string }

export default function DashboardPage() {
  const { perfil } = usePerfil()
  const [semanaOffset, setSemanaOffset] = useState(0)
  const [eventos, setEventos]     = useState<CalEvent[]>([])
  const [emails, setEmails]       = useState<GmailThread[]>([])
  const [tareas, setTareas]       = useState<Tarea[]>([])
  const [googleOk, setGoogleOk]   = useState<boolean | null>(null)
  const [loadingCal, setLoadingCal] = useState(false)
  const [loadingMail, setLoadingMail] = useState(false)
  const [loadingTareas, setLoadingTareas] = useState(false)

  const hoy = new Date()
  const hoyStr = toDateStr(hoy)
  const diaNombre = hoy.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })

  const inicioSemana = getInicioSemana(hoy)
  inicioSemana.setDate(inicioSemana.getDate() + semanaOffset * 7)
  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicioSemana)
    d.setDate(inicioSemana.getDate() + i)
    return d
  })

  const labelSemana = () => {
    if (semanaOffset === 0) return 'Esta semana'
    if (semanaOffset === 1) return 'Próxima semana'
    if (semanaOffset === -1) return 'Semana pasada'
    const ini = diasSemana[0], fin = diasSemana[6]
    return `${ini.getDate()} al ${fin.getDate()} ${fin.toLocaleDateString('es-AR', { month: 'long' })}`
  }

  const cargarCalendar = useCallback(async () => {
    setLoadingCal(true)
    try {
      const res = await fetch('/api/google/calendar')
      if (res.status === 403) { setGoogleOk(false); setLoadingCal(false); return }
      const data = await res.json()
      setEventos(data.events ?? [])
      setGoogleOk(true)
    } catch { setGoogleOk(false) }
    setLoadingCal(false)
  }, [])

  const cargarGmail = useCallback(async () => {
    setLoadingMail(true)
    try {
      const res = await fetch('/api/google/gmail')
      if (res.ok) {
        const data = await res.json()
        setEmails(data.emails ?? [])
      }
    } catch {}
    setLoadingMail(false)
  }, [])

  const cargarTareas = useCallback(async () => {
    setLoadingTareas(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('tareas')
      .select('*')
      .neq('estado', 'completado')
      .order('fecha_limite', { ascending: true })
    setTareas((data as Tarea[]) ?? [])
    setLoadingTareas(false)
  }, [])

  useEffect(() => {
    cargarCalendar()
    cargarGmail()
    cargarTareas()
  }, [cargarCalendar, cargarGmail, cargarTareas])

  // Tareas urgentes / vencidas
  const tareasUrgentes = tareas.filter(t =>
    t.prioridad === 'alta' ||
    (t.fecha_limite && new Date(t.fecha_limite) <= hoy)
  )

  // Eventos de hoy
  const eventosHoy = eventos.filter(e => e.inicio?.startsWith(hoyStr))

  // Resumen por empresa
  const empresasPermitidas: Empresa[] = perfil?.rol === 'admin'
    ? ['ostara', 'hormiblock', 'blockera', 'granny']
    : (perfil?.empresas ?? [])

  return (
    <AppShell title="Franco Hub">
      <div className="flex flex-col">

        {/* Header */}
        <div className="bg-[var(--primary)] px-4 pt-4 pb-6">
          <p className="text-white/60 text-xs capitalize mb-0.5">{diaNombre}</p>
          <p className="text-white text-2xl font-bold">Buenos días, {perfil?.nombre?.split(' ')[0] ?? 'Franco'}</p>
          <p className="text-white/70 text-sm mt-1">
            {tareasUrgentes.length > 0 && <span>{tareasUrgentes.length} tareas urgentes · </span>}
            {eventosHoy.length} reuniones hoy
            {emails.length > 0 && <span> · {emails.length} mails importantes</span>}
          </p>
        </div>

        <div className="p-4 space-y-4 -mt-2">

          {/* Banner conectar Google */}
          {googleOk === false && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-amber-800">Conectá tu cuenta Google</p>
                <p className="text-xs text-amber-700 mt-0.5">Para ver tu calendario y emails en el tablero</p>
              </div>
              <a
                href="/api/auth/google"
                className="bg-[var(--primary)] text-white text-xs font-semibold px-4 py-2 rounded-xl shrink-0"
              >
                Conectar
              </a>
            </div>
          )}

          {/* Calendario semanal */}
          <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-[var(--primary)]" />
                <span className="font-semibold text-sm">{labelSemana()}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setSemanaOffset(o => o - 1)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)] text-lg">‹</button>
                {semanaOffset !== 0 && (
                  <button onClick={() => setSemanaOffset(0)} className="text-[10px] font-semibold text-[var(--primary)] px-1.5 py-0.5 rounded-lg bg-[var(--primary)]/10">Hoy</button>
                )}
                <button onClick={() => setSemanaOffset(o => o + 1)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)] text-lg">›</button>
              </div>
            </div>

            {/* Fila días */}
            <div className="grid grid-cols-7 border-b border-[var(--border)]">
              {diasSemana.map(d => {
                const str = toDateStr(d)
                const esHoy = str === hoyStr
                const tieneEvento = semanaOffset === 0 && eventos.some(e => e.inicio?.startsWith(str))
                return (
                  <div key={str} className={`flex flex-col items-center py-2 ${esHoy ? 'bg-[var(--primary)]/5' : ''}`}>
                    <span className="text-[10px] font-medium text-[var(--muted-foreground)]">{DIAS_CORTO[d.getDay()]}</span>
                    <span className={`text-sm font-bold mt-0.5 w-7 h-7 flex items-center justify-center rounded-full ${esHoy ? 'bg-[var(--primary)] text-white' : ''}`}>
                      {d.getDate()}
                    </span>
                    <div className="h-1.5 mt-1">
                      {tieneEvento && <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]/60 block" />}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Eventos de hoy */}
            {loadingCal ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={18} className="animate-spin text-[var(--primary)]" />
              </div>
            ) : eventosHoy.length > 0 ? (
              <div className="divide-y divide-[var(--border)]">
                <div className="px-4 py-1.5 bg-[var(--primary)]/5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary)]">📍 Hoy</span>
                </div>
                {eventosHoy.map(ev => (
                  <div key={ev.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-1 h-8 rounded-full bg-[var(--primary)] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{ev.titulo}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {ev.allDay ? 'Todo el día' : `${formatHora(ev.inicio)} – ${formatHora(ev.fin)}`}
                      </p>
                    </div>
                    {ev.meet && (
                      <a href={ev.meet} target="_blank" rel="noreferrer"
                        className="text-xs text-[var(--primary)] font-semibold flex items-center gap-1 shrink-0">
                        Meet <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : googleOk === true ? (
              <p className="text-center text-sm text-[var(--muted-foreground)] py-6">Sin reuniones hoy 🎉</p>
            ) : (
              <p className="text-center text-xs text-[var(--muted-foreground)] py-6">Conectá Google para ver tu calendario</p>
            )}
          </div>

          {/* Tareas urgentes */}
          {tareasUrgentes.length > 0 && (
            <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-500" />
                  <span className="font-semibold text-sm">Tareas urgentes</span>
                </div>
                <span className="text-xs font-bold text-red-600">{tareasUrgentes.length}</span>
              </div>
              {tareasUrgentes.slice(0, 5).map(t => {
                const emp = EMPRESAS[t.empresa]
                const vencida = t.fecha_limite ? new Date(t.fecha_limite) < hoy : false
                return (
                  <div key={t.id} className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] last:border-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${emp.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.titulo}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{emp.label}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg shrink-0 ${vencida ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {vencida ? 'Vencida' : t.fecha_limite ? new Date(t.fecha_limite).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) : 'Alta'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Emails importantes */}
          <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-[var(--primary)]" />
                <span className="font-semibold text-sm">Emails sin leer</span>
              </div>
              <button onClick={cargarGmail} className="text-[var(--muted-foreground)] hover:text-[var(--primary)]">
                <RefreshCw size={14} className={loadingMail ? 'animate-spin' : ''} />
              </button>
            </div>
            {loadingMail ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={18} className="animate-spin text-[var(--primary)]" />
              </div>
            ) : emails.length > 0 ? (
              <div className="divide-y divide-[var(--border)]">
                {emails.slice(0, 6).map(e => {
                  const nombre = e.from.replace(/<.*>/, '').trim().replace(/"/g, '')
                  return (
                    <div key={e.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-[var(--muted-foreground)] truncate">{nombre}</p>
                      </div>
                      <p className="text-sm font-medium truncate mt-0.5">{e.subject}</p>
                      <p className="text-xs text-[var(--muted-foreground)] truncate mt-0.5">{e.snippet}</p>
                    </div>
                  )
                })}
                {emails.length > 6 && (
                  <p className="text-center text-xs text-[var(--muted-foreground)] py-3">
                    +{emails.length - 6} más en <a href="/emails" className="text-[var(--primary)] font-semibold">Emails</a>
                  </p>
                )}
              </div>
            ) : googleOk === true ? (
              <p className="text-center text-sm text-[var(--muted-foreground)] py-6">Sin emails importantes 🎉</p>
            ) : (
              <p className="text-center text-xs text-[var(--muted-foreground)] py-6">Conectá Google para ver tus emails</p>
            )}
          </div>

          {/* Resumen empresas */}
          <div className="grid grid-cols-2 gap-3">
            {empresasPermitidas.map(e => {
              const emp = EMPRESAS[e]
              const tareasEmp = tareas.filter(t => t.empresa === e)
              const urgentesEmp = tareasEmp.filter(t => t.prioridad === 'alta').length
              return (
                <div key={e} className="bg-white rounded-2xl border border-[var(--border)] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${emp.dot}`} />
                    <span className="text-xs font-bold">{emp.label}</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-[11px] text-[var(--muted-foreground)]">Tareas</span>
                      <span className="text-xs font-semibold">
                        {urgentesEmp > 0 && <span className="text-red-600 mr-1">⚠ {urgentesEmp}</span>}
                        {tareasEmp.length} total
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

        </div>
      </div>
    </AppShell>
  )
}
