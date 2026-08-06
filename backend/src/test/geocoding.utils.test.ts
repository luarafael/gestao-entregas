import { describe, it, expect } from 'vitest'
import {
  buildGeocodeCandidates,
  resolveAddressParts,
} from '../utils/geocoding.utils.js'

describe('geocoding.utils', () => {
  it('separa endereço e bairro quando informados separadamente', () => {
    const parts = resolveAddressParts({
      endereco: 'Rua Tenente Roma, 598',
      bairro: 'Alto da Balança',
    })

    expect(parts.street).toBe('Rua Tenente Roma, 598')
    expect(parts.bairro).toBe('Alto da Balança')
  })

  it('extrai bairro do final do endereço', () => {
    const parts = resolveAddressParts({
      endereco: 'Travessa Icó, 72 - Centro',
    })

    expect(parts.street).toBe('Travessa Icó, 72')
    expect(parts.bairro).toBe('Centro')
  })

  it('monta candidatos com bairro e cidade padrão', () => {
    const candidates = buildGeocodeCandidates({
      endereco: 'R. Cinco, 27',
      bairro: 'Conjunto Esperança',
    })

    expect(candidates[0]).toContain('Conjunto Esperança')
    expect(candidates[0]).toContain('Fortaleza')
    expect(candidates.some((item) => item.includes('R. Cinco, 27'))).toBe(true)
  })
})
