import { describe, it, expect } from 'vitest'
import {
  buildGoogleMapsNavigationUrls,
  formatDistance,
  formatDuration,
} from './googleMapsUrl'

describe('googleMapsUrl', () => {
  it('gera url de navegação', () => {
    const urls = buildGoogleMapsNavigationUrls('Origem', [
      { endereco: 'Destino 1' },
      { endereco: 'Destino 2' },
    ])

    expect(urls).toHaveLength(1)
    expect(urls[0]).toContain('google.com/maps/dir')
    expect(urls[0]).toContain('Destino')
  })

  it('divide muitos destinos em vários links', () => {
    const stops = Array.from({ length: 10 }, (_, index) => ({
      endereco: `Rua ${index}`,
    }))
    const urls = buildGoogleMapsNavigationUrls('Origem', stops)
    expect(urls.length).toBeGreaterThan(1)
  })

  it('formata distância e duração', () => {
    expect(formatDistance(500)).toBe('500 m')
    expect(formatDistance(2500)).toBe('2.5 km')
    expect(formatDuration(90)).toBe('2 min')
    expect(formatDuration(3660)).toBe('1 h 1 min')
  })
})
