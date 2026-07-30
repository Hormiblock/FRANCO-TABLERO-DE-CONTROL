'use client'

import { useState, useEffect, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import { ChevronLeft, ChevronRight, Loader2, ExternalLink } from 'lucide-react'

interface CalEvent {
  id: string
  titulo: string
  inicio: string
  fin: string
  allDay: boolean
  meet: string | null
  lugar: string
  descripcion: string
}

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function formatHora(isoStr: string) {
  try { return new Date(isoStr).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) }
  catch { return '' }
}

function fechaDeEvento(ev: CalEvent): string {
  const str = ev.inicio ?? ''
  if (str.includes('T')) return str.split('T')[0]
  return str
}

export default function CalendarioPage() {
  const hoy = new Date()
  const [mesVista, setMesVista] = useState({ año: hoy.getFullYear(), mes: hoy.getMonth() })
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(toDateStr(hoy))
  const [eventos, setEventos] = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [googleOk, setGoogleOk] = useState<boolean | null>(null)

  const cargar = useCallback(async (año: number, mes: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/google/calendar?year=${año}&month=${mes}`)
      if (res.status === 403) { setGoogleOk(false); setLoading(false); return }
      const data = await res.json()
      setEventos(data.events ?? [])
      setGoogleOk(true)
    } catch { setGoogleOk(false) }
    setLoading(false)
  }, [])

  useEffect(() => {
    cargar(mesVista.año, mesVista.mes)
  }, [mesVista, cargar])

  const primerDia   = new Date(mesVista.año, mesVista.mes, 1)
  const diasEnMes   = new Date(mesVista.año, mesVista.mes + 1, 0).getDate()
  const offsetInicio = primerDia.getDay()

  function mesAnterior() {
    setMesVista(v => v.mes === 0 ? { año: v.año - 1, mes: 11 } : { ...v, mes: v.mes - 1 })
  }
  function mesSiguiente() {
    setMesVista(v => v.mes === 11 ? { año: v.año + 1, mes: 0 } : { ...v, mes: v.mes + 1 })
  }

  function eventosPorDia(dia: number) {
    const fechaStr = `${mesVista.año}-${String(mesVista.mes+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
    return eventos.filter(e => fechaDeEvento(e) === fechaStr)
  }

  const eventosDelDia = diaSeleccionado
    ? eventos.filter(e => fechaDeEvento(e) === diaSeleccionado)
    : eventos

  const hoyStr = toDateStr(hoy)

  return (
    <AppShell title="Calendario">
      <div className="p-4 space-y-4">

        {/* Banner Google desconectado */}
        {googleOk === false && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-amber-800">Conectá tu cuenta Google</p>
              <p className="text-xs text-amber-700 mt-0.5">Para ver tus eventos reales</p>
            </div>
            <a href="/api/auth/google" className="bg-[var(--primary)] text-white text-xs font-semibold px-4 py-2 rounded-xl shrink-0">
              Conectar
            </a>
          </div>
        )}

        {/* Calendario mensual */}
        <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">

          {/* Header mes */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <button onClick={mesAnterior} className="p-1 rounded-lg hover:bg-[var(--muted)]">
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{MESES[mesVista.mes]} {mesVista.año}</span>
              {loading && <Loader2 size={14} className="animate-spin text-[var(--primary)]" />}
            </div>
            <button onClick={mesSiguiente} className="p-1 rounded-lg hover:bg-[var(--muted)]">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Días semana */}
          <div className="grid grid-cols-7 border-b border-[var(--border)]">
            {DIAS_SEMANA.map(d => (
              <div key={d} className="text-center text-[10px] font-semibold text-[var(--muted-foreground)] py-2">{d}</div>
            ))}
          </div>

          {/* Grilla días */}
          <div className="grid grid-cols-7">
            {Array.from({ length: offsetInicio }).map((_, i) => <div key={`e-${i}`} className="h-11" />)}
            {Array.from({ length: diasEnMes }).map((_, i) => {
              const dia = i + 1
              const fechaStr = `${mesVista.año}-${String(mesVista.mes+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
              const evs = eventosPorDia(dia)
              const esHoy = fechaStr === hoyStr
              const seleccionado = diaSeleccionado === fechaStr

              return (
                <button
                  key={dia}
                  onClick={() => setDiaSeleccionado(seleccionado ? null : fechaStr)}
                  className={`h-11 flex flex-col items-center justify-start pt-1 relative transition-colors ${seleccionado ? 'bg-[var(--primary)]/10' : 'hover:bg-[var(--muted)]'}`}
                >
                  <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${esHoy ? 'bg-[var(--primary)] text-white font-bold' : ''}`}>
                    {dia}
                  </span>
                  {evs.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {evs.slice(0, 3).map((_, j) => (
                        <span key={j} className="w-1 h-1 rounded-full bg-[var(--primary)]" />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Lista eventos del día seleccionado */}
        <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <span className="font-semibold text-sm">
              {diaSeleccionado
                ? `Eventos — ${new Date(diaSeleccionado + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}`
                : `Todos los eventos de ${MESES[mesVista.mes]}`
              }
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={20} className="animate-spin text-[var(--primary)]" />
            </div>
          ) : eventosDelDia.length === 0 ? (
            <p className="text-center text-sm text-[var(--muted-foreground)] py-8">
              {googleOk === false ? 'Conectá Google para ver tus eventos' : 'Sin eventos 🎉'}
            </p>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {eventosDelDia
                .sort((a, b) => (a.inicio ?? '').localeCompare(b.inicio ?? ''))
                .map((ev) => (
                  <div key={ev.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-1 h-10 rounded-full bg-[var(--primary)] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{ev.titulo}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {ev.allDay
                          ? 'Todo el día'
                          : `${formatHora(ev.inicio)} – ${formatHora(ev.fin)}`
                        }
                        {ev.lugar ? ` · ${ev.lugar}` : ''}
                      </p>
                    </div>
                    {ev.meet && (
                      <a
                        href={ev.meet}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-[var(--primary)] font-semibold shrink-0"
                      >
                        Meet <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                ))
              }
            </div>
          )}
        </div>

      </div>
    </AppShell>
  )
}
