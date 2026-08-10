'use client'

import { useState, useEffect, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import { Mail, RefreshCw, Loader2, ExternalLink, Sparkles, AlertTriangle, Send, Check, Clock, X } from 'lucide-react'

interface GmailThread {
  id: string
  subject: string
  from: string
  snippet: string
  date?: string
  enCopia?: boolean
}

interface Pendiente {
  id: string
  gmail_thread_id: string
  subject: string
  from_email: string
  snippet: string
  created_at: string
}

interface Resumen {
  resumen: string
  urgentes: string[]
  puede_esperar: string[]
  accion_recomendada: string
  emails: GmailThread[]
}

function nombreDesde(from: string) {
  return from.replace(/<.*>/, '').trim().replace(/"/g, '') || from
}

function emailDesde(from: string) {
  const match = from.match(/<(.+)>/)
  return match ? match[1] : from
}

export default function EmailsPage() {
  const [emails, setEmails]         = useState<GmailThread[]>([])
  const [pendientes, setPendientes] = useState<Pendiente[]>([])
  const [pendientesIds, setPendientesIds] = useState<Set<string>>(new Set())
  const [resumen, setResumen]       = useState<Resumen | null>(null)
  const [loading, setLoading]       = useState(true)
  const [loadingIA, setLoadingIA]   = useState(false)
  const [enviandoReporte, setEnviandoReporte] = useState(false)
  const [reporteEnviado, setReporteEnviado]   = useState(false)
  const [googleOk, setGoogleOk]     = useState<boolean | null>(null)
  const [abierto, setAbierto]       = useState<string | null>(null)
  const [accionando, setAccionando] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const [resEmails, resPendientes] = await Promise.all([
        fetch('/api/google/gmail'),
        fetch('/api/emails/pendiente'),
      ])

      if (resEmails.status === 403) { setGoogleOk(false); setLoading(false); return }
      if (resEmails.ok) {
        const data = await resEmails.json()
        setEmails(data.emails ?? [])
        setGoogleOk(true)
      }
      if (resPendientes.ok) {
        const data = await resPendientes.json()
        setPendientes(data.pendientes ?? [])
        setPendientesIds(new Set((data.pendientes ?? []).map((p: Pendiente) => p.gmail_thread_id)))
      }
    } catch { setGoogleOk(false) }
    setLoading(false)
  }, [])

  const analizarConIA = useCallback(async () => {
    setLoadingIA(true)
    try {
      const res = await fetch('/api/resumen-emails')
      if (res.ok) {
        const data = await res.json()
        setResumen(data)
        if (data.emails?.length) setEmails(data.emails)
      }
    } catch {}
    setLoadingIA(false)
  }, [])

  const enviarReporte = async () => {
    setEnviandoReporte(true)
    try {
      const res = await fetch('/api/reporte-diario')
      if (res.ok) setReporteEnviado(true)
    } catch {}
    setEnviandoReporte(false)
  }

  const marcarLeido = async (email: GmailThread) => {
    setAccionando(email.id)
    try {
      await fetch('/api/emails/marcar-leido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId: email.id }),
      })
      setEmails(prev => prev.filter(e => e.id !== email.id))
      setPendientesIds(prev => { const s = new Set(prev); s.delete(email.id); return s })
      setPendientes(prev => prev.filter(p => p.gmail_thread_id !== email.id))
      if (abierto === email.id) setAbierto(null)
    } catch {}
    setAccionando(null)
  }

  const togglePendiente = async (email: GmailThread) => {
    setAccionando(email.id + '_p')
    const esPendiente = pendientesIds.has(email.id)
    try {
      if (esPendiente) {
        await fetch('/api/emails/pendiente', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ threadId: email.id }),
        })
        setPendientesIds(prev => { const s = new Set(prev); s.delete(email.id); return s })
        setPendientes(prev => prev.filter(p => p.gmail_thread_id !== email.id))
      } else {
        await fetch('/api/emails/pendiente', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ threadId: email.id, subject: email.subject, from: email.from, snippet: email.snippet }),
        })
        setPendientesIds(prev => new Set([...prev, email.id]))
        setPendientes(prev => [{
          id: email.id,
          gmail_thread_id: email.id,
          subject: email.subject,
          from_email: email.from,
          snippet: email.snippet,
          created_at: new Date().toISOString(),
        }, ...prev])
      }
    } catch {}
    setAccionando(null)
  }

  const resolverPendiente = async (p: Pendiente) => {
    setAccionando(p.gmail_thread_id)
    try {
      await fetch('/api/emails/pendiente', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId: p.gmail_thread_id }),
      })
      setPendientes(prev => prev.filter(x => x.gmail_thread_id !== p.gmail_thread_id))
      setPendientesIds(prev => { const s = new Set(prev); s.delete(p.gmail_thread_id); return s })
    } catch {}
    setAccionando(null)
  }

  useEffect(() => { cargar() }, [cargar])

  return (
    <AppShell title="Emails">
      <div className="p-4 space-y-4">

        {/* Header */}
        <div className="bg-[var(--primary)] rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-white/60">Emails sin leer</p>
            <button onClick={cargar} className="text-white/60 hover:text-white">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          <p className="text-2xl font-bold">{loading ? '...' : emails.length}</p>
          <p className="text-xs text-white/60 mt-1">Inbox · últimas 48h · sin promociones</p>

          {googleOk === true && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={analizarConIA}
                disabled={loadingIA}
                className="flex-1 flex items-center justify-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold py-2 rounded-xl transition-colors disabled:opacity-60"
              >
                {loadingIA ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                {loadingIA ? 'Analizando...' : 'Analizar con IA'}
              </button>
              <button
                onClick={enviarReporte}
                disabled={enviandoReporte || reporteEnviado}
                className="flex-1 flex items-center justify-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold py-2 rounded-xl transition-colors disabled:opacity-60"
              >
                {enviandoReporte ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                {reporteEnviado ? '✓ Enviado' : enviandoReporte ? 'Enviando...' : 'Reporte al mail'}
              </button>
            </div>
          )}
        </div>

        {/* Banner conectar Google */}
        {googleOk === false && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-amber-800">Conectá tu cuenta Google</p>
              <p className="text-xs text-amber-700 mt-0.5">Para ver tus emails reales</p>
            </div>
            <a href="/api/auth/google" className="bg-[var(--primary)] text-white text-xs font-semibold px-4 py-2 rounded-xl shrink-0">
              Conectar
            </a>
          </div>
        )}

        {/* Resumen IA */}
        {resumen && (
          <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] bg-violet-50">
              <Sparkles size={15} className="text-violet-600" />
              <span className="font-semibold text-sm text-violet-800">Análisis IA</span>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-[var(--foreground)]">{resumen.resumen}</p>
              {resumen.urgentes?.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <AlertTriangle size={13} className="text-red-500" />
                    <p className="text-xs font-bold text-red-600 uppercase tracking-wide">Requiere respuesta hoy</p>
                  </div>
                  {resumen.urgentes.map((u, i) => (
                    <p key={i} className="text-xs text-[var(--foreground)] bg-red-50 rounded-lg px-3 py-1.5 mb-1">• {u}</p>
                  ))}
                </div>
              )}
              {resumen.accion_recomendada && (
                <div className="bg-[var(--primary)]/5 rounded-xl px-3 py-2.5">
                  <p className="text-[10px] font-bold text-[var(--primary)] uppercase mb-1">Empezá por esto</p>
                  <p className="text-sm font-medium">{resumen.accion_recomendada}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pendientes a responder */}
        {pendientes.length > 0 && (
          <div className="bg-white rounded-2xl border border-amber-200 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-200 bg-amber-50">
              <Clock size={15} className="text-amber-600" />
              <span className="font-semibold text-sm text-amber-800">Pendientes a responder</span>
              <span className="ml-auto bg-amber-200 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">{pendientes.length}</span>
            </div>
            {pendientes.map((p) => (
              <div key={p.id} className="border-b border-amber-100 last:border-0 px-4 py-3">
                <div className="flex items-start gap-3">
                  <Clock size={14} className="text-amber-500 mt-1 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{nombreDesde(p.from_email)}</p>
                    <p className="text-sm font-medium truncate mt-0.5">{p.subject}</p>
                    <p className="text-xs text-[var(--muted-foreground)] truncate mt-0.5">{p.snippet}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <a
                      href={`https://mail.google.com/mail/u/0/#inbox/${p.gmail_thread_id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]"
                    >
                      <ExternalLink size={13} />
                    </a>
                    <button
                      onClick={() => resolverPendiente(p)}
                      disabled={accionando === p.gmail_thread_id}
                      className="p-1.5 rounded-lg bg-green-100 text-green-700 disabled:opacity-50"
                      title="Marcar como resuelto"
                    >
                      {accionando === p.gmail_thread_id
                        ? <Loader2 size={13} className="animate-spin" />
                        : <Check size={13} />
                      }
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lista emails */}
        <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-[var(--primary)]" />
            </div>
          ) : emails.length === 0 && googleOk === true ? (
            <div className="text-center py-10 text-[var(--muted-foreground)]">
              <Mail size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sin emails importantes 🎉</p>
            </div>
          ) : googleOk !== false && emails.map((email) => {
            const nombre  = nombreDesde(email.from)
            const addr    = emailDesde(email.from)
            const isOpen  = abierto === email.id
            const esPend  = pendientesIds.has(email.id)

            return (
              <div key={email.id} className="border-b border-[var(--border)] last:border-0">
                <button
                  onClick={() => setAbierto(isOpen ? null : email.id)}
                  className="w-full text-left px-4 py-3 active:bg-[var(--muted)] transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className={`mt-1.5 block w-2 h-2 rounded-full shrink-0 ${esPend ? 'bg-amber-400' : 'bg-blue-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold truncate">
                          {nombre}
                          {email.enCopia && <span className="ml-1.5 text-[10px] text-[var(--muted-foreground)] font-normal">en copia</span>}
                        </p>
                        <span className="text-[10px] text-[var(--muted-foreground)] shrink-0">{email.date ?? ''}</span>
                      </div>
                      <p className="text-sm font-medium truncate mt-0.5">{email.subject}</p>
                      <p className="text-xs text-[var(--muted-foreground)] truncate mt-0.5">{email.snippet}</p>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="mt-3 ml-5 p-3 bg-[var(--muted)] rounded-xl space-y-2">
                      <p className="text-xs text-[var(--muted-foreground)]">{addr}</p>
                      <p className="text-sm">{email.snippet}</p>

                      {/* Acciones */}
                      <div className="flex gap-2 pt-1">
                        <a
                          href={`https://mail.google.com/mail/u/0/#inbox/${email.id}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-[var(--primary)] text-white text-xs font-semibold py-2 rounded-xl"
                        >
                          Abrir en Gmail <ExternalLink size={11} />
                        </a>
                        <button
                          onClick={(e) => { e.stopPropagation(); togglePendiente(email) }}
                          disabled={accionando === email.id + '_p'}
                          className={`flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                            esPend
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-[var(--muted)] text-[var(--foreground)]'
                          }`}
                        >
                          {accionando === email.id + '_p'
                            ? <Loader2 size={12} className="animate-spin" />
                            : esPend ? <><X size={12} /> Quitar</> : <><Clock size={12} /> Pendiente</>
                          }
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); marcarLeido(email) }}
                          disabled={accionando === email.id}
                          className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-green-100 text-green-700 transition-colors"
                        >
                          {accionando === email.id
                            ? <Loader2 size={12} className="animate-spin" />
                            : <><Check size={12} /> Leído</>
                          }
                        </button>
                      </div>
                    </div>
                  )}
                </button>
              </div>
            )
          })}
        </div>

      </div>
    </AppShell>
  )
}
