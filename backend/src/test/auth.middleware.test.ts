import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { NextFunction, Request, Response } from 'express'
import { ForbiddenError, UnauthorizedError } from '../errors/app.error.js'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'
import * as jwtUtils from '../utils/jwt.utils.js'

function createMockRequest(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    ...overrides,
  } as Request
}

function createMockResponse(): Response {
  return {} as Response
}

describe('auth.middleware', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('requireAuth rejeita requisicao sem token', () => {
    const next = vi.fn()
    requireAuth(createMockRequest(), createMockResponse(), next)

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError))
  })

  it('requireAuth normaliza role OPERADOR legada para MOTOBOY', () => {
    vi.spyOn(jwtUtils, 'verifyAuthToken').mockReturnValue({
      sub: 'user-1',
      email: 'motoboy@test.com',
      role: 'OPERADOR',
      nome: 'Motoboy',
    } as jwtUtils.AuthTokenPayload)

    const req = createMockRequest({
      headers: { authorization: 'Bearer token' },
    })
    const next = vi.fn()

    requireAuth(req, createMockResponse(), next)

    expect(req.user?.role).toBe('MOTOBOY')
    expect(next).toHaveBeenCalledWith()
  })

  it('requireRole bloqueia perfil sem permissao', () => {
    const req = createMockRequest({
      user: {
        id: 'user-1',
        email: 'motoboy@test.com',
        role: 'MOTOBOY',
        nome: 'Motoboy',
      },
    })
    const next = vi.fn()

    requireRole('ADMIN')(req, createMockResponse(), next)

    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError))
  })

  it('requireRole permite admin', () => {
    const req = createMockRequest({
      user: {
        id: 'user-1',
        email: 'admin@test.com',
        role: 'ADMIN',
        nome: 'Admin',
      },
    })
    const next = vi.fn()

    requireRole('ADMIN')(req, createMockResponse(), next)

    expect(next).toHaveBeenCalledWith()
  })
})
