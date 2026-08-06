import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  clearAuthSessionStorage,
  getAccessToken,
  setAccessToken,
} from '../auth-token'
import { authService } from '../services/auth.service'
import type { AuthUser } from '../schemas/auth.schema'

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
        set({ token, user: normalizeUser(user) })
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
          const user = await authService.me()
          set({ token, user: normalizeUser(user) })
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
