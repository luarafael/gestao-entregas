import { useRef } from 'react'
import { cn } from '@/shared/utils/cn'
import { toast } from '@/shared/stores/toast.store'
import { authService } from '../services/auth.service'
import { useAuthStore } from '../stores/auth.store'
import { useProfileStore } from '../stores/profile.store'
import { ProfileAvatar } from './ProfileAvatar'

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024

interface UserAvatarProps {
  userId: string
  nome: string
  fotoUrl?: string | null
  size?: 'sm' | 'md'
  className?: string
}

const buttonSizeStyles = {
  sm: 'size-9',
  md: 'size-12',
} as const

export function UserAvatar({
  userId,
  nome,
  fotoUrl,
  size = 'md',
  className,
}: UserAvatarProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const setAvatar = useProfileStore((state) => state.setAvatar)

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
      const updated = await authService.updateFoto(dataUrl)
      setAvatar(userId, updated.fotoPerfil ?? dataUrl)

      const currentUser = useAuthStore.getState().user
      if (currentUser?.id === userId) {
        useAuthStore.setState({
          user: { ...currentUser, fotoPerfil: updated.fotoPerfil ?? dataUrl },
        })
      }

      toast('Foto atualizada com sucesso', 'success')
    } catch {
      toast('Não foi possível salvar a foto', 'error')
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
          'group relative shrink-0 overflow-hidden rounded-full',
          'transition-transform hover:scale-[1.02]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
          buttonSizeStyles[size],
          className,
        )}
      >
        <ProfileAvatar
          userId={userId}
          nome={nome}
          fotoUrl={fotoUrl}
          size={size}
          className="size-full"
        />

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
