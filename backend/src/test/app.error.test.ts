import { describe, it, expect } from 'vitest'
import {
  AppError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../errors/app.error.js'

describe('app errors', () => {
  it('cria AppError com status e mensagem', () => {
    const error = new AppError(418, 'Teste')

    expect(error.statusCode).toBe(418)
    expect(error.message).toBe('Teste')
    expect(error.name).toBe('AppError')
  })

  it('cria NotFoundError com status 404', () => {
    const error = new NotFoundError('Entrega não encontrada')

    expect(error.statusCode).toBe(404)
    expect(error.name).toBe('NotFoundError')
  })

  it('cria ConflictError com status 409', () => {
    const error = new ConflictError()

    expect(error.statusCode).toBe(409)
    expect(error.name).toBe('ConflictError')
  })

  it('cria ValidationError com status 400', () => {
    const error = new ValidationError('Campo inválido')

    expect(error.statusCode).toBe(400)
    expect(error.message).toBe('Campo inválido')
  })
})
