export interface Motoboy {
  id: string
  nome: string
  email: string
  pix: string | null
  fotoPerfil?: string | null
  role: 'MOTOBOY'
  ativo: boolean
  criadoEm: string
  atualizadoEm: string
}
