import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApiError, apiFetch } from './api'

describe('apiFetch', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('retorna JSON quando resposta é ok', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    } as Response)

    await expect(apiFetch('/test')).resolves.toEqual({ ok: true })
  })

  it('lança ApiError quando resposta falha', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Dados inválidos' }),
    } as Response)

    await expect(apiFetch('/test')).rejects.toBeInstanceOf(ApiError)
  })

  it('usa mensagem padrão quando corpo não informa erro', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('invalid json')
      },
    } as unknown as Response)

    await expect(apiFetch('/test')).rejects.toThrow('Erro na requisição')
  })

  it('retorna undefined para status 204', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => ({}),
    } as Response)

    await expect(apiFetch('/test')).resolves.toBeUndefined()
  })
})
