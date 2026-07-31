import { describe, it, expect } from 'vitest'
import { cn, formatCurrency } from './cn'

describe('cn utils', () => {
  it('combina classes válidas', () => {
    expect(cn('a', false, null, 'b')).toBe('a b')
  })

  it('formata moeda em BRL', () => {
    expect(formatCurrency(10)).toContain('10,00')
  })
})
