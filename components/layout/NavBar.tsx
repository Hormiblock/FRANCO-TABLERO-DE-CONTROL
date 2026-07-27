'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CalendarDays,
  CheckSquare,
  FileWarning,
  Mail,
  MessageSquarePlus,
  Users,
  TrendingUp,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/dashboard',     label: 'Inicio',       icon: LayoutDashboard  },
  { href: '/calendario',    label: 'Calendario',   icon: CalendarDays     },
  { href: '/pendientes',    label: 'Pendientes',   icon: CheckSquare      },
  { href: '/licitaciones',  label: 'Licitaciones', icon: FileWarning      },
  { href: '/emails',        label: 'Emails',       icon: Mail             },
  { href: '/chat',          label: 'Asignar',      icon: MessageSquarePlus},
  { href: '/gerentes',      label: 'Gerentes',     icon: Users            },
  { href: '/rendimiento',   label: 'Rendimiento',  icon: TrendingUp       },
  { href: '/configuracion', label: 'Config.',      icon: Settings         },
]

export default function NavBar() {
  const pathname = usePathname()

  return (
    <nav className="fixed left-0 top-0 bottom-0 z-50 bg-white border-r border-[var(--border)] flex flex-col pt-safe-top w-16 md:w-48">
      {/* Brand */}
      <div className="h-14 flex items-center justify-center md:justify-start md:px-4 border-b border-[var(--border)] shrink-0">
        <span className="hidden md:block text-xs font-bold text-[var(--primary)] truncate leading-tight">Franco Tablero<br/>de Control</span>
        <span className="md:hidden text-[10px] font-bold text-[var(--primary)]">FT</span>
      </div>

      {/* Empresas badges */}
      <div className="hidden md:flex flex-col gap-1 px-3 py-3 border-b border-[var(--border)]">
        <span className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Empresas</span>
        {[
          { label: 'Ostara',     dot: 'bg-purple-500' },
          { label: 'Hormiblock', dot: 'bg-blue-600'   },
          { label: 'Blockera',   dot: 'bg-amber-600'  },
          { label: 'Granny',     dot: 'bg-green-600'  },
        ].map(e => (
          <div key={e.label} className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full shrink-0 ${e.dot}`} />
            <span className="text-xs text-[var(--foreground)]">{e.label}</span>
          </div>
        ))}
      </div>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto py-2 flex flex-col gap-0.5">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = href === '/configuracion'
            ? pathname === '/configuracion'
            : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 mx-1.5 px-2 py-2.5 rounded-xl text-xs font-medium transition-colors',
                active
                  ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} className="shrink-0" />
              <span className="hidden md:block truncate">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
