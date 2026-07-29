'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { EMPRESAS } from '@/lib/utils'
import { ArrowLeft, Send, CheckCircle, Circle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Perfil } from '@/lib/types'

const PRIORIDAD_COLOR = {
  alta:  'bg-red-100 text-red-700',
  media: 'bg-amber-100 text-amber-700',
  baja:  'bg-slate-100 text-slate-600',
}

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

export default function BajadaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [bajada, setBajada] = useState<Bajada | null>(null)
  const [gerente, setGerente] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)
  const [cambiandoEstado, setCambiandoEstado] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function cargar() {
      const { data: b } = await supabase.from('bajadas').select('*').eq('id', id).single()
      if (!b) { setLoading(false); return }
      setBajada(b as Bajada)
      const { data: g } = await supabase.from('perfiles').select('*').eq('id', b.gerente_id).single()
      setGerente(g as Perfil)
      setLoading(false)
    }
    cargar()
  }, [id])

  async function cambiarEstado(estado: Bajada['estado']) {
    if (!bajada) return
    setCambiandoEstado(true)
    await supabase.from('bajadas').update({ estado }).eq('id', bajada.id)
    setBajada(prev => prev ? { ...prev, estado } : null)
    setCambiandoEstado(false)
  }

  if (loading) {
    return (
      <AppShell title="Cargando...">
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[var(--primary)]" />
        </div>
      </AppShell>
    )
  }

  if (!bajada) {
    return (
      <AppShell title="No encontrado">
        <div className="p-4 text-center text-[var(--muted-foreground)] py-20">
          <p>Instrucción no encontrada</p>
        </div>
      </AppShell>
    )
  }

  const emp = EMPRESAS[bajada.empresa as keyof typeof EMPRESAS]

  function generarMensajeWA() {
    const pasosStr = (bajada!.pasos ?? []).map((p, i) => `${i + 1}. ${p}`).join('\n')
    return encodeURIComponent(
      `*${emp?.label ?? bajada!.empresa} — ${bajada!.titulo}*\n\n` +
      `${bajada!.descripcion}\n\n` +
      (pasosStr ? `*Pasos a seguir:*\n${pasosStr}\n\n` : '') +
      `_Prioridad: ${bajada!.prioridad.toUpperCase()} · Enviado por Franco_`
    )
  }

  const waLink = gerente?.whatsapp
    ? `https://wa.me/${gerente.whatsapp}?text=${generarMensajeWA()}`
    : null

  return (
    <AppShell
      title={gerente?.nombre ?? 'Gerente'}
      headerRight={
        <button onClick={() => router.back()} className="text-white/80">
          <ArrowLeft size={20} />
        </button>
      }
    >
      <div className="p-4 space-y-4">

        {/* Cabecera */}
        <div className="bg-white rounded-2xl border border-[var(--border)] p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <h2 className="text-base font-bold leading-snug flex-1">{bajada.titulo}</h2>
            <span className={`text-xs font-semibold px-2 py-1 rounded-xl shrink-0 ${PRIORIDAD_COLOR[bajada.prioridad]}`}>
              {bajada.prioridad}
            </span>
          </div>
          {bajada.descripcion && (
            <p className="text-sm text-[var(--muted-foreground)] mb-3">{bajada.descripcion}</p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            {emp && (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${emp.bg} ${emp.text}`}>
                {emp.label}
              </span>
            )}
            {gerente && (
              <span className="text-xs text-[var(--muted-foreground)]">
                Para: <span className="font-semibold text-[var(--foreground)]">{gerente.nombre}</span>
              </span>
            )}
            <span className="text-xs text-[var(--muted-foreground)]">
              {new Date(bajada.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Pasos */}
        {bajada.pasos?.length > 0 && (
          <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <span className="font-semibold text-sm">Pasos a seguir</span>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {bajada.pasos.map((paso, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3">
                  {bajada.estado === 'completado'
                    ? <CheckCircle size={18} className="text-green-500 mt-0.5 shrink-0" />
                    : <Circle size={18} className="text-[var(--border)] mt-0.5 shrink-0" />
                  }
                  <p className={`text-sm ${bajada.estado === 'completado' ? 'line-through text-[var(--muted-foreground)]' : ''}`}>
                    {paso}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estado */}
        <div className="bg-white rounded-2xl border border-[var(--border)] p-4">
          <p className="text-xs font-semibold text-[var(--muted-foreground)] mb-3 uppercase tracking-wide">Estado</p>
          <div className="flex gap-2">
            {(['pendiente', 'en_curso', 'completado'] as const).map((estado) => (
              <button
                key={estado}
                onClick={() => cambiarEstado(estado)}
                disabled={cambiandoEstado}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  bajada.estado === estado
                    ? estado === 'completado' ? 'bg-green-500 text-white'
                    : estado === 'en_curso' ? 'bg-blue-500 text-white'
                    : 'bg-slate-400 text-white'
                    : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                }`}
              >
                {estado === 'en_curso' ? 'En curso' : estado.charAt(0).toUpperCase() + estado.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* WhatsApp */}
        <div className="space-y-2">
          {waLink ? (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-green-500 text-white font-semibold py-3.5 rounded-2xl text-sm"
            >
              <Send size={18} />
              Enviar instrucciones por WhatsApp
            </a>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-center">
              <p className="text-xs text-amber-700 font-medium">
                Agregá el número de WhatsApp del gerente en su perfil para habilitar el envío
              </p>
            </div>
          )}
        </div>

      </div>
    </AppShell>
  )
}
