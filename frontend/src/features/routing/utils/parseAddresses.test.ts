import { describe, it, expect } from 'vitest'
import { parsePastedAddresses } from './parseAddresses'

describe('parsePastedAddresses', () => {
  it('interpreta nome + endereço', () => {
    const stops = parsePastedAddresses('João\nRua A, 120\n\nMaria\nRua B, 500')

    expect(stops).toHaveLength(2)
    expect(stops[0]?.cliente).toBe('João')
    expect(stops[0]?.endereco).toBe('Rua A, 120')
    expect(stops[1]?.cliente).toBe('Maria')
  })

  it('interpreta apenas endereços', () => {
    const stops = parsePastedAddresses('Rua A, 120\n\nRua B, 500')

    expect(stops).toHaveLength(2)
    expect(stops[0]?.cliente).toBeUndefined()
    expect(stops[0]?.endereco).toContain('Rua A')
  })
})
