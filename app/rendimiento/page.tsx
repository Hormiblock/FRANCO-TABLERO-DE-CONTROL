'use client'

import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { EMPRESAS, type Empresa } from '@/lib/utils'
import { Flame, Target, Trophy, TrendingUp, Star, Zap } from 'lucide-react'

// Demo — conectar a Supabase después
const STATS = {
  racha: 5,             // días seguidos cerrando tareas
  metaSemanal: 15,      // tareas meta por semana
  completadasSemana: 11,
  puntosTotales: 340,
  nivel: 'Gerente Pro',
  proximoNivel: 'Director',
  puntosParaSubir: 160,
  completadasHoy: 3,
}

const STATS_EMPRESAS = [
  { empresa: 'ostara' as Empresa,     completadas: 10, total: 12, puntos: 120 },
  { empresa: 'hormiblock' as Empresa, completadas: 4,  total: 5,  puntos: 80  },
  { empresa: 'blockera' as Empresa,   completadas: 5,  total: 8,  puntos: 75  },
  { empresa: 'granny' as Empresa,     completadas: 2,  total: 3,  puntos: 30  },
]

const GERENTES_RANKING = [
  { nombre: 'Jose Sparks',    avatar: 'JS', completadas: 9,  total: 13, racha: 4 },
  { nombre: 'Santiago Dans',  avatar: 'SD', completadas: 4,  total: 5,  racha: 2 },
]

const HISTORIAL_SEMANAS = [
  { semana: 'Hace 4 sem', completadas: 8,  meta: 15 },
  { semana: 'Hace 3 sem', completadas: 12, meta: 15 },
  { semana: 'Hace 2 sem', completadas: 10, meta: 15 },
  { semana: 'Sem pasada', completadas: 14, meta: 15 },
  { semana: 'Esta sem',   completadas: 11, meta: 15 },
]

const LOGROS = [
  { icono: '🔥', nombre: 'Racha de 5 días',       descripcion: 'Cerraste tareas 5 días seguidos', obtenido: true  },
  { icono: '⚡', nombre: '3 en un día',             descripcion: 'Completaste 3 tareas en un día',  obtenido: true  },
  { icono: '🎯', nombre: 'Meta semanal',            descripcion: 'Alcanzaste la meta de la semana', obtenido: false },
  { icono: '👑', nombre: '10 urgentes cerradas',   descripcion: 'Cerraste 10 tareas de alta prio', obtenido: false },
  { icono: '🌟', nombre: 'Todas las empresas',      descripcion: 'Tarea completada en cada empresa',obtenido: true  },
  { icono: '🚀', nombre: 'Racha de 14 días',        descripcion: 'Dos semanas sin interrupciones',  obtenido: false },
]

function BarraProgreso({ valor, max, color }: { valor: number; max: number; color: string }) {
  const pct = Math.min(Math.round((valor / max) * 100), 100)
  return (
    <div className="h-2 bg-[var(--muted)] rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  )
}

export default function RendimientoPage() {
  const pctSemana = Math.round((STATS.completadasSemana / STATS.metaSemanal) * 100)
  const pctNivel = Math.round(((STATS.puntosTotales % 500) / 500) * 100)

  return (
    <AppShell title="Mi Rendimiento">
      <div className="p-4 space-y-4">

        {/* Header — nivel y puntos */}
        <div className="bg-[var(--primary)] rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-white/60 text-xs mb-0.5">Nivel actual</p>
              <p className="text-xl font-bold">{STATS.nivel}</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              <Trophy size={28} className="text-yellow-300" />
            </div>
          </div>
          <div className="mb-1.5">
            <div className="flex justify-between text-xs text-white/70 mb-1">
              <span>{STATS.puntosTotales} pts</span>
              <span>{STATS.puntosParaSubir} pts para {STATS.proximoNivel}</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-300 rounded-full transition-all" style={{ width: `${pctNivel}%` }} />
            </div>
          </div>
          {/* Stats rápidos */}
          <div className="flex gap-3 mt-4">
            <div className="flex-1 bg-white/10 rounded-xl p-2.5 text-center">
              <p className="text-xl font-bold text-orange-300">{STATS.racha}</p>
              <p className="text-[10px] text-white/70">días racha 🔥</p>
            </div>
            <div className="flex-1 bg-white/10 rounded-xl p-2.5 text-center">
              <p className="text-xl font-bold text-green-300">{STATS.completadasSemana}</p>
              <p className="text-[10px] text-white/70">esta semana</p>
            </div>
            <div className="flex-1 bg-white/10 rounded-xl p-2.5 text-center">
              <p className="text-xl font-bold text-blue-300">{STATS.completadasHoy}</p>
              <p className="text-[10px] text-white/70">hoy</p>
            </div>
          </div>
        </div>

        {/* Meta semanal */}
        <div className="bg-white rounded-2xl border border-[var(--border)] p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-[var(--primary)]" />
              <span className="font-semibold text-sm">Meta semanal</span>
            </div>
            <span className={`text-sm font-bold ${pctSemana >= 100 ? 'text-green-600' : pctSemana >= 70 ? 'text-amber-600' : 'text-red-500'}`}>
              {STATS.completadasSemana}/{STATS.metaSemanal}
            </span>
          </div>
          <BarraProgreso valor={STATS.completadasSemana} max={STATS.metaSemanal} color={pctSemana >= 100 ? '#22c55e' : pctSemana >= 70 ? '#f59e0b' : '#ef4444'} />
          <p className="text-xs text-[var(--muted-foreground)] mt-2">
            {pctSemana >= 100
              ? '🎉 ¡Meta alcanzada! Excelente semana.'
              : `Te faltan ${STATS.metaSemanal - STATS.completadasSemana} tareas para llegar a la meta`}
          </p>

          {/* Mini gráfico de semanas */}
          <div className="flex items-end gap-2 mt-4 h-16">
            {HISTORIAL_SEMANAS.map((s, i) => {
              const pct = Math.min((s.completadas / s.meta) * 100, 100)
              const esActual = i === HISTORIAL_SEMANAS.length - 1
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-[var(--muted-foreground)] font-semibold">{s.completadas}</span>
                  <div className="w-full rounded-t-lg transition-all" style={{
                    height: `${Math.max(pct * 0.44, 4)}px`,
                    backgroundColor: esActual ? 'var(--primary)' : pct >= 100 ? '#22c55e' : '#e2e8f0'
                  }} />
                  <span className={`text-[8px] ${esActual ? 'text-[var(--primary)] font-bold' : 'text-[var(--muted-foreground)]'}`}>
                    {esActual ? 'Hoy' : s.semana.replace('Hace ', '').replace(' sem', 's')}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Rendimiento por empresa */}
        <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
            <TrendingUp size={16} className="text-[var(--primary)]" />
            <span className="font-semibold text-sm">Por empresa</span>
          </div>
          {STATS_EMPRESAS.sort((a, b) => (b.completadas / b.total) - (a.completadas / a.total)).map((s, i) => {
            const emp = EMPRESAS[s.empresa]
            const pct = Math.round((s.completadas / s.total) * 100)
            return (
              <div key={s.empresa} className="px-4 py-3 border-b border-[var(--border)] last:border-0">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    {i === 0 && <span className="text-sm">🥇</span>}
                    {i === 1 && <span className="text-sm">🥈</span>}
                    {i === 2 && <span className="text-sm">🥉</span>}
                    {i > 2 && <span className={`w-2 h-2 rounded-full ${emp.dot}`} />}
                    <span className="text-sm font-medium">{emp.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--muted-foreground)]">{s.completadas}/{s.total}</span>
                    <span className={`text-xs font-bold ${pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                      {pct}%
                    </span>
                  </div>
                </div>
                <BarraProgreso valor={s.completadas} max={s.total} color={emp.color} />
              </div>
            )
          })}
        </div>

        {/* Ranking gerentes */}
        <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
            <Star size={16} className="text-amber-500" />
            <span className="font-semibold text-sm">Ranking gerentes</span>
          </div>
          {GERENTES_RANKING.sort((a, b) => (b.completadas / b.total) - (a.completadas / a.total)).map((g, i) => {
            const pct = Math.round((g.completadas / g.total) * 100)
            return (
              <div key={g.nombre} className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] last:border-0">
                <span className="text-lg">{i === 0 ? '🥇' : '🥈'}</span>
                <div className="w-9 h-9 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {g.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold">{g.nombre}</span>
                    <span className={`text-xs font-bold ${pct >= 80 ? 'text-green-600' : 'text-amber-600'}`}>{pct}%</span>
                  </div>
                  <BarraProgreso valor={g.completadas} max={g.total} color="#1e3a5f" />
                  <p className="text-[10px] text-[var(--muted-foreground)] mt-1">
                    {g.completadas}/{g.total} tareas · 🔥 {g.racha} días racha
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Logros */}
        <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
            <Zap size={16} className="text-yellow-500" />
            <span className="font-semibold text-sm">Logros</span>
            <span className="text-xs text-[var(--muted-foreground)] ml-auto">
              {LOGROS.filter(l => l.obtenido).length}/{LOGROS.length}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-0 divide-x divide-y divide-[var(--border)]">
            {LOGROS.map((logro) => (
              <div key={logro.nombre} className={`p-3 ${!logro.obtenido ? 'opacity-40 grayscale' : ''}`}>
                <p className="text-2xl mb-1">{logro.icono}</p>
                <p className="text-xs font-semibold leading-tight">{logro.nombre}</p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5 leading-tight">{logro.descripcion}</p>
                {logro.obtenido && (
                  <span className="text-[9px] font-bold text-green-600 mt-1 block">✓ Obtenido</span>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </AppShell>
  )
}
