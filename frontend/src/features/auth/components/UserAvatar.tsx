import { useRef } from 'react'
import { cn } from '@/shared/utils/cn'
import { toast } from '@/shared/stores/toast.store'
import { useProfileStore } from '../stores/profile.store'
import { getInitials } from '../utils/getInitials'

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024

interface UserAvatarProps {
  userId: string
  nome: string
  size?: 'sm' | 'md'
  className?: string
}

const sizeStyles = {
  sm: 'size-9 text-xs',
  md: 'size-12 text-sm',
} as const

export function UserAvatar({
  userId,
  nome,
  size = 'md',
  className,
}: UserAvatarProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const avatarUrl = useProfileStore((state) => state.avatars[userId] ?? null)
  const setAvatar = useProfileStore((state) => state.setAvatar)
  const initials = getInitials(nome)

  const handleSelectImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      toast('Selecione um arquivo de imagem válido', 'error')
      return
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      toast('A imagem deve ter no máximo 2 MB', 'error')
      return
    }

    try {
      const dataUrl = await readFileAsDataUrl(file)
      setAvatar(userId, dataUrl)
      toast('Foto atualizada com sucesso', 'success')
    } catch {
      toast('Não foi possível carregar a imagem', 'error')
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        title="Clique para alterar a foto"
        aria-label="Alterar foto do perfil"
        className={cn(
          'group relative shrink-0 overflow-hidden rounded-full border border-border/70',
          'bg-primary/15 text-primary transition-transform hover:scale-[1.02]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
          sizeStyles[size],
          className,
        )}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={`Foto de ${nome}`}
            className="size-full object-cover"
          />
        ) : (
          <span className="flex size-full items-center justify-center font-semibold">
            {initials}
          </span>
        )}

        <span
          className={cn(
            'absolute inset-0 flex items-center justify-center bg-black/55 px-1 text-center',
            'text-[10px] font-medium leading-tight text-white opacity-0 transition-opacity',
            'group-hover:opacity-100 group-focus-visible:opacity-100',
          )}
        >
          Alterar foto
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleSelectImage}
      />
    </>
  )
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }

      reject(new Error('Leitura inválida'))
    }

    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}
