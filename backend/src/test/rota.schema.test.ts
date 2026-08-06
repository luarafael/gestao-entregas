import { describe, it, expect } from 'vitest'
import {
  DEFAULT_ENDERECO_PARTIDA,
  optimizeRotaSchema,
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

  it('aceita preservarOrdem no optimize', () => {
    const parsed = optimizeRotaSchema.parse({
      enderecoInicial: 'Rua A, 1',
      preservarOrdem: true,
      paradas: [
        {
          tempId: '1',
          endereco: 'Rua B, 2',
          ordem: 2,
        },
        {
          tempId: '2',
          endereco: 'Rua C, 3',
          ordem: 1,
        },
      ],
    })

    expect(parsed.preservarOrdem).toBe(true)
    expect(parsed.paradas[0]?.ordem).toBe(2)
  })
})
