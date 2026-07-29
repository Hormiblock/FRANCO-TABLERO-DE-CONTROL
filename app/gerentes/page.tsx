'use client'

import { useState, useEffect, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import { EMPRESAS } from '@/lib/utils'
import { Plus, ChevronRight, CheckCircle, Clock, AlertCircle, Send, Loader2 } from 'lucide-react'
import Link from 'next/link'
import NuevaBajadaModal from '@/components/gerentes/NuevaBajadaModal'
import { createClient } from '@/lib/supabase/client'
import type { Perfil, Tarea } from '@/lib/types'

interface Bajada {
  id: string
  gerente_id: string
  titulo: string
  descripcion: string
  pasos: string[]
  prioridad: 'alta' | 'media' | 'baja'
  empresa: string
  estado: 'pendiente' | 'en_curso' | 'completado'
  enviado_por: string
  created_at: string
}

const ESTADO_CONFIG = {
  pendiente:  { label: 'Pendiente',  color: 'bg-slate-100 text-slate-600',  icon: Clock       },
  en_curso:   { label: 'En curso',   color: 'bg-blue-100 text-blue-700',    icon: AlertCircle },
  completado: { label: 'Completado', color: 'bg-green-100 text-green-700',  icon: CheckCircle },
}

const PRIORIDAD_COLOR = {
  alta:  'bg-red-100 text-red-700',
  media: 'bg-amber-100 text-amber-700',
  baja:  'bg-slate-100 text-slate-600',
}

export default function GerentesPage() {
  const [modalAbierto, setModalAbierto] = useState(false)
  const [gerentes, setGerentes] = useState<Perfil[]>([])
  const [bajadas, setBajadas] = useState<Bajada[]>([])
  const [loading, setLoading] = useState(true)
  const [gerenteSeleccionado, setGerenteSeleccionado] = useState<string | null>(null)

  const supabase = createClient()

  const cargar = useCallback(async () => {
    setLoading(true)
    const [{ data: perfiles }, { data: bajData }] = await Promise.all([
      supabase.from('perfiles').select('*').eq('rol', 'gerente'),
      supabase.from('bajadas').select('*').order('created_at', { ascending: false }),
    ])
    setGerentes((perfiles as Perfil[]) ?? [])
    setBajadas((bajData as Bajada[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  async function agregarBajada(b: { titulo: string; descripcion: string; pasos: string[]; prioridad: string; empresa: string; gerenteId: string }) {
    await supabase.from('bajadas').insert({
      gerente_id: b.gerenteId,
      titulo: b.titulo,
      descripcion: b.descripcion,
      pasos: b.pasos,
      prioridad: b.prioridad,
      empresa: b.empresa,
      estado: 'pendiente',
      enviado_por: 'ninguno',
    })
    cargar()
  }

  return (
    <AppShell
      title="Gerentes"
      headerRight={
        <button
          onClick={() => setModalAbierto(true)}
          className="flex items-center gap-1.5 bg-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-xl"
        >
          <Plus size={14} /> Nueva bajada
        </button>
      }
    >
      <div className="p-4 space-y-5">

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-[var(--primary)]" />
          </div>
        ) : gerentes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[var(--border)] p-6 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">No hay gerentes registrados</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">Los usuarios con rol "gerente" aparecen aquí</p>
          </div>
        ) : gerentes.map((gerente) => {
          const bajadasGerente = bajadas.filter(b => b.gerente_id === gerente.id)
          const pendientes = bajadasGerente.filter(b => b.estado !== 'completado').length
          const completadas = bajadasGerente.filter(b => b.estado === 'completado').length

          return (
            <div key={gerente.id} className="space-y-3">
              <div className="bg-white rounded-2xl border border-[var(--border)] p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {gerente.nombre?.split(' ').map((n: string) => n[0]).slice(0, 2).join('') ?? 'G'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-base">{gerente.nombre}</p>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      {(gerente.empresas ?? []).map((e: string) => {
                        const emp = EMPRESAS[e as keyof typeof EMPRESAS]
                        if (!emp) return null
                        return (
                          <span key={e} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${emp.bg} ${emp.text}`}>
                            {emp.label}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-bold text-[var(--primary)]">{pendientes}</p>
                    <p className="text-[10px] text-[var(--muted-foreground)]">pendiente{pendientes !== 1 ? 's' : ''}</p>
                  </div>
                </div>

                <div className="flex gap-2 mt-3 pt-3 border-t border-[var(--border)]">
                  <button
                    onClick={() => { setGerenteSeleccionado(gerente.id); setModalAbierto(true) }}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-[var(--primary)] text-white text-xs font-semibold py-2 rounded-xl"
                  >
                    <Plus size={13} /> Bajar línea
                  </button>
                  {gerente.whatsapp ? (
                    <a
                      href={`https://wa.me/${gerente.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 bg-green-500 text-white text-xs font-semibold py-2 rounded-xl"
                    >
                      <Send size={13} /> WhatsApp
                    </a>
                  ) : (
                    <button disabled className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 text-slate-400 text-xs font-semibold py-2 rounded-xl">
                      <Send size={13} /> WhatsApp
                    </button>
                  )}
                </div>
              </div>

              {bajadasGerente.length > 0 && (
                <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-[var(--border)] flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">Instrucciones enviadas</span>
                    <span className="text-xs text-[var(--muted-foreground)]">{completadas}/{bajadasGerente.length} completadas</span>
                  </div>
                  {bajadasGerente.map((b) => {
                    const estadoCfg = ESTADO_CONFIG[b.estado]
                    const EIcon = estadoCfg.icon
                    const emp = EMPRESAS[b.empresa as keyof typeof EMPRESAS]
                    return (
                      <Link key={b.id} href={`/gerentes/${b.id}`}>
                        <div className={`flex items-start gap-3 px-4 py-3 border-b border-[var(--border)] last:border-0 active:bg-[var(--muted)] transition-colors ${b.estado === 'completado' ? 'opacity-60' : ''}`}>
                          <EIcon size={16} className={`mt-0.5 shrink-0 ${b.estado === 'completado' ? 'text-green-500' : b.estado === 'en_curso' ? 'text-blue-500' : 'text-slate-400'}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${b.estado === 'completado' ? 'line-through' : ''}`}>
                              {b.titulo}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {emp && <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${emp.bg} ${emp.text}`}>{emp.label}</span>}
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${PRIORIDAD_COLOR[b.prioridad]}`}>{b.prioridad}</span>
                              <span className="text-[10px] text-[var(--muted-foreground)]">
                                {new Date(b.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                              </span>
                              {b.enviado_por === 'whatsapp' && <span className="text-[10px] text-green-600 font-medium">✓ WA</span>}
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-[var(--muted-foreground)] mt-1 shrink-0" />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {modalAbierto && (
        <NuevaBajadaModal
          gerenteIdInicial={gerenteSeleccionado}
          gerentes={gerentes}
          onClose={() => { setModalAbierto(false); setGerenteSeleccionado(null) }}
          onGuardar={agregarBajada}
        />
      )}
    </AppShell>
  )
}
