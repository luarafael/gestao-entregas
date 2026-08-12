export interface AdminUser {
  id: string
  nome: string
  email: string
  fotoPerfil?: string | null
  role: 'ADMIN'
  ativo: boolean
  criadoEm: string
  atualizadoEm: string
}
