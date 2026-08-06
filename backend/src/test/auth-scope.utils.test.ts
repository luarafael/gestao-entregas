import { describe, it, expect } from 'vitest'
import { ForbiddenError } from '../errors/app.error.js'
import { resolveMotoboyScope, assertOwnsResource } from '../utils/auth-scope.utils.js'
import type { AuthenticatedUser } from '../middleware/auth.middleware.js'

const motoboy: AuthenticatedUser = {
  id: 'm1',
  email: 'm@test.com',
  role: 'MOTOBOY',
  nome: 'Motoboy',
}

const admin: AuthenticatedUser = {
  id: 'a1',
  email: 'a@test.com',
  role: 'ADMIN',
  nome: 'Admin',
}

describe('auth-scope.utils', () => {
  it('admin pode filtrar por motoboy específico', () => {
    expect(resolveMotoboyScope(admin, 'm1')).toBe('m1')
    expect(resolveMotoboyScope(admin)).toBeUndefined()
  })

  it('motoboy só acessa o próprio escopo', () => {
    expect(resolveMotoboyScope(motoboy)).toBe('m1')
    expect(() => resolveMotoboyScope(motoboy, 'outro')).toThrow(ForbiddenError)
  })

  it('motoboy não acessa recurso de outro', () => {
    expect(() => assertOwnsResource(motoboy, 'outro')).toThrow(ForbiddenError)
    expect(() => assertOwnsResource(motoboy, 'm1')).not.toThrow()
    expect(() => assertOwnsResource(admin, 'outro')).not.toThrow()
  })
})
