import AppShell from '@/components/layout/AppShell'
import { EMPRESAS, formatFecha, diasRestantes, type Empresa } from '@/lib/utils'
import { FileWarning, Plus, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

const LICITACIONES_DEMO = [
  {
    id: '1',
    titulo: 'Licitación pavimento calle San Martín',
    empresa: 'blockera' as Empresa,
    fechaCierre: '2026-07-09',
    monto: '$4.500.000',
    estado: 'activa',
    descripcion: 'Municipalidad de Mercedes — Pavimento 8 cuadras',
  },
  {
    id: '2',
    titulo: 'Provisión hormigón H21 — Obra vial Ruta 7',
    empresa: 'hormiblock' as Empresa,
    fechaCierre: '2026-07-15',
    monto: '$12.000.000',
    estado: 'activa',
    descripcion: 'Vialidad Provincial — Ensanche y repavimentación',
  },
  {
    id: '3',
    titulo: 'Stand Feria Construir 2026',
    empresa: 'ostara' as Empresa,
    fechaCierre: '2026-07-20',
    monto: '$800.000',
    estado: 'activa',
    descripcion: 'Diseño y montaje de stand 60m²',
  },
  {
    id: '4',
    titulo: 'Provisión postes de hormigón — EDESUR',
    empresa: 'hormiblock' as Empresa,
    fechaCierre: '2026-06-30',
    monto: '$3.200.000',
    estado: 'cerrada',
    descripcion: 'Adjudicada — en ejecución',
  },
]

function urgenciaColor(dias: number, estado: string) {
  if (estado === 'cerrada') return 'bg-green-100 text-green-700'
  if (dias < 0) return 'bg-slate-100 text-slate-500'
  if (dias <= 2) return 'bg-red-100 text-red-700'
  if (dias <= 7) return 'bg-amber-100 text-amber-700'
  return 'bg-blue-100 text-blue-700'
}

function urgenciaLabel(dias: number, estado: string) {
  if (estado === 'cerrada') return 'Cerrada'
  if (dias < 0) return 'Vencida'
  if (dias === 0) return '¡Hoy!'
  if (dias === 1) return 'Mañana'
  return `${dias} días`
}

export default function LicitacionesPage() {
  const activas = LICITACIONES_DEMO.filter(l => l.estado === 'activa').sort(
    (a, b) => new Date(a.fechaCierre).getTime() - new Date(b.fechaCierre).getTime()
  )
  const cerradas = LICITACIONES_DEMO.filter(l => l.estado === 'cerrada')

  return (
    <AppShell
      title="Licitaciones"
      headerRight={
        <button className="flex items-center gap-1.5 bg-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-xl">
          <Plus size={14} /> Nueva
        </button>
      }
    >
      <div className="p-4 space-y-4">

        {/* Resumen */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-[var(--border)] p-3 text-center">
            <p className="text-2xl font-bold text-[var(--primary)]">{activas.length}</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Activas</p>
          </div>
          <div className="bg-white rounded-2xl border border-[var(--border)] p-3 text-center">
            <p className="text-2xl font-bold text-red-600">
              {activas.filter(l => diasRestantes(l.fechaCierre) <= 3).length}
            </p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Urgentes</p>
          </div>
          <div className="bg-white rounded-2xl border border-[var(--border)] p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{cerradas.length}</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Cerradas</p>
          </div>
        </div>

        {/* Licitaciones activas */}
        <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
            <FileWarning size={16} className="text-amber-500" />
            <span className="font-semibold text-sm">Activas — ordenadas por cierre</span>
          </div>
          {activas.map((l) => {
            const emp = EMPRESAS[l.empresa]
            const dias = diasRestantes(l.fechaCierre)
            return (
              <div key={l.id} className="px-4 py-4 border-b border-[var(--border)] last:border-0">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="text-sm font-semibold leading-snug flex-1">{l.titulo}</p>
                  <span className={`text-xs font-bold px-2 py-1 rounded-xl whitespace-nowrap ${urgenciaColor(dias, l.estado)}`}>
                    {urgenciaLabel(dias, l.estado)}
                  </span>
                </div>
                <p className="text-xs text-[var(--muted-foreground)] mb-2">{l.descripcion}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${emp.bg} ${emp.text}`}>
                    {emp.label}
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    Cierre: {formatFecha(l.fechaCierre)}
                  </span>
                  <span className="text-xs font-semibold text-[var(--foreground)] ml-auto">
                    {l.monto}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Licitaciones cerradas */}
        {cerradas.length > 0 && (
          <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
              <CheckCircle size={16} className="text-green-500" />
              <span className="font-semibold text-sm">Cerradas / Adjudicadas</span>
            </div>
            {cerradas.map((l) => {
              const emp = EMPRESAS[l.empresa]
              return (
                <div key={l.id} className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] last:border-0 opacity-70">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{l.titulo}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{emp.label} · {l.monto}</p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-green-100 text-green-700">
                    Cerrada
                  </span>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </AppShell>
  )
}
