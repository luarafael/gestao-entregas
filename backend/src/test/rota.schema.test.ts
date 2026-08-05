import { describe, it, expect } from 'vitest'
import {
  DEFAULT_ENDERECO_PARTIDA,
  updateEnderecoPartidaSchema,
} from '../schemas/rota.schema.js'

describe('rota schemas', () => {
  it('valida atualização do endereço de partida', () => {
    const parsed = updateEnderecoPartidaSchema.parse({
      enderecoPartidaPadrao: DEFAULT_ENDERECO_PARTIDA,
    })

    expect(parsed.enderecoPartidaPadrao).toBe(DEFAULT_ENDERECO_PARTIDA)
  })

  it('rejeita endereço de partida vazio', () => {
    expect(() =>
      updateEnderecoPartidaSchema.parse({
        enderecoPartidaPadrao: '   ',
      }),
    ).toThrow()
  })
})
