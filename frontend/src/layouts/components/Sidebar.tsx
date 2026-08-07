import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  IconHome,
  IconPackage,
  IconClock,
  IconReceipt,
  IconChart,
  IconRoute,
  IconTrending,
  IconEye,
  IconUsers,
} from '@/shared/components/icons'
import { cn } from '@/shared/utils/cn'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { UserProfilePanel } from '@/features/auth/components/UserProfilePanel'
import type { UserRole } from '@/features/auth/schemas/auth.schema'

const APP_NAME = import.meta.env.VITE_APP_NAME ?? 'Sistema Rotas'
const APP_SUBTITLE =
  import.meta.env.VITE_APP_SUBTITLE ?? 'Gestão de entregas'

const navItems: Array<{
  to: string
  label: string
  icon: typeof IconHome
  roles: UserRole[]
}> = [
  { to: '/', label: 'Dashboard', icon: IconHome, roles: ['ADMIN', 'MOTOBOY'] },
  { to: '/meu-dia', label: 'Meu dia', icon: IconTrending, roles: ['MOTOBOY'] },
  { to: '/minha-prestacao', label: 'Minha prestação', icon: IconReceipt, roles: ['MOTOBOY'] },
  { to: '/motoboys', label: 'Motoboys', icon: IconUsers, roles: ['ADMIN'] },
  { to: '/entregas', label: 'Entregas', icon: IconPackage, roles: ['ADMIN', 'MOTOBOY'] },
  { to: '/pendencias', label: 'Pendências', icon: IconClock, roles: ['ADMIN', 'MOTOBOY'] },
  { to: '/aprovacoes', label: 'Aprovações', icon: IconReceipt, roles: ['ADMIN'] },
  { to: '/monitoramento', label: 'Monitoramento', icon: IconEye, roles: ['ADMIN'] },
  { to: '/prestacao', label: 'Prestação', icon: IconReceipt, roles: ['ADMIN'] },
  { to: '/relatorios', label: 'Relatórios', icon: IconChart, roles: ['ADMIN'] },
  {
    to: '/planejador',
    label: 'Planejador de Rotas',
    icon: IconRoute,
    roles: ['ADMIN', 'MOTOBOY'],
  },
]

interface SidebarProps {
  onNavigate?: () => void
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  const handleLogout = () => {
    logout()
    onNavigate?.()
    navigate('/login', { replace: true })
  }

  const visibleNavItems = navItems.filter((item) =>
    user ? item.roles.includes(user.role) : false,
  )

  return (
    <aside className="flex h-full flex-col border-r border-border/60 bg-card/40 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 border-b border-border/60 px-5">
        <div className="flex size-12 shrink-0 items-center justify-center">
          <img
            src="/app-logo.png"
            alt={APP_NAME}
            className="max-h-full max-w-full object-contain object-center"
          />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight">{APP_NAME}</p>
          <p className="text-xs text-muted-foreground">{APP_SUBTITLE}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {visibleNavItems.map((item) => (
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

      <div className="border-t border-border/60 p-4 space-y-3">
        {user ? <UserProfilePanel user={user} onLogout={handleLogout} /> : null}
        <p className="text-xs text-muted-foreground">
          Controle diário de entregas e prestação de contas.
        </p>
      </div>
    </aside>
  )
}
