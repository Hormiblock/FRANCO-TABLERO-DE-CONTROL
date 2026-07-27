import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const EMPRESAS = {
  ostara:     { label: 'Ostara',     color: '#7c3aed', bg: 'bg-purple-100',  text: 'text-purple-700',  dot: 'bg-purple-500'  },
  hormiblock: { label: 'Hormiblock', color: '#1e4d8c', bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-600'    },
  blockera:   { label: 'Blockera',   color: '#b45309', bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-600'   },
  granny:     { label: 'Granny',     color: '#15803d', bg: 'bg-green-100',   text: 'text-green-700',   dot: 'bg-green-600'   },
} as const

export type Empresa = keyof typeof EMPRESAS

export const PRIORIDAD_COLOR: Record<string, string> = {
  alta:   'bg-red-100 text-red-700',
  media:  'bg-amber-100 text-amber-700',
  baja:   'bg-slate-100 text-slate-600',
}

export const ESTADO_COLOR: Record<string, string> = {
  pendiente:   'bg-slate-100 text-slate-600',
  en_curso:    'bg-blue-100 text-blue-700',
  bloqueado:   'bg-red-100 text-red-700',
  completado:  'bg-green-100 text-green-700',
}

export function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function diasRestantes(fecha: string): number {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const target = new Date(fecha)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - hoy.getTime()) / 86400000)
}
