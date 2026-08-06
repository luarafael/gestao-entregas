export interface AuthUser {
  id: string
  nome: string
  email: string
  role: 'ADMIN' | 'OPERADOR'
}

export interface LoginResponse {
  token: string
  user: AuthUser
}
