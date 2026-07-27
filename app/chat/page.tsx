'use client'

import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { EMPRESAS, type Empresa } from '@/lib/utils'
import { Send, CheckCircle } from 'lucide-react'

const EMPRESAS_LIST = ['ostara', 'hormiblock', 'blockera', 'granny'] as Empresa[]

const HISTORIAL_DEMO = [
  { id: '1', texto: 'Llamar a proveedor de sillas para el evento IVECO', empresa: 'ostara' as Empresa,     prioridad: 'alta',  creado: 'Hoy 09:15' },
  { id: '2', texto: 'Pedir cotización arena lavada', empresa: 'blockera' as Empresa,   prioridad: 'media', creado: 'Hoy 08:40' },
  { id: '3', texto: 'Verificar estado de la soja en lote 3', empresa: 'granny' as Empresa,     prioridad: 'baja',  creado: 'Ayer 17:30' },
]

export default function ChatPage() {
  const [texto, setTexto] = useState('')
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<Empresa>('ostara')
  const [prioridad, setPrioridad] = useState<'alta' | 'media' | 'baja'>('media')
  const [historial, setHistorial] = useState(HISTORIAL_DEMO)
  const [enviado, setEnviado] = useState(false)

  function enviar() {
    if (!texto.trim()) return
    setHistorial(prev => [{
      id: Date.now().toString(),
      texto: texto.trim(),
      empresa: empresaSeleccionada,
      prioridad,
      creado: 'Ahora',
    }, ...prev])
    setTexto('')
    setEnviado(true)
    setTimeout(() => setEnviado(false), 2000)
  }

  return (
    <AppShell title="Asignar pendiente">
      <div className="p-4 space-y-4">

        {/* Formulario rápido */}
        <div className="bg-white rounded-2xl border border-[var(--border)] p-4 space-y-3">
          <p className="text-sm font-semibold text-[var(--foreground)]">Nueva tarea rápida</p>

          {/* Textarea */}
          <textarea
            value={texto}
            onChange={e => setTexto(e.target.value)}
            placeholder="Escribí el pendiente acá... ej: Llamar a proveedor de sillas para el evento IVECO"
            className="w-full text-sm border border-[var(--border)] rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:border-[var(--primary)] bg-[var(--muted)] min-h-[80px]"
            onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) enviar() }}
          />

          {/* Selector empresa */}
          <div>
            <p className="text-xs text-[var(--muted-foreground)] mb-2">Empresa</p>
            <div className="flex gap-2 flex-wrap">
              {EMPRESAS_LIST.map((e) => {
                const emp = EMPRESAS[e]
                const activo = empresaSeleccionada === e
                return (
                  <button
                    key={e}
                    onClick={() => setEmpresaSeleccionada(e)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                      activo ? `${emp.bg} ${emp.text} font-bold` : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${emp.dot}`} />
                    {emp.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Prioridad */}
          <div>
            <p className="text-xs text-[var(--muted-foreground)] mb-2">Prioridad</p>
            <div className="flex gap-2">
              {(['alta', 'media', 'baja'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPrioridad(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors capitalize ${
                    prioridad === p
                      ? p === 'alta' ? 'bg-red-100 text-red-700 font-bold'
                      : p === 'media' ? 'bg-amber-100 text-amber-700 font-bold'
                      : 'bg-slate-100 text-slate-700 font-bold'
                      : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Botón enviar */}
          <button
            onClick={enviar}
            disabled={!texto.trim()}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              enviado
                ? 'bg-green-500 text-white'
                : 'bg-[var(--primary)] text-white disabled:opacity-40'
            }`}
          >
            {enviado ? <><CheckCircle size={16} /> ¡Guardado!</> : <><Send size={16} /> Agregar pendiente</>}
          </button>
          <p className="text-[10px] text-center text-[var(--muted-foreground)]">⌘ + Enter para enviar rápido</p>
        </div>

        {/* Historial reciente */}
        <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <span className="font-semibold text-sm">Últimas tareas creadas</span>
          </div>
          {historial.map((h) => {
            const emp = EMPRESAS[h.empresa]
            return (
              <div key={h.id} className="flex items-start gap-3 px-4 py-3 border-b border-[var(--border)] last:border-0">
                <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${emp.dot}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{h.texto}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${emp.bg} ${emp.text}`}>
                      {emp.label}
                    </span>
                    <span className="text-[10px] text-[var(--muted-foreground)]">{h.creado}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </AppShell>
  )
}
