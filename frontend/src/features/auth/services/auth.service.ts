import { apiFetch } from '@/shared/services/api'
import type { AuthUser, LoginResponse } from '../schemas/auth.schema'

export const authService = {
  login(email: string, senha: string) {
    return apiFetch<LoginResponse>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, senha }),
      },
      { auth: false },
    )
  },

  me() {
    return apiFetch<AuthUser>('/api/auth/me')
  },

  updatePix(pix: string) {
    return apiFetch<AuthUser>('/api/auth/me/pix', {
      method: 'PATCH',
      body: JSON.stringify({ pix }),
    })
  },

  updateFoto(fotoPerfil: string | null) {
    return apiFetch<AuthUser>('/api/auth/me/foto', {
      method: 'PATCH',
      body: JSON.stringify({ fotoPerfil }),
    })
  },

  changePassword(senha: string, confirmacaoSenha: string) {
    return apiFetch<AuthUser>('/api/auth/me/senha', {
      method: 'PATCH',
      body: JSON.stringify({ senha, confirmacaoSenha }),
    })
  },
}
