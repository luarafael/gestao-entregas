import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  clearAuthSessionStorage,
  getAccessToken,
  setAccessToken,
} from '../auth-token'
import { authService } from '../services/auth.service'
import type { AuthUser } from '../schemas/auth.schema'
import { syncUserAvatar } from '../utils/syncUserAvatar'
import { useProfileStore } from '../stores/profile.store'

function normalizeUser(user: AuthUser): AuthUser {
  if ((user.role as string) === 'OPERADOR') {
    return { ...user, role: 'MOTOBOY' }
  }

  return user
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  isHydrated: boolean
  setSession: (token: string, user: AuthUser) => void
  clearSession: () => void
  setHydrated: (value: boolean) => void
  login: (email: string, senha: string) => Promise<void>
  logout: () => void
  restoreSession: () => Promise<boolean>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isHydrated: false,

      setSession: (token, user) => {
        setAccessToken(token)
        const normalized = normalizeUser(user)
        syncUserAvatar(normalized.id, normalized.fotoPerfil)
        set({ token, user: normalized })
      },

      clearSession: () => {
        clearAuthSessionStorage()
        set({ token: null, user: null })
      },

      setHydrated: (value) => set({ isHydrated: value }),

      login: async (email, senha) => {
        const result = await authService.login(email, senha)
        get().setSession(result.token, result.user)
      },

      logout: () => {
        get().clearSession()
      },

      restoreSession: async () => {
        const token = get().token ?? getAccessToken()
        if (!token) {
          get().clearSession()
          return false
        }

        setAccessToken(token)

        try {
          let user = await authService.me()
          let normalized = normalizeUser(user)

          const localAvatar = useProfileStore.getState().getAvatar(normalized.id)
          if (!normalized.fotoPerfil && localAvatar) {
            try {
              user = await authService.updateFoto(localAvatar)
              normalized = normalizeUser(user)
            } catch {
              // Mantém foto local se a sincronização falhar.
            }
          }

          syncUserAvatar(normalized.id, normalized.fotoPerfil)
          set({ token, user: normalized })
          return true
        } catch {
          get().clearSession()
          return false
        }
      },
    }),
    {
      name: 'gestao-entregas.auth-session',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          setAccessToken(state.token)
        }
      },
    },
  ),
)
