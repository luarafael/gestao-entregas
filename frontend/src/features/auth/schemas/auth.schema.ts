export interface AuthUser {
  id: string
  nome: string
  email: string
  role: 'ADMIN' | 'MOTOBOY'
}

export interface LoginResponse {
  token: string
  user: AuthUser
}
