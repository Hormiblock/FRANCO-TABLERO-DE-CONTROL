'use client'

import { useState, useEffect, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import { ChevronLeft, ChevronRight, Loader2, ExternalLink, Plus, X, Video } from 'lucide-react'

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

const DIAS_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function formatHora(isoStr: string) {
  try { return new Date(isoStr).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' }) }
  catch { return '' }
}

function fechaDeEvento(ev: CalEvent): string {
  const str = ev.inicio ?? ''
  return str.includes('T') ? str.split('T')[0] : str
}

function getInicioSemana(fecha: Date) {
  const d = new Date(fecha)
  d.setDate(d.getDate() - d.getDay())
  d.setHours(0, 0, 0, 0)
  return d
}

type Vista = 'mes' | 'semana'

export default function CalendarioPage() {
  const hoy = new Date()
  const hoyStr = toDateStr(hoy)

  const [vista, setVista] = useState<Vista>('semana')
  const [mesVista, setMesVista] = useState({ año: hoy.getFullYear(), mes: hoy.getMonth() })
  const [semanaBase, setSemanaBase] = useState<Date>(getInicioSemana(hoy))
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(hoyStr)
  const [eventos, setEventos] = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [googleOk, setGoogleOk] = useState<boolean | null>(null)
  const [modal, setModal] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [form, setForm] = useState({
    titulo: '', fecha: hoyStr, horaInicio: '09:00', horaFin: '10:00',
    descripcion: '', lugar: '', conMeet: false, allDay: false,
  })

  // Días de la semana actual
  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(semanaBase)
    d.setDate(semanaBase.getDate() + i)
    return d
  })

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

  useEffect(() => { cargar(mesVista.año, mesVista.mes) }, [mesVista, cargar])

  // Al navegar semana, cargar mes si cambia
  useEffect(() => {
    const mes = semanaBase.getMonth()
    const año = semanaBase.getFullYear()
    if (mes !== mesVista.mes || año !== mesVista.año) {
      setMesVista({ año, mes })
    }
  }, [semanaBase])

  function anteriorMes() { setMesVista(v => v.mes === 0 ? { año: v.año-1, mes: 11 } : { ...v, mes: v.mes-1 }) }
  function siguienteMes() { setMesVista(v => v.mes === 11 ? { año: v.año+1, mes: 0 } : { ...v, mes: v.mes+1 }) }
  function anteriorSemana() { setSemanaBase(d => { const n = new Date(d); n.setDate(n.getDate()-7); return n }) }
  function siguienteSemana() { setSemanaBase(d => { const n = new Date(d); n.setDate(n.getDate()+7); return n }) }

  function abrirModal() {
    setForm(f => ({ ...f, fecha: diaSeleccionado ?? hoyStr }))
    setModal(true)
  }

  async function crearEvento() {
    if (!form.titulo.trim()) return
    setGuardando(true)
    try {
      const res = await fetch('/api/google/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const nuevo = await res.json()
        setEventos(prev => [...prev, { ...nuevo, allDay: form.allDay, descripcion: form.descripcion, lugar: form.lugar }])
        setModal(false)
        setForm(f => ({ ...f, titulo: '', descripcion: '', lugar: '', conMeet: false }))
      }
    } catch {}
    setGuardando(false)
  }

  // Vista mes
  const primerDia    = new Date(mesVista.año, mesVista.mes, 1)
  const diasEnMes    = new Date(mesVista.año, mesVista.mes + 1, 0).getDate()
  const offsetInicio = primerDia.getDay()

  function eventosPorFecha(fechaStr: string) {
    return eventos.filter(e => fechaDeEvento(e) === fechaStr)
  }

  const eventosDelDia = diaSeleccionado
    ? eventos.filter(e => fechaDeEvento(e) === diaSeleccionado).sort((a,b) => (a.inicio??'').localeCompare(b.inicio??''))
    : []

  // Label semana
  const inicioLabel = diasSemana[0]
  const finLabel    = diasSemana[6]
  const labelSemana = inicioLabel.getMonth() === finLabel.getMonth()
    ? `${inicioLabel.getDate()} al ${finLabel.getDate()} de ${MESES[finLabel.getMonth()]}`
    : `${inicioLabel.getDate()} ${MESES[inicioLabel.getMonth()].slice(0,3)} — ${finLabel.getDate()} ${MESES[finLabel.getMonth()].slice(0,3)}`

  return (
    <AppShell
      title="Calendario"
      headerRight={
        <button onClick={abrirModal} className="flex items-center gap-1.5 bg-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-xl">
          <Plus size={14} /> Nuevo evento
        </button>
      }
    >
      <div className="p-4 space-y-4">

        {/* Banner Google */}
        {googleOk === false && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-amber-800">Conectá tu cuenta Google</p>
              <p className="text-xs text-amber-700 mt-0.5">Para ver y crear eventos reales</p>
            </div>
            <a href="/api/auth/google" className="bg-[var(--primary)] text-white text-xs font-semibold px-4 py-2 rounded-xl shrink-0">Conectar</a>
          </div>
        )}

        {/* Toggle vista */}
        <div className="flex bg-[var(--muted)] rounded-xl p-1 gap-1">
          {(['semana', 'mes'] as Vista[]).map(v => (
            <button
              key={v}
              onClick={() => setVista(v)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${
                vista === v ? 'bg-white text-[var(--foreground)] shadow-sm' : 'text-[var(--muted-foreground)]'
              }`}
            >
              {v === 'semana' ? 'Semana' : 'Mes'}
            </button>
          ))}
        </div>

        {/* ── VISTA SEMANA ── */}
        {vista === 'semana' && (
          <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
            {/* Navegación semana */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <button onClick={anteriorSemana} className="p-1 rounded-lg hover:bg-[var(--muted)]"><ChevronLeft size={18} /></button>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{labelSemana}</span>
                {loading && <Loader2 size={14} className="animate-spin text-[var(--primary)]" />}
              </div>
              <button onClick={siguienteSemana} className="p-1 rounded-lg hover:bg-[var(--muted)]"><ChevronRight size={18} /></button>
            </div>

            {/* Fila días */}
            <div className="grid grid-cols-7 border-b border-[var(--border)]">
              {diasSemana.map(d => {
                const str = toDateStr(d)
                const esHoy = str === hoyStr
                const seleccionado = diaSeleccionado === str
                const tieneEvs = eventosPorFecha(str).length > 0
                return (
                  <button
                    key={str}
                    onClick={() => setDiaSeleccionado(seleccionado ? null : str)}
                    className={`flex flex-col items-center py-2 transition-colors ${seleccionado ? 'bg-[var(--primary)]/10' : 'hover:bg-[var(--muted)]'}`}
                  >
                    <span className="text-[10px] font-medium text-[var(--muted-foreground)]">{DIAS_CORTO[d.getDay()]}</span>
                    <span className={`text-sm font-bold mt-0.5 w-7 h-7 flex items-center justify-center rounded-full ${esHoy ? 'bg-[var(--primary)] text-white' : ''}`}>
                      {d.getDate()}
                    </span>
                    <div className="h-1.5 mt-0.5">
                      {tieneEvs && <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]/70 block" />}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Eventos del día seleccionado */}
            {diaSeleccionado && eventosPorFecha(diaSeleccionado).length === 0 && !loading && (
              <div className="text-center py-6">
                <p className="text-sm text-[var(--muted-foreground)]">Sin eventos</p>
                {googleOk === true && (
                  <button onClick={abrirModal} className="mt-1 text-xs text-[var(--primary)] font-semibold">+ Crear evento</button>
                )}
              </div>
            )}

            {diaSeleccionado && eventosPorFecha(diaSeleccionado).map(ev => (
              <div key={ev.id} className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] last:border-0">
                <div className="w-1 h-10 rounded-full bg-[var(--primary)] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{ev.titulo}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {ev.allDay ? 'Todo el día' : `${formatHora(ev.inicio)} – ${formatHora(ev.fin)}`}
                    {ev.lugar ? ` · ${ev.lugar}` : ''}
                  </p>
                </div>
                {ev.meet && (
                  <a href={ev.meet} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-[var(--primary)] font-semibold shrink-0">
                    Meet <ExternalLink size={10} />
                  </a>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={18} className="animate-spin text-[var(--primary)]" />
              </div>
            )}
          </div>
        )}

        {/* ── VISTA MES ── */}
        {vista === 'mes' && (
          <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <button onClick={anteriorMes} className="p-1 rounded-lg hover:bg-[var(--muted)]"><ChevronLeft size={18} /></button>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{MESES[mesVista.mes]} {mesVista.año}</span>
                {loading && <Loader2 size={14} className="animate-spin text-[var(--primary)]" />}
              </div>
              <button onClick={siguienteMes} className="p-1 rounded-lg hover:bg-[var(--muted)]"><ChevronRight size={18} /></button>
            </div>

            <div className="grid grid-cols-7 border-b border-[var(--border)]">
              {DIAS_CORTO.map(d => (
                <div key={d} className="text-center text-[10px] font-semibold text-[var(--muted-foreground)] py-2">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {Array.from({ length: offsetInicio }).map((_, i) => <div key={`e-${i}`} className="h-11" />)}
              {Array.from({ length: diasEnMes }).map((_, i) => {
                const dia = i + 1
                const fechaStr = `${mesVista.año}-${String(mesVista.mes+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
                const evs = eventosPorFecha(fechaStr)
                const esHoy = fechaStr === hoyStr
                const seleccionado = diaSeleccionado === fechaStr
                return (
                  <button
                    key={dia}
                    onClick={() => setDiaSeleccionado(seleccionado ? null : fechaStr)}
                    className={`h-11 flex flex-col items-center justify-start pt-1 transition-colors ${seleccionado ? 'bg-[var(--primary)]/10' : 'hover:bg-[var(--muted)]'}`}
                  >
                    <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${esHoy ? 'bg-[var(--primary)] text-white font-bold' : ''}`}>
                      {dia}
                    </span>
                    {evs.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5">
                        {evs.slice(0,3).map((_,j) => <span key={j} className="w-1 h-1 rounded-full bg-[var(--primary)]" />)}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Eventos del día seleccionado */}
            {diaSeleccionado && (
              <div className="border-t border-[var(--border)]">
                <div className="px-4 py-2.5 flex items-center justify-between border-b border-[var(--border)] bg-[var(--muted)]/50">
                  <span className="text-xs font-semibold text-[var(--muted-foreground)]">
                    {new Date(diaSeleccionado+'T00:00:00').toLocaleDateString('es-AR', { weekday:'long', day:'numeric', month:'long' })}
                  </span>
                  {googleOk === true && (
                    <button onClick={abrirModal} className="text-[var(--primary)] text-xs font-semibold flex items-center gap-1">
                      <Plus size={12} /> Agregar
                    </button>
                  )}
                </div>
                {eventosDelDia.length === 0 ? (
                  <p className="text-center text-sm text-[var(--muted-foreground)] py-5">Sin eventos</p>
                ) : eventosDelDia.map(ev => (
                  <div key={ev.id} className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] last:border-0">
                    <div className="w-1 h-8 rounded-full bg-[var(--primary)] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{ev.titulo}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {ev.allDay ? 'Todo el día' : `${formatHora(ev.inicio)} – ${formatHora(ev.fin)}`}
                      </p>
                    </div>
                    {ev.meet && (
                      <a href={ev.meet} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-[var(--primary)] font-semibold shrink-0">
                        Meet <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Modal nuevo evento */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setModal(false)}>
          <div className="bg-white w-full rounded-t-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="font-bold text-lg">Nuevo evento</p>
              <button onClick={() => setModal(false)}><X size={20} /></button>
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--muted-foreground)] mb-1 block">Título *</label>
              <input autoFocus className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--primary)]"
                placeholder="Ej: Reunión con proveedor" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Todo el día</label>
              <button onClick={() => setForm(f => ({ ...f, allDay: !f.allDay }))}
                className={`w-11 h-6 rounded-full transition-colors ${form.allDay ? 'bg-[var(--primary)]' : 'bg-slate-200'}`}>
                <span className={`block w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${form.allDay ? 'translate-x-5' : ''}`} />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--muted-foreground)] mb-1 block">Fecha *</label>
              <input type="date" className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--primary)]"
                value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
            </div>

            {!form.allDay && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--muted-foreground)] mb-1 block">Desde</label>
                  <input type="time" className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--primary)]"
                    value={form.horaInicio} onChange={e => setForm(f => ({ ...f, horaInicio: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--muted-foreground)] mb-1 block">Hasta</label>
                  <input type="time" className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--primary)]"
                    value={form.horaFin} onChange={e => setForm(f => ({ ...f, horaFin: e.target.value }))} />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-[var(--muted-foreground)] mb-1 block">Lugar (opcional)</label>
              <input className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--primary)]"
                placeholder="Ej: Oficina Hormiblock, Zoom..." value={form.lugar} onChange={e => setForm(f => ({ ...f, lugar: e.target.value }))} />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--muted-foreground)] mb-1 block">Descripción (opcional)</label>
              <textarea className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-[var(--primary)]"
                rows={2} placeholder="Agenda, notas..." value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
            </div>

            <div className="flex items-center justify-between bg-[var(--muted)] rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Video size={16} className="text-[var(--primary)]" />
                <div>
                  <p className="text-sm font-medium">Agregar Google Meet</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Se genera el link automáticamente</p>
                </div>
              </div>
              <button onClick={() => setForm(f => ({ ...f, conMeet: !f.conMeet }))}
                className={`w-11 h-6 rounded-full transition-colors ${form.conMeet ? 'bg-[var(--primary)]' : 'bg-slate-200'}`}>
                <span className={`block w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${form.conMeet ? 'translate-x-5' : ''}`} />
              </button>
            </div>

            <button onClick={crearEvento} disabled={!form.titulo.trim() || !form.fecha || guardando}
              className="w-full bg-[var(--primary)] text-white font-semibold py-3.5 rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2">
              {guardando && <Loader2 size={16} className="animate-spin" />}
              Crear evento en Google Calendar
            </button>
          </div>
        </div>
      )}
    </AppShell>
  )
}
