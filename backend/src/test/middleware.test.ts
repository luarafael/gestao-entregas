import { describe, it, expect, vi } from 'vitest'
import { z } from 'zod'
import type { NextFunction, Request, Response } from 'express'
import {
  asyncHandler,
  errorHandler,
  getRouteParam,
  getValidatedQuery,
  validateBody,
  validateQuery,
} from '../middleware/index.js'
import { AppError, NotFoundError } from '../errors/app.error.js'

function createMockResponse() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  }

  return res as unknown as Response
}

describe('middleware', () => {
  it('retorna parâmetro de rota válido', () => {
    const req = { params: { id: 'abc' } } as Request

    expect(getRouteParam(req, 'id')).toBe('abc')
  })

  it('lança erro para parâmetro inválido', () => {
    const req = { params: { id: ['x'] } } as unknown as Request

    expect(() => getRouteParam(req, 'id')).toThrow(AppError)
  })

  it('valida body com schema', () => {
    const schema = z.object({ name: z.string() })
    const middleware = validateBody(schema)
    const req = { body: { name: 'João' } } as Request
    const next = vi.fn()

    middleware(req, createMockResponse(), next as NextFunction)

    expect(req.body).toEqual({ name: 'João' })
    expect(next).toHaveBeenCalled()
  })

  it('repassa erro de validação do body', () => {
    const schema = z.object({ name: z.string() })
    const middleware = validateBody(schema)
    const req = { body: { name: 123 } } as Request
    const next = vi.fn()

    middleware(req, createMockResponse(), next as NextFunction)

    expect(next).toHaveBeenCalled()
  })

  it('valida query e armazena em validatedQuery', () => {
    const schema = z.object({ page: z.coerce.number().default(1) })
    const middleware = validateQuery(schema)
    const req = { query: { page: '2' } } as Request
    const next = vi.fn()

    middleware(req, createMockResponse(), next as NextFunction)

    expect(getValidatedQuery<{ page: number }>(req).page).toBe(2)
  })

  it('trata ZodError no errorHandler', () => {
    const res = createMockResponse()
    const error = new z.ZodError([
      {
        code: 'custom',
        message: 'Campo inválido',
        path: ['field'],
      },
    ])

    errorHandler(error, {} as Request, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('trata AppError no errorHandler', () => {
    const res = createMockResponse()

    errorHandler(new NotFoundError('Não encontrado'), {} as Request, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('exige validatedQuery preenchido', () => {
    expect(() => getValidatedQuery({} as Request)).toThrow(AppError)
  })

  it('trata erro genérico no errorHandler', () => {
    const res = createMockResponse()
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    errorHandler(new Error('Falha'), {} as Request, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(500)
    consoleSpy.mockRestore()
  })

  it('repassa erro para next no asyncHandler', async () => {
    const next = vi.fn()
    const handler = asyncHandler(async () => {
      throw new AppError(400, 'Falha')
    })

    handler({} as Request, createMockResponse(), next as NextFunction)

    await vi.waitFor(() => {
      expect(next).toHaveBeenCalled()
    })
  })
})
