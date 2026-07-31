import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  IconHome,
  IconPackage,
  IconClock,
  IconReceipt,
  IconChart,
} from '@/shared/components/icons'
import { cn } from '@/shared/utils/cn'

const navItems = [
  { to: '/', label: 'Dashboard', icon: IconHome },
  { to: '/entregas', label: 'Entregas', icon: IconPackage },
  { to: '/pendencias', label: 'Pendências', icon: IconClock },
  { to: '/prestacao', label: 'Prestação', icon: IconReceipt },
  { to: '/relatorios', label: 'Relatórios', icon: IconChart },
]

interface SidebarProps {
  onNavigate?: () => void
}

export function Sidebar({ onNavigate }: SidebarProps) {
  return (
    <aside className="flex h-full flex-col border-r border-border/60 bg-card/40 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 border-b border-border/60 px-5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <IconPackage className="size-5" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight">Sistema Rotas</p>
          <p className="text-xs text-muted-foreground">Gestão de entregas</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:bg-surface/70 hover:text-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive ? (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl border border-primary/20 bg-primary/10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                ) : null}
                <item.icon className="relative size-5 shrink-0" />
                <span className="relative">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border/60 p-4">
        <p className="text-xs text-muted-foreground">
          Controle diário de entregas e prestação de contas.
        </p>
      </div>
    </aside>
  )
}
