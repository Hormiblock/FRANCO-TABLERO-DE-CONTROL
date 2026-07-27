'use client'

import { useState } from 'react'
import { EMPRESAS, type Empresa } from '@/lib/utils'
import { GERENTES, type Bajada } from '@/lib/gerentes'
import { X, Plus, Trash2, Send } from 'lucide-react'

interface Props {
  onClose: () => void
  onGuardar: (b: Omit<Bajada, 'id' | 'fecha' | 'enviadoPor'>) => void
}

function generarMensajeWA(titulo: string, descripcion: string, pasos: string[], empresa: Empresa, prioridad: string) {
  const emp = EMPRESAS[empresa]
  const pasosStr = pasos.filter(Boolean).map((p, i) => `${i + 1}. ${p}`).join('\n')
  return encodeURIComponent(
    `*${emp.label} — ${titulo}*\n\n` +
    `${descripcion}\n\n` +
    (pasosStr ? `*Pasos a seguir:*\n${pasosStr}\n\n` : '') +
    `_Prioridad: ${prioridad.toUpperCase()} · Enviado por Franco_`
  )
}

export default function NuevaBajadaModal({ onClose, onGuardar }: Props) {
  const [gerenteId, setGerenteId] = useState(GERENTES[0].id)
  const [empresa, setEmpresa] = useState<Empresa>('hormiblock')
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [pasos, setPasos] = useState(['', '', ''])
  const [prioridad, setPrioridad] = useState<'alta' | 'media' | 'baja'>('media')
  const [guardado, setGuardado] = useState(false)

  const gerente = GERENTES.find(g => g.id === gerenteId)!
  const empresasDelGerente = gerente.empresas

  // Ajustar empresa si cambia el gerente
  function cambiarGerente(id: string) {
    setGerenteId(id)
    const g = GERENTES.find(g => g.id === id)!
    if (!g.empresas.includes(empresa)) setEmpresa(g.empresas[0])
  }

  function guardar(enviarWA = false) {
    if (!titulo.trim()) return
    onGuardar({
      gerenteId,
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      pasos: pasos.filter(p => p.trim()),
      prioridad,
      empresa,
      estado: 'pendiente',
    })
    setGuardado(true)
    if (enviarWA && gerente.whatsapp) {
      const msg = generarMensajeWA(titulo, descripcion, pasos, empresa, prioridad)
      window.open(`https://wa.me/${gerente.whatsapp}?text=${msg}`, '_blank')
    }
    setTimeout(() => onClose(), 800)
  }

  const waMsg = titulo.trim()
    ? generarMensajeWA(titulo, descripcion, pasos, empresa, prioridad)
    : ''

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-lg rounded-t-3xl md:rounded-3xl max-h-[92vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 sticky top-0 bg-white border-b border-[var(--border)] z-10">
          <h2 className="text-base font-bold">Nueva bajada de línea</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-[var(--muted)]">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* Gerente */}
          <div>
            <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-2 block">Gerente</label>
            <div className="flex gap-2">
              {GERENTES.map(g => (
                <button
                  key={g.id}
                  onClick={() => cambiarGerente(g.id)}
                  className={`flex items-center gap-2 flex-1 p-3 rounded-xl border transition-colors ${
                    gerenteId === g.id
                      ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                      : 'border-[var(--border)] bg-white'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {g.avatar}
                  </div>
                  <span className="text-xs font-semibold text-left leading-tight">{g.nombre}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Empresa */}
          <div>
            <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-2 block">Empresa</label>
            <div className="flex gap-2">
              {empresasDelGerente.map(e => {
                const emp = EMPRESAS[e]
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
                    onChange={e => {
                      const nuevos = [...pasos]
                      nuevos[i] = e.target.value
                      setPasos(nuevos)
                    }}
                    placeholder={`Paso ${i + 1}...`}
                    className="flex-1 text-sm border border-[var(--border)] rounded-xl px-3 py-2 focus:outline-none focus:border-[var(--primary)] bg-[var(--muted)]"
                  />
                  {pasos.length > 1 && (
                    <button
                      onClick={() => setPasos(prev => prev.filter((_, j) => j !== i))}
                      className="p-1.5 text-[var(--muted-foreground)] hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setPasos(prev => [...prev, ''])}
                className="flex items-center gap-1.5 text-xs text-[var(--primary)] font-semibold mt-1"
              >
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
                      ? p === 'alta' ? 'bg-red-500 text-white'
                      : p === 'media' ? 'bg-amber-500 text-white'
                      : 'bg-slate-500 text-white'
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
            {gerente.whatsapp ? (
              <a
                href={titulo.trim() ? `https://wa.me/${gerente.whatsapp}?text=${waMsg}` : '#'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => titulo.trim() && guardar(false)}
                className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-sm font-semibold ${
                  titulo.trim() ? 'bg-green-500 text-white' : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                }`}
              >
                <Send size={16} />
                Guardar y enviar por WhatsApp a {gerente.nombre.split(' ')[0]}
              </a>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-center">
                <p className="text-xs text-amber-700">
                  Agregá el número de {gerente.nombre.split(' ')[0]} en Configuración para enviar por WhatsApp
                </p>
              </div>
            )}
            <button
              onClick={() => guardar(false)}
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
