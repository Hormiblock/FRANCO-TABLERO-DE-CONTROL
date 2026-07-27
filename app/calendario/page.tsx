'use client'

import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { EMPRESAS, type Empresa } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'

const EVENTOS_DEMO = [
  { id: '1', titulo: 'Stand-up Ostara',             empresa: 'ostara' as Empresa,     fecha: '2026-07-07', hora: '09:00', tipo: 'reunion' },
  { id: '2', titulo: 'Envío propuesta TOYOTA',       empresa: 'ostara' as Empresa,     fecha: '2026-07-07', hora: '12:00', tipo: 'deadline' },
  { id: '3', titulo: 'Reunión proveedor cemento',    empresa: 'hormiblock' as Empresa, fecha: '2026-07-08', hora: '11:00', tipo: 'reunion' },
  { id: '4', titulo: 'Cierre licitación Municipal',  empresa: 'blockera' as Empresa,   fecha: '2026-07-09', hora: '17:00', tipo: 'deadline' },
  { id: '5', titulo: 'Lanzamiento IVECO',            empresa: 'ostara' as Empresa,     fecha: '2026-07-10', hora: '19:00', tipo: 'evento' },
  { id: '6', titulo: 'Revisión cultivos Granny',     empresa: 'granny' as Empresa,     fecha: '2026-07-11', hora: '08:00', tipo: 'visita' },
  { id: '7', titulo: 'Reunión contador',             empresa: 'granny' as Empresa,     fecha: '2026-07-14', hora: '10:00', tipo: 'reunion' },
  { id: '8', titulo: 'Cierre licitación Ruta 7',     empresa: 'hormiblock' as Empresa, fecha: '2026-07-15', hora: '18:00', tipo: 'deadline' },
  { id: '9', titulo: 'Feria Construir 2026',         empresa: 'ostara' as Empresa,     fecha: '2026-07-20', hora: '10:00', tipo: 'evento' },
]

const TIPO_ICON: Record<string, string> = {
  reunion: '🤝',
  deadline: '⚠️',
  evento: '🎯',
  visita: '📍',
}

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function CalendarioPage() {
  const hoy = new Date()
  const [mesVista, setMesVista] = useState({ año: hoy.getFullYear(), mes: hoy.getMonth() })
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null)
  const [filtroEmpresa, setFiltroEmpresa] = useState<Empresa | 'todas'>('todas')

  const primerDia = new Date(mesVista.año, mesVista.mes, 1)
  const diasEnMes = new Date(mesVista.año, mesVista.mes + 1, 0).getDate()
  const offsetInicio = primerDia.getDay()

  const mesAnterior = () => setMesVista(v => {
    if (v.mes === 0) return { año: v.año - 1, mes: 11 }
    return { ...v, mes: v.mes - 1 }
  })
  const mesSiguiente = () => setMesVista(v => {
    if (v.mes === 11) return { año: v.año + 1, mes: 0 }
    return { ...v, mes: v.mes + 1 }
  })

  const eventosDelMes = EVENTOS_DEMO.filter(e => {
    const fecha = new Date(e.fecha)
    return fecha.getFullYear() === mesVista.año && fecha.getMonth() === mesVista.mes
      && (filtroEmpresa === 'todas' || e.empresa === filtroEmpresa)
  })

  const eventosPorDia = (dia: number) => {
    const fechaStr = `${mesVista.año}-${String(mesVista.mes + 1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
    return eventosDelMes.filter(e => e.fecha === fechaStr)
  }

  const eventosDelDia = diaSeleccionado
    ? EVENTOS_DEMO.filter(e => e.fecha === diaSeleccionado && (filtroEmpresa === 'todas' || e.empresa === filtroEmpresa))
    : eventosDelMes.sort((a, b) => a.fecha.localeCompare(b.fecha))

  return (
    <AppShell
      title="Calendario"
      headerRight={
        <button className="flex items-center gap-1.5 bg-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-xl">
          <Plus size={14} /> Nuevo evento
        </button>
      }
    >
      <div className="p-4 space-y-4">

        {/* Filtro empresa */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['todas', 'ostara', 'hormiblock', 'blockera', 'granny'] as const).map((e) => {
            const emp = e === 'todas' ? null : EMPRESAS[e]
            const activo = filtroEmpresa === e
            return (
              <button
                key={e}
                onClick={() => setFiltroEmpresa(e)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                  activo
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-white border border-[var(--border)] text-[var(--muted-foreground)]'
                }`}
              >
                {emp && <span className={`w-2 h-2 rounded-full ${emp.dot}`} />}
                {e === 'todas' ? 'Todas' : emp!.label}
              </button>
            )
          })}
        </div>

        {/* Calendaria mensual */}
        <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
          {/* Header mes */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <button onClick={mesAnterior} className="p-1 rounded-lg hover:bg-[var(--muted)]">
              <ChevronLeft size={18} />
            </button>
            <span className="font-semibold text-sm">
              {MESES[mesVista.mes]} {mesVista.año}
            </span>
            <button onClick={mesSiguiente} className="p-1 rounded-lg hover:bg-[var(--muted)]">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Días semana */}
          <div className="grid grid-cols-7 border-b border-[var(--border)]">
            {DIAS_SEMANA.map(d => (
              <div key={d} className="text-center text-[10px] font-semibold text-[var(--muted-foreground)] py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Grilla de días */}
          <div className="grid grid-cols-7">
            {Array.from({ length: offsetInicio }).map((_, i) => (
              <div key={`empty-${i}`} className="h-10" />
            ))}
            {Array.from({ length: diasEnMes }).map((_, i) => {
              const dia = i + 1
              const fechaStr = `${mesVista.año}-${String(mesVista.mes + 1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
              const eventos = eventosPorDia(dia)
              const esHoy = dia === hoy.getDate() && mesVista.mes === hoy.getMonth() && mesVista.año === hoy.getFullYear()
              const seleccionado = diaSeleccionado === fechaStr

              return (
                <button
                  key={dia}
                  onClick={() => setDiaSeleccionado(seleccionado ? null : fechaStr)}
                  className={`h-10 flex flex-col items-center justify-start pt-1 relative transition-colors ${
                    seleccionado ? 'bg-[var(--primary)]/10' : 'hover:bg-[var(--muted)]'
                  }`}
                >
                  <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                    esHoy ? 'bg-[var(--primary)] text-white' : ''
                  }`}>
                    {dia}
                  </span>
                  {eventos.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {eventos.slice(0, 3).map((e, i) => (
                        <span key={i} className={`w-1 h-1 rounded-full ${EMPRESAS[e.empresa].dot}`} />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Lista de eventos */}
        <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <span className="font-semibold text-sm">
              {diaSeleccionado
                ? `Eventos del ${new Date(diaSeleccionado + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}`
                : 'Todos los eventos del mes'
              }
            </span>
          </div>
          {eventosDelDia.length === 0 && (
            <p className="text-center text-sm text-[var(--muted-foreground)] py-8">Sin eventos</p>
          )}
          {eventosDelDia.map((ev) => {
            const emp = EMPRESAS[ev.empresa]
            return (
              <div key={ev.id} className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] last:border-0">
                <div className={`w-1 self-stretch rounded-full ${emp.dot}`} />
                <div className="text-lg">{TIPO_ICON[ev.tipo]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{ev.titulo}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {emp.label} · {new Date(ev.fecha + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <span className="text-xs font-semibold text-[var(--muted-foreground)]">{ev.hora}</span>
              </div>
            )
          })}
        </div>

      </div>
    </AppShell>
  )
}
