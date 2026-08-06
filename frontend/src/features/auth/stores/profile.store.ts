import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ProfileState {
  avatars: Record<string, string>
  setAvatar: (userId: string, dataUrl: string | null) => void
  getAvatar: (userId: string) => string | null
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      avatars: {},

      setAvatar: (userId, dataUrl) => {
        set((state) => {
          const avatars = { ...state.avatars }

          if (dataUrl) {
            avatars[userId] = dataUrl
          } else {
            delete avatars[userId]
          }

          return { avatars }
        })
      },

      getAvatar: (userId) => get().avatars[userId] ?? null,
    }),
    {
      name: 'gestao-entregas.user-profiles',
      partialize: (state) => ({ avatars: state.avatars }),
    },
  ),
)
