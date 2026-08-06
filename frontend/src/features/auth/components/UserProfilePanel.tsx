import { Button } from '@/shared/components/ui'
import { cn } from '@/shared/utils/cn'
import type { AuthUser } from '../schemas/auth.schema'
import { UserAvatar } from './UserAvatar'

interface UserProfilePanelProps {
  user: AuthUser
  onLogout: () => void
  layout?: 'sidebar' | 'navbar'
  className?: string
}

const logoutButtonClassName = cn(
  'border-danger bg-danger text-white shadow-sm shadow-danger/25',
  'hover:border-danger hover:bg-danger/90 hover:shadow-md hover:shadow-danger/30',
)

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
        <Button
          variant="danger"
          size="sm"
          onClick={onLogout}
          className={logoutButtonClassName}
        >
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
        </div>
      </div>

      <Button
        variant="danger"
        size="sm"
        onClick={onLogout}
        className={cn('w-full', logoutButtonClassName)}
      >
        Sair
      </Button>
    </div>
  )
}
