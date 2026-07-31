import { describe, it, expect } from 'vitest'
import { listEntregasSchema } from '../schemas/entrega.schema.js'
import { listPendenciasSchema } from '../schemas/pendencia.schema.js'

describe('list query schemas', () => {
  it('converte page e limit para número nas entregas', () => {
    const parsed = listEntregasSchema.parse({
      page: '2',
      limit: '10',
      filter: 'today',
      sortBy: 'horario',
      sortOrder: 'desc',
    })

    expect(parsed.page).toBe(2)
    expect(parsed.limit).toBe(10)
    expect(typeof parsed.page).toBe('number')
    expect(typeof parsed.limit).toBe('number')
  })

  it('converte page e limit para número nas pendências', () => {
    const parsed = listPendenciasSchema.parse({
      page: '1',
      limit: '10',
    })

    expect(parsed.page).toBe(1)
    expect(parsed.limit).toBe(10)
  })
})
