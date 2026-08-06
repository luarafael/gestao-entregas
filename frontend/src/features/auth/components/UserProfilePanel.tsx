import { Button } from '@/shared/components/ui'
import { cn } from '@/shared/utils/cn'
import type { AuthUser } from '../schemas/auth.schema'
import { getRoleLabel } from '../utils/permissions'
import { UserAvatar } from './UserAvatar'

interface UserProfilePanelProps {
  user: AuthUser
  onLogout: () => void
  layout?: 'sidebar' | 'navbar'
  className?: string
}

export function UserProfilePanel({
  user,
  onLogout,
  layout = 'sidebar',
  className,
}: UserProfilePanelProps) {
  if (layout === 'navbar') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <UserAvatar userId={user.id} nome={user.nome} size="sm" />
        <span className="max-w-40 truncate text-xs font-medium text-foreground">
          {user.nome}
        </span>
        <Button variant="dangerSolid" size="sm" onClick={onLogout}>
          Sair
        </Button>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-3">
        <UserAvatar userId={user.id} nome={user.nome} size="md" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{user.nome}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          <p className="text-[11px] font-medium text-primary">{getRoleLabel(user.role)}</p>
        </div>
      </div>

      <Button variant="dangerSolid" size="sm" onClick={onLogout} className="w-full">
        Sair
      </Button>
    </div>
  )
}
