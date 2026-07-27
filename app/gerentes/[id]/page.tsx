'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { EMPRESAS } from '@/lib/utils'
import { GERENTES, BAJADAS_DEMO } from '@/lib/gerentes'
import { ArrowLeft, Send, CheckCircle, Circle, MessageSquare } from 'lucide-react'

const PRIORIDAD_COLOR = {
  alta:  'bg-red-100 text-red-700',
  media: 'bg-amber-100 text-amber-700',
  baja:  'bg-slate-100 text-slate-600',
}

function generarMensajeWA(bajada: typeof BAJADAS_DEMO[0], gerente: typeof GERENTES[0]) {
  const emp = EMPRESAS[bajada.empresa]
  const pasos = bajada.pasos.map((p, i) => `${i + 1}. ${p}`).join('\n')
  return encodeURIComponent(
    `*${emp.label} — ${bajada.titulo}*\n\n` +
    `${bajada.descripcion}\n\n` +
    `*Pasos a seguir:*\n${pasos}\n\n` +
    `_Prioridad: ${bajada.prioridad.toUpperCase()} · Enviado por Franco_`
  )
}

export default function BajadaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const bajada = BAJADAS_DEMO.find(b => b.id === id)
  const gerente = bajada ? GERENTES.find(g => g.id === bajada.gerenteId) : null

  if (!bajada || !gerente) {
    return (
      <AppShell title="No encontrado">
        <div className="p-4 text-center text-[var(--muted-foreground)] py-20">
          <p>Instrucción no encontrada</p>
        </div>
      </AppShell>
    )
  }

  const emp = EMPRESAS[bajada.empresa]
  const waLink = gerente.whatsapp
    ? `https://wa.me/${gerente.whatsapp}?text=${generarMensajeWA(bajada, gerente)}`
    : null

  return (
    <AppShell
      title={gerente.nombre}
      headerRight={
        <button onClick={() => router.back()} className="text-white/80 text-sm">
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
          <p className="text-sm text-[var(--muted-foreground)] mb-3">{bajada.descripcion}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${emp.bg} ${emp.text}`}>
              {emp.label}
            </span>
            <span className="text-xs text-[var(--muted-foreground)]">
              Para: <span className="font-semibold text-[var(--foreground)]">{gerente.nombre}</span>
            </span>
            <span className="text-xs text-[var(--muted-foreground)]">
              {new Date(bajada.fecha + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Pasos */}
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

        {/* Estado */}
        <div className="bg-white rounded-2xl border border-[var(--border)] p-4">
          <p className="text-xs font-semibold text-[var(--muted-foreground)] mb-3 uppercase tracking-wide">Estado</p>
          <div className="flex gap-2">
            {(['pendiente', 'en_curso', 'completado'] as const).map((estado) => (
              <button
                key={estado}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors capitalize ${
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

        {/* Acciones WhatsApp */}
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
                Agregá el número de WhatsApp de {gerente.nombre} en Configuración para habilitar el envío
              </p>
            </div>
          )}

          <button className="flex items-center justify-center gap-2 w-full bg-white border border-[var(--border)] text-[var(--foreground)] font-semibold py-3.5 rounded-2xl text-sm">
            <MessageSquare size={18} />
            Enviar solo mensaje por WhatsApp
          </button>
        </div>

      </div>
    </AppShell>
  )
}
