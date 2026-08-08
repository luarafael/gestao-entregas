export const motoboyRelationSelect = {
  id: true,
  nome: true,
  fotoPerfil: true,
} as const

export type MotoboyRelation = {
  id: string
  nome: string
  fotoPerfil: string | null
}
