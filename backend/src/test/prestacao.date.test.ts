import { describe, it, expect } from 'vitest'
import { toUtcDateOnly, toUtcDateOnlyFromLocal } from '../utils/date.utils.js'

describe('prestacao date normalization', () => {
  it('preserva o dia 31 ao normalizar string YYYY-MM-DD', () => {
    const date = toUtcDateOnly('2026-07-31')

    expect(date.toISOString()).toBe('2026-07-31T00:00:00.000Z')
  })

  it('não desloca dia ao buscar com Date UTC já normalizado', () => {
    const normalized = toUtcDateOnly('2026-07-31')
    const wronglyShifted = toUtcDateOnlyFromLocal(normalized)

    expect(wronglyShifted.toISOString()).toBe('2026-07-30T00:00:00.000Z')
    expect(toUtcDateOnly(normalized).toISOString()).toBe(
      '2026-07-31T00:00:00.000Z',
    )
  })
})
