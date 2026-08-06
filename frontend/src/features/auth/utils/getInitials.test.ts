import { describe, it, expect } from 'vitest'
import { getInitials } from './getInitials'

describe('getInitials', () => {
  it('retorna iniciais do primeiro e ultimo nome', () => {
    expect(getInitials('Luã Rafael')).toBe('LR')
  })

  it('retorna duas letras para nome unico', () => {
    expect(getInitials('Administrador')).toBe('AD')
  })

  it('retorna ? para nome vazio', () => {
    expect(getInitials('   ')).toBe('?')
  })
})
