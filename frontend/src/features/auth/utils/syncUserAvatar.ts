import { useProfileStore } from '../stores/profile.store'

/** Mantém cache local alinhado com a foto persistida no servidor. */
export function syncUserAvatar(userId: string, fotoPerfil?: string | null) {
  if (fotoPerfil) {
    useProfileStore.getState().setAvatar(userId, fotoPerfil)
    return
  }

  useProfileStore.getState().setAvatar(userId, null)
}
