export interface AuthUser {
  id: string
  nome: string
  email: string
  role: 'ADMIN' | 'MOTOBOY'
  mustChangePassword: boolean
  pix?: string | null
  fotoPerfil?: string | null
}

export type UserRole = AuthUser['role']

export interface LoginResponse {
  token: string
  user: AuthUser
}
