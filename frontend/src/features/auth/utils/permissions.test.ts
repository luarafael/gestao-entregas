import { describe, it, expect } from 'vitest'
import {
  canAccessRoute,
  getDefaultHomePath,
  getRoleLabel,
  isAdmin,
} from './permissions'

describe('permissions', () => {
  it('identifica admin', () => {
    expect(isAdmin('ADMIN')).toBe(true)
    expect(isAdmin('MOTOBOY')).toBe(false)
  })

  it('retorna rotas padrao por perfil', () => {
    expect(getDefaultHomePath('ADMIN')).toBe('/')
    expect(getDefaultHomePath('MOTOBOY')).toBe('/meu-dia')
  })

  it('bloqueia areas administrativas para motoboy', () => {
    expect(canAccessRoute('MOTOBOY', '/relatorios')).toBe(false)
    expect(canAccessRoute('MOTOBOY', '/prestacao')).toBe(false)
    expect(canAccessRoute('MOTOBOY', '/motoboys')).toBe(false)
    expect(canAccessRoute('MOTOBOY', '/pendencias')).toBe(true)
    expect(canAccessRoute('MOTOBOY', '/meu-dia')).toBe(true)
    expect(canAccessRoute('MOTOBOY', '/entregas')).toBe(true)
    expect(canAccessRoute('MOTOBOY', '/planejador')).toBe(true)
  })

  it('exibe rotulo em portugues', () => {
    expect(getRoleLabel('ADMIN')).toBe('Administrador')
    expect(getRoleLabel('MOTOBOY')).toBe('Motoboy')
  })
})
