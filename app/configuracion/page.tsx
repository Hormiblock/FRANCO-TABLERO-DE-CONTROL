import AppShell from '@/components/layout/AppShell'
import { EMPRESAS } from '@/lib/utils'
import { Settings, Database, Bell, Mail } from 'lucide-react'

export default function ConfiguracionPage() {
  return (
    <AppShell title="Configuración">
      <div className="p-4 space-y-4">

        {/* Empresas */}
        <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
            <Settings size={16} className="text-[var(--primary)]" />
            <span className="font-semibold text-sm">Empresas configuradas</span>
          </div>
          {Object.entries(EMPRESAS).map(([key, emp]) => (
            <div key={key} className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] last:border-0">
              <span className={`w-3 h-3 rounded-full ${emp.dot}`} />
              <span className="text-sm font-medium flex-1">{emp.label}</span>
              <span className="text-xs text-green-600 font-medium">Activa</span>
            </div>
          ))}
        </div>

        {/* Base de datos */}
        <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
            <Database size={16} className="text-[var(--primary)]" />
            <span className="font-semibold text-sm">Base de datos</span>
          </div>
          <div className="px-4 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--muted-foreground)]">Supabase URL</span>
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-lg">Pendiente configurar</span>
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">
              Configurá las variables de entorno NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY para activar la persistencia de datos.
            </p>
          </div>
        </div>

        {/* Notificaciones */}
        <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
            <Bell size={16} className="text-[var(--primary)]" />
            <span className="font-semibold text-sm">Alertas automáticas</span>
          </div>
          <div className="px-4 py-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Licitaciones — avisar con</span>
              <span className="font-semibold">3 días</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Tareas sin cerrar — avisar a los</span>
              <span className="font-semibold">5 días</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Reporte matutino de emails</span>
              <span className="font-semibold text-green-600">08:00 hs</span>
            </div>
          </div>
        </div>

        {/* Email */}
        <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
            <Mail size={16} className="text-[var(--primary)]" />
            <span className="font-semibold text-sm">Gmail conectado</span>
          </div>
          <div className="px-4 py-3">
            <p className="text-sm text-[var(--muted-foreground)]">fmanzone@ostara360.com.ar</p>
            <p className="text-xs text-green-600 font-medium mt-1">✓ Conectado vía OAuth</p>
          </div>
        </div>

      </div>
    </AppShell>
  )
}
