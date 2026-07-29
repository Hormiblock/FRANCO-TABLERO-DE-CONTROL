'use client'

import { useState } from 'react'
import { EMPRESAS, type Empresa } from '@/lib/utils'
import { X, Plus, Trash2, Send } from 'lucide-react'
import type { Perfil } from '@/lib/types'

interface Props {
  onClose: () => void
  gerentes: Perfil[]
  gerenteIdInicial?: string | null
  onGuardar: (b: { titulo: string; descripcion: string; pasos: string[]; prioridad: string; empresa: string; gerenteId: string }) => void
}

const TODAS_EMPRESAS: Empresa[] = ['ostara', 'hormiblock', 'blockera', 'granny']

function generarMensajeWA(titulo: string, descripcion: string, pasos: string[], empresa: string, prioridad: string) {
  const emp = EMPRESAS[empresa as Empresa]
  const pasosStr = pasos.filter(Boolean).map((p, i) => `${i + 1}. ${p}`).join('\n')
  return encodeURIComponent(
    `*${emp?.label ?? empresa} — ${titulo}*\n\n` +
    `${descripcion}\n\n` +
    (pasosStr ? `*Pasos a seguir:*\n${pasosStr}\n\n` : '') +
    `_Prioridad: ${prioridad.toUpperCase()} · Enviado por Franco_`
  )
}

export default function NuevaBajadaModal({ onClose, onGuardar, gerentes, gerenteIdInicial }: Props) {
  const [gerenteId, setGerenteId] = useState(gerenteIdInicial ?? gerentes[0]?.id ?? '')
  const [empresa, setEmpresa] = useState<string>(gerentes[0]?.empresas?.[0] ?? 'ostara')
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [pasos, setPasos] = useState(['', '', ''])
  const [prioridad, setPrioridad] = useState<'alta' | 'media' | 'baja'>('media')
  const [guardado, setGuardado] = useState(false)

  const gerente = gerentes.find(g => g.id === gerenteId)
  const empresasDelGerente = gerente?.empresas?.length ? gerente.empresas : TODAS_EMPRESAS

  function cambiarGerente(id: string) {
    setGerenteId(id)
    const g = gerentes.find(g => g.id === id)
    if (g?.empresas?.length && !g.empresas.includes(empresa as Empresa)) {
      setEmpresa(g.empresas[0])
    }
  }

  function guardar() {
    if (!titulo.trim()) return
    onGuardar({
      gerenteId,
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      pasos: pasos.filter(p => p.trim()),
      prioridad,
      empresa,
    })
    setGuardado(true)
    setTimeout(() => onClose(), 800)
  }

  function guardarYEnviarWA() {
    if (!titulo.trim() || !gerente?.whatsapp) return
    guardar()
    const msg = generarMensajeWA(titulo, descripcion, pasos, empresa, prioridad)
    window.open(`https://wa.me/${gerente.whatsapp}?text=${msg}`, '_blank')
  }

  const waMsg = titulo.trim() ? generarMensajeWA(titulo, descripcion, pasos, empresa, prioridad) : ''

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-t-3xl md:rounded-3xl max-h-[92vh] overflow-y-auto">

        <div className="flex items-center justify-between px-5 pt-5 pb-3 sticky top-0 bg-white border-b border-[var(--border)] z-10">
          <h2 className="text-base font-bold">Nueva bajada de línea</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-[var(--muted)]">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* Gerente */}
          {gerentes.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-2 block">Gerente</label>
              <div className="flex gap-2 flex-wrap">
                {gerentes.map(g => (
                  <button
                    key={g.id}
                    onClick={() => cambiarGerente(g.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors ${
                      gerenteId === g.id ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-[var(--border)] bg-white'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {g.nombre?.split(' ').map((n: string) => n[0]).slice(0, 2).join('') ?? 'G'}
                    </div>
                    <span className="text-xs font-semibold">{g.nombre?.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empresa */}
          <div>
            <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-2 block">Empresa</label>
            <div className="flex gap-2 flex-wrap">
              {empresasDelGerente.map(e => {
                const emp = EMPRESAS[e as Empresa]
                if (!emp) return null
                return (
                  <button
                    key={e}
                    onClick={() => setEmpresa(e)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      empresa === e ? `${emp.bg} ${emp.text}` : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${emp.dot}`} />
                    {emp.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Título */}
          <div>
            <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-2 block">Título</label>
            <input
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ej: Preparar documentación licitación..."
              className="w-full text-sm border border-[var(--border)] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[var(--primary)] bg-[var(--muted)]"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-2 block">Descripción</label>
            <textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Contexto, detalles importantes..."
              className="w-full text-sm border border-[var(--border)] rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:border-[var(--primary)] bg-[var(--muted)] min-h-[70px]"
            />
          </div>

          {/* Pasos */}
          <div>
            <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-2 block">Pasos a seguir</label>
            <div className="space-y-2">
              {pasos.map((paso, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--muted-foreground)] w-4">{i + 1}.</span>
                  <input
                    value={paso}
                    onChange={e => { const n = [...pasos]; n[i] = e.target.value; setPasos(n) }}
                    placeholder={`Paso ${i + 1}...`}
                    className="flex-1 text-sm border border-[var(--border)] rounded-xl px-3 py-2 focus:outline-none focus:border-[var(--primary)] bg-[var(--muted)]"
                  />
                  {pasos.length > 1 && (
                    <button onClick={() => setPasos(prev => prev.filter((_, j) => j !== i))} className="p-1.5 text-[var(--muted-foreground)] hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={() => setPasos(prev => [...prev, ''])} className="flex items-center gap-1.5 text-xs text-[var(--primary)] font-semibold mt-1">
                <Plus size={13} /> Agregar paso
              </button>
            </div>
          </div>

          {/* Prioridad */}
          <div>
            <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-2 block">Prioridad</label>
            <div className="flex gap-2">
              {(['alta', 'media', 'baja'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPrioridad(p)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${
                    prioridad === p
                      ? p === 'alta' ? 'bg-red-500 text-white' : p === 'media' ? 'bg-amber-500 text-white' : 'bg-slate-500 text-white'
                      : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Botones */}
          <div className="space-y-2 pt-2">
            {gerente?.whatsapp ? (
              <button
                onClick={guardarYEnviarWA}
                disabled={!titulo.trim()}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-sm font-semibold bg-green-500 text-white disabled:opacity-40"
              >
                <Send size={16} />
                Guardar y enviar por WhatsApp a {gerente.nombre?.split(' ')[0]}
              </button>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-center">
                <p className="text-xs text-amber-700">
                  Agregá el número de WhatsApp del gerente en su perfil para poder enviarle mensajes
                </p>
              </div>
            )}
            <button
              onClick={guardar}
              disabled={!titulo.trim()}
              className="flex items-center justify-center gap-2 w-full bg-[var(--primary)] text-white font-semibold py-3.5 rounded-2xl text-sm disabled:opacity-40"
            >
              {guardado ? '✓ Guardado' : 'Guardar sin enviar'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
