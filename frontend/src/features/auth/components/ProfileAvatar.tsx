import { cn } from '@/shared/utils/cn'
import { useProfileStore } from '../stores/profile.store'
import { getInitials } from '../utils/getInitials'

const sizeStyles = {
  sm: 'size-9 text-xs',
  md: 'size-11 text-sm',
  lg: 'size-12 text-base',
} as const

interface ProfileAvatarProps {
  userId: string
  nome: string
  /** Foto vinda da API — tem prioridade sobre cache local */
  fotoUrl?: string | null
  size?: keyof typeof sizeStyles
  className?: string
}

/**
 * Avatar somente leitura (monitoramento, listas, etc.).
 * Usa foto da API quando disponível; senão cache local do profile store.
 */
export function ProfileAvatar({
  userId,
  nome,
  fotoUrl,
  size = 'md',
  className,
}: ProfileAvatarProps) {
  const storedAvatar = useProfileStore((state) => state.avatars[userId] ?? null)
  const avatarUrl = fotoUrl ?? storedAvatar
  const initials = getInitials(nome)

  return (
    <span
      className={cn(
        'inline-flex shrink-0 overflow-hidden rounded-full border border-border/70',
        'bg-primary/15 text-primary',
        sizeStyles[size],
        className,
      )}
      aria-hidden
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="size-full object-cover" />
      ) : (
        <span className="flex size-full items-center justify-center font-semibold">
          {initials}
        </span>
      )}
    </span>
  )
}
