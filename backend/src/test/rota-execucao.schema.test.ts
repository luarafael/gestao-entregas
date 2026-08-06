import { describe, it, expect } from 'vitest'
import { statusExecucaoParadaSchema } from '../schemas/rota-execucao.schema.js'

describe('rota-execucao.schema', () => {
  it('aceita status válidos', () => {
    expect(statusExecucaoParadaSchema.parse('ENTREGUE')).toBe('ENTREGUE')
    expect(statusExecucaoParadaSchema.parse('CLIENTE_AUSENTE')).toBe(
      'CLIENTE_AUSENTE',
    )
  })
})
