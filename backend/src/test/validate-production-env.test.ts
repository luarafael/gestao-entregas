import { describe, it, expect } from 'vitest'
import { validateProductionEnv } from '../config/validate-production-env.js'

describe('validateProductionEnv', () => {
  it('ignora validacao fora de producao', () => {
    expect(() =>
      validateProductionEnv({
        NODE_ENV: 'development',
        JWT_SECRET: 'curto',
        ADMIN_PASSWORD: 'admin123',
      }),
    ).not.toThrow()
  })

  it('rejeita JWT_SECRET fraco em producao', () => {
    expect(() =>
      validateProductionEnv({
        NODE_ENV: 'production',
        JWT_SECRET: 'altere-este-segredo-em-producao',
        ADMIN_PASSWORD: 'senha-forte-123',
      }),
    ).toThrow(/JWT_SECRET inseguro/)
  })

  it('aceita JWT_SECRET forte em producao', () => {
    expect(() =>
      validateProductionEnv({
        NODE_ENV: 'production',
        JWT_SECRET: 'a'.repeat(48),
        ADMIN_PASSWORD: 'senha-forte-123',
      }),
    ).not.toThrow()
  })
})
