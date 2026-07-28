'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Paperclip, Link2, Send, Trash2, Download, ExternalLink, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { EMPRESAS, PRIORIDAD_COLOR } from '@/lib/utils'
import type { Tarea, TareaComentario, TareaAdjunto, TareaEstado } from '@/lib/types'

const ESTADO_LABEL: Record<TareaEstado, string> = {
  pendiente:  'Pendiente',
  en_curso:   'En curso',
  bloqueado:  'Bloqueado',
  completado: 'Completado',
}
const ESTADO_COLOR: Record<TareaEstado, string> = {
  pendiente:  'bg-slate-100 text-slate-700',
  en_curso:   'bg-blue-100 text-blue-700',
  bloqueado:  'bg-red-100 text-red-700',
  completado: 'bg-green-100 text-green-700',
}

interface Props {
  tarea: Tarea
  miId: string
  esAdmin: boolean
  onClose: () => void
  onUpdate: (t: Tarea) => void
}

export default function TareaModal({ tarea, miId, esAdmin, onClose, onUpdate }: Props) {
  const [comentarios, setComentarios] = useState<TareaComentario[]>([])
  const [adjuntos, setAdjuntos]       = useState<TareaAdjunto[]>([])
  const [mensaje, setMensaje]         = useState('')
  const [linkUrl, setLinkUrl]         = useState('')
  const [linkNombre, setLinkNombre]   = useState('')
  const [showLink, setShowLink]       = useState(false)
  const [uploading, setUploading]     = useState(false)
  const [sending, setSending]         = useState(false)
  const [estado, setEstado]           = useState<TareaEstado>(tarea.estado)
  const fileRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Carga comentarios y adjuntos
  useEffect(() => {
    supabase
      .from('tarea_comentarios')
      .select('*, perfil_autor:autor_id(id, nombre, avatar)')
      .eq('tarea_id', tarea.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => setComentarios((data as TareaComentario[]) ?? []))

    supabase
      .from('tarea_adjuntos')
      .select('*')
      .eq('tarea_id', tarea.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => setAdjuntos((data as TareaAdjunto[]) ?? []))
  }, [tarea.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comentarios])

  // Cambiar estado
  async function cambiarEstado(nuevoEstado: TareaEstado) {
    setEstado(nuevoEstado)
    const { data } = await supabase
      .from('tareas')
      .update({ estado: nuevoEstado })
      .eq('id', tarea.id)
      .select()
      .single()
    if (data) onUpdate(data as Tarea)
  }

  // Enviar comentario
  async function enviarComentario() {
    if (!mensaje.trim()) return
    setSending(true)
    const { data } = await supabase
      .from('tarea_comentarios')
      .insert({ tarea_id: tarea.id, autor_id: miId, mensaje: mensaje.trim() })
      .select('*, perfil_autor:autor_id(id, nombre, avatar)')
      .single()
    if (data) setComentarios(c => [...c, data as TareaComentario])
    setMensaje('')
    setSending(false)
  }

  // Subir archivo
  async function subirArchivo(file: File) {
    setUploading(true)
    const path = `${tarea.id}/${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from('ADJUNTOS').upload(path, file)
    if (!error) {
      const { data: urlData } = supabase.storage.from('ADJUNTOS').getPublicUrl(path)
      const { data } = await supabase
        .from('tarea_adjuntos')
        .insert({ tarea_id: tarea.id, tipo: 'archivo', nombre: file.name, url: urlData.publicUrl, subido_por: miId })
        .select()
        .single()
      if (data) setAdjuntos(a => [...a, data as TareaAdjunto])
    }
    setUploading(false)
  }

  // Agregar link
  async function agregarLink() {
    if (!linkUrl.trim()) return
    const nombre = linkNombre.trim() || linkUrl
    const { data } = await supabase
      .from('tarea_adjuntos')
      .insert({ tarea_id: tarea.id, tipo: 'link', nombre, url: linkUrl.trim(), subido_por: miId })
      .select()
      .single()
    if (data) setAdjuntos(a => [...a, data as TareaAdjunto])
    setLinkUrl('')
    setLinkNombre('')
    setShowLink(false)
  }

  // Eliminar adjunto
  async function eliminarAdjunto(adj: TareaAdjunto) {
    await supabase.from('tarea_adjuntos').delete().eq('id', adj.id)
    if (adj.tipo === 'archivo') {
      const path = adj.url.split('/ADJUNTOS/')[1]
      if (path) await supabase.storage.from('ADJUNTOS').remove([path])
    }
    setAdjuntos(a => a.filter(x => x.id !== adj.id))
  }

  const emp = EMPRESAS[tarea.empresa]

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 p-0 md:p-4" onClick={onClose}>
      <div
        className="bg-white w-full md:max-w-2xl md:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 px-5 pt-5 pb-3 border-b border-[var(--border)] shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${emp.bg} ${emp.text}`}>{emp.label}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg ${PRIORIDAD_COLOR[tarea.prioridad]}`}>{tarea.prioridad}</span>
            </div>
            <h2 className="font-bold text-base leading-snug">{tarea.titulo}</h2>
            {tarea.descripcion && <p className="text-sm text-[var(--muted-foreground)] mt-1">{tarea.descripcion}</p>}
          </div>
          <button onClick={onClose} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 shrink-0"><X size={18} /></button>
        </div>

        {/* Estado selector */}
        <div className="px-5 py-3 border-b border-[var(--border)] shrink-0 flex gap-2 overflow-x-auto">
          {(Object.keys(ESTADO_LABEL) as TareaEstado[]).map(e => (
            <button
              key={e}
              onClick={() => cambiarEstado(e)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                estado === e ? ESTADO_COLOR[e] + ' ring-2 ring-offset-1 ring-current' : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
              }`}
            >
              {ESTADO_LABEL[e]}
            </button>
          ))}
          {tarea.fecha_limite && (
            <span className="ml-auto text-xs text-[var(--muted-foreground)] whitespace-nowrap self-center">
              📅 {new Date(tarea.fecha_limite).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto">

          {/* Adjuntos */}
          <div className="px-5 pt-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">📎 Archivos y links</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowLink(s => !s)}
                  className="flex items-center gap-1 text-xs text-[var(--primary)] font-medium"
                >
                  <Link2 size={12} /> Link
                </button>
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-1 text-xs text-[var(--primary)] font-medium"
                >
                  {uploading ? <Loader2 size={12} className="animate-spin" /> : <Paperclip size={12} />} Archivo
                </button>
                <input ref={fileRef} type="file" className="hidden" onChange={e => { if (e.target.files?.[0]) subirArchivo(e.target.files[0]) }} />
              </div>
            </div>

            {/* Form link */}
            {showLink && (
              <div className="flex gap-2 mb-2">
                <input
                  placeholder="URL del link..."
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  className="flex-1 text-xs border border-[var(--border)] rounded-xl px-3 py-2 outline-none focus:border-[var(--primary)]"
                />
                <input
                  placeholder="Nombre (opcional)"
                  value={linkNombre}
                  onChange={e => setLinkNombre(e.target.value)}
                  className="w-32 text-xs border border-[var(--border)] rounded-xl px-3 py-2 outline-none focus:border-[var(--primary)]"
                />
                <button onClick={agregarLink} className="bg-[var(--primary)] text-white text-xs px-3 py-2 rounded-xl font-medium">OK</button>
              </div>
            )}

            {/* Lista adjuntos */}
            {adjuntos.length === 0 && (
              <p className="text-xs text-[var(--muted-foreground)] italic">Sin adjuntos aún</p>
            )}
            <div className="space-y-1.5">
              {adjuntos.map(adj => (
                <div key={adj.id} className="flex items-center gap-2 bg-[var(--muted)] rounded-xl px-3 py-2">
                  <span className="text-sm">{adj.tipo === 'link' ? '🔗' : '📄'}</span>
                  <span className="text-xs font-medium flex-1 truncate">{adj.nombre}</span>
                  <a href={adj.url} target="_blank" rel="noreferrer" className="text-[var(--muted-foreground)] hover:text-[var(--primary)]">
                    <ExternalLink size={13} />
                  </a>
                  {(esAdmin || adj.subido_por === miId) && (
                    <button onClick={() => eliminarAdjunto(adj)} className="text-[var(--muted-foreground)] hover:text-red-500">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Comentarios */}
          <div className="px-5 pb-4">
            <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide block mb-3">💬 Conversación</span>
            <div className="space-y-3">
              {comentarios.length === 0 && (
                <p className="text-xs text-[var(--muted-foreground)] italic">Sin comentarios aún. Iniciá la conversación.</p>
              )}
              {comentarios.map(c => {
                const esPropio = c.autor_id === miId
                const autor = (c as any).perfil_autor
                const iniciales = autor?.avatar || autor?.nombre?.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase() || '?'
                return (
                  <div key={c.id} className={`flex gap-2.5 ${esPropio ? 'flex-row-reverse' : ''}`}>
                    <div className="w-7 h-7 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] font-bold flex items-center justify-center shrink-0">
                      {iniciales}
                    </div>
                    <div className={`max-w-[75%] ${esPropio ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                      <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                        esPropio ? 'bg-[var(--primary)] text-white rounded-tr-sm' : 'bg-[var(--muted)] text-[var(--foreground)] rounded-tl-sm'
                      }`}>
                        {c.mensaje}
                      </div>
                      <span className="text-[10px] text-[var(--muted-foreground)] px-1">
                        {autor?.nombre?.split(' ')[0] || 'Yo'} · {new Date(c.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>
          </div>
        </div>

        {/* Input comentario */}
        <div className="px-4 py-3 border-t border-[var(--border)] shrink-0 flex gap-2 items-end">
          <textarea
            value={mensaje}
            onChange={e => setMensaje(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarComentario() } }}
            placeholder="Escribir comentario..."
            rows={1}
            className="flex-1 text-sm border border-[var(--border)] rounded-xl px-3 py-2.5 outline-none focus:border-[var(--primary)] resize-none"
          />
          <button
            onClick={enviarComentario}
            disabled={sending || !mensaje.trim()}
            className="bg-[var(--primary)] text-white p-2.5 rounded-xl disabled:opacity-40 shrink-0"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}
