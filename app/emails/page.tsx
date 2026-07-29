'use client'

import { useState, useEffect, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import { Mail, AlertCircle, Info, Clock, RefreshCw, Loader2, ExternalLink } from 'lucide-react'

interface GmailThread {
  id: string
  subject: string
  from: string
  snippet: string
  date?: string
}

function nombreDesde(from: string) {
  return from.replace(/<.*>/, '').trim().replace(/"/g, '') || from
}

function emailDesde(from: string) {
  const match = from.match(/<(.+)>/)
  return match ? match[1] : from
}

export default function EmailsPage() {
  const [emails, setEmails] = useState<GmailThread[]>([])
  const [loading, setLoading] = useState(true)
  const [googleOk, setGoogleOk] = useState<boolean | null>(null)
  const [abierto, setAbierto] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/google/gmail')
      if (res.status === 403) { setGoogleOk(false); setLoading(false); return }
      if (res.ok) {
        const data = await res.json()
        setEmails(data.emails ?? [])
        setGoogleOk(true)
      }
    } catch { setGoogleOk(false) }
    setLoading(false)
  }, [])

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

        {/* Lista */}
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
            const nombre = nombreDesde(email.from)
            const addr   = emailDesde(email.from)
            const isOpen = abierto === email.id
            return (
              <div key={email.id} className="border-b border-[var(--border)] last:border-0">
                <button
                  onClick={() => setAbierto(isOpen ? null : email.id)}
                  className="w-full text-left px-4 py-3 active:bg-[var(--muted)] transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-1.5 block w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold truncate">{nombre}</p>
                        <span className="text-[10px] text-[var(--muted-foreground)] shrink-0">{email.date ?? ''}</span>
                      </div>
                      <p className="text-sm font-medium truncate mt-0.5">{email.subject}</p>
                      <p className="text-xs text-[var(--muted-foreground)] truncate mt-0.5">{email.snippet}</p>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="mt-3 ml-5 p-3 bg-[var(--muted)] rounded-xl">
                      <p className="text-xs text-[var(--muted-foreground)] mb-1">{addr}</p>
                      <p className="text-sm">{email.snippet}</p>
                      <a
                        href={`https://mail.google.com/mail/u/0/#inbox/${email.id}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="mt-3 flex items-center justify-center gap-1.5 w-full bg-[var(--primary)] text-white text-xs font-semibold py-2 rounded-xl"
                      >
                        Abrir en Gmail <ExternalLink size={11} />
                      </a>
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
