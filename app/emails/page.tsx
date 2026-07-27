'use client'

import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { EMPRESAS, type Empresa } from '@/lib/utils'
import { Mail, Megaphone, AlertCircle, Info, CheckCheck, Clock } from 'lucide-react'

type Categoria = 'urgente' | 'pendiente' | 'info' | 'publicidad'

const CAT_CONFIG: Record<Categoria, { label: string; color: string; icon: React.ElementType }> = {
  urgente:    { label: 'Urgente',    color: 'bg-red-100 text-red-700',    icon: AlertCircle  },
  pendiente:  { label: 'Pendiente', color: 'bg-amber-100 text-amber-700', icon: Clock        },
  info:       { label: 'Info',      color: 'bg-blue-100 text-blue-700',   icon: Info         },
  publicidad: { label: 'Publicidad',color: 'bg-slate-100 text-slate-500', icon: Megaphone    },
}

const EMAILS_DEMO = [
  { id: '1', de: 'gerencia@toyota.com.ar',     asunto: 'Re: Propuesta evento lanzamiento GR86', empresa: 'ostara' as Empresa,     categoria: 'urgente' as Categoria,   leido: false, hora: '08:12', resumen: 'Solicitan modificar la fecha al 18/7. Piden respuesta antes del mediodía.' },
  { id: '2', de: 'licitaciones@mercedes.gob.ar',asunto: 'Documentación adicional licitación 012', empresa: 'blockera' as Empresa,  categoria: 'urgente' as Categoria,   leido: false, hora: '07:55', resumen: 'Requieren planos firmados y certificado de IERIC antes del jueves.' },
  { id: '3', de: 'proveedores@cementoarg.com',  asunto: 'Actualización lista de precios julio',   empresa: 'hormiblock' as Empresa, categoria: 'pendiente' as Categoria, leido: false, hora: '09:30', resumen: 'Nuevo precio del portland: $18.500/ton. Rigen desde el 10/7.' },
  { id: '4', de: 'contador@estudio-fm.com',     asunto: 'DDJJ Granny — documentos pendientes',   empresa: 'granny' as Empresa,     categoria: 'pendiente' as Categoria, leido: true,  hora: 'Ayer',  resumen: 'Necesitan estados contables actualizados para presentar el lunes.' },
  { id: '5', de: 'info@bancogalicia.com',       asunto: 'Tu resumen de cuenta de junio',         empresa: 'ostara' as Empresa,     categoria: 'info' as Categoria,      leido: true,  hora: 'Ayer',  resumen: 'Resumen bancario mensual adjunto.' },
  { id: '6', de: 'newsletter@marketingxyz.com', asunto: '🔥 Oferta especial: CRM 50% off',       empresa: 'ostara' as Empresa,     categoria: 'publicidad' as Categoria, leido: true, hora: 'Ayer',  resumen: 'Publicidad.' },
]

export default function EmailsPage() {
  const [filtro, setFiltro] = useState<Categoria | 'todos'>('todos')
  const [emailAbierto, setEmailAbierto] = useState<string | null>(null)

  const emails = filtro === 'todos'
    ? EMAILS_DEMO.filter(e => e.categoria !== 'publicidad')
    : EMAILS_DEMO.filter(e => e.categoria === filtro)

  const conteos = {
    urgente:   EMAILS_DEMO.filter(e => e.categoria === 'urgente'   && !e.leido).length,
    pendiente: EMAILS_DEMO.filter(e => e.categoria === 'pendiente' && !e.leido).length,
  }

  return (
    <AppShell title="Emails">
      <div className="p-4 space-y-4">

        {/* Resumen matutino */}
        <div className="bg-[var(--primary)] rounded-2xl p-4 text-white">
          <p className="text-xs text-white/60 mb-1">Reporte matutino</p>
          <p className="text-lg font-bold mb-3">
            {conteos.urgente + conteos.pendiente} emails sin responder
          </p>
          <div className="flex gap-3">
            <div className="flex-1 bg-white/10 rounded-xl p-2.5 text-center">
              <p className="text-2xl font-bold text-red-300">{conteos.urgente}</p>
              <p className="text-[10px] text-white/70">Urgentes</p>
            </div>
            <div className="flex-1 bg-white/10 rounded-xl p-2.5 text-center">
              <p className="text-2xl font-bold text-amber-300">{conteos.pendiente}</p>
              <p className="text-[10px] text-white/70">Pendientes</p>
            </div>
            <div className="flex-1 bg-white/10 rounded-xl p-2.5 text-center">
              <p className="text-2xl font-bold text-slate-300">
                {EMAILS_DEMO.filter(e => e.categoria === 'publicidad').length}
              </p>
              <p className="text-[10px] text-white/70">Publicidad</p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['todos', 'urgente', 'pendiente', 'info', 'publicidad'] as const).map((cat) => {
            const activo = filtro === cat
            const cfg = cat !== 'todos' ? CAT_CONFIG[cat] : null
            return (
              <button
                key={cat}
                onClick={() => setFiltro(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                  activo
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-white border border-[var(--border)] text-[var(--muted-foreground)]'
                }`}
              >
                {cat === 'todos' ? 'Todos' : cfg!.label}
              </button>
            )
          })}
        </div>

        {/* Lista emails */}
        <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
          {emails.length === 0 && (
            <div className="text-center py-10 text-[var(--muted-foreground)]">
              <Mail size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sin emails en esta categoría</p>
            </div>
          )}
          {emails.map((email) => {
            const emp = EMPRESAS[email.empresa]
            const CatIcon = CAT_CONFIG[email.categoria].icon
            const abierto = emailAbierto === email.id
            return (
              <div key={email.id} className="border-b border-[var(--border)] last:border-0">
                <button
                  onClick={() => setEmailAbierto(abierto ? null : email.id)}
                  className="w-full text-left px-4 py-3 active:bg-[var(--muted)] transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {!email.leido && <span className="block w-2 h-2 rounded-full bg-blue-500" />}
                      {email.leido && <span className="block w-2 h-2 rounded-full bg-slate-200" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs truncate ${!email.leido ? 'font-semibold' : 'text-[var(--muted-foreground)]'}`}>
                          {email.de}
                        </p>
                        <span className="text-[10px] text-[var(--muted-foreground)] shrink-0">{email.hora}</span>
                      </div>
                      <p className={`text-sm truncate ${!email.leido ? 'font-semibold' : ''}`}>
                        {email.asunto}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${emp.bg} ${emp.text}`}>
                          {emp.label}
                        </span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${CAT_CONFIG[email.categoria].color}`}>
                          {CAT_CONFIG[email.categoria].label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expandido */}
                  {abierto && (
                    <div className="mt-3 ml-5 p-3 bg-[var(--muted)] rounded-xl">
                      <p className="text-sm text-[var(--foreground)]">{email.resumen}</p>
                      <div className="flex gap-2 mt-3">
                        <button className="flex-1 bg-[var(--primary)] text-white text-xs font-semibold py-2 rounded-xl">
                          Responder
                        </button>
                        <button className="flex-1 bg-white border border-[var(--border)] text-xs font-semibold py-2 rounded-xl">
                          Marcar leído
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
