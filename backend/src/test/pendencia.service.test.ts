import { beforeEach, describe, it, expect, vi } from 'vitest'
import { PendenciaService } from '../services/pendencia.service.js'
import { NotFoundError } from '../errors/app.error.js'

const pendenciaRepository = vi.hoisted(() => ({
  create: vi.fn(),
  findById: vi.fn(),
  findMany: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('../repositories/pendencia.repository.js', () => ({
  pendenciaRepository,
}))

describe('PendenciaService', () => {
  const service = new PendenciaService()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('cria pendência', async () => {
    pendenciaRepository.create.mockResolvedValue({ id: '1' })

    const result = await service.create({
      descricao: 'Teste',
      valor: 10,
      referenteAoDia: new Date('2026-07-12'),
      status: 'PENDENTE',
    })

    expect(result).toEqual({ id: '1' })
  })

  it('lança NotFoundError quando pendência não existe', async () => {
    pendenciaRepository.findById.mockResolvedValue(null)

    await expect(service.findById('x')).rejects.toBeInstanceOf(NotFoundError)
  })

  it('atualiza pendência existente', async () => {
    pendenciaRepository.findById.mockResolvedValue({ id: '1' })
    pendenciaRepository.update.mockResolvedValue({ id: '1', status: 'RECEBIDO' })

    const result = await service.update('1', { status: 'RECEBIDO' })

    expect(result.status).toBe('RECEBIDO')
  })

  it('exclui pendência existente', async () => {
    pendenciaRepository.findById.mockResolvedValue({ id: '1' })
    pendenciaRepository.delete.mockResolvedValue({ id: '1' })

    await expect(service.delete('1')).resolves.toEqual({ id: '1' })
  })

  it('lista pendências paginadas', async () => {
    pendenciaRepository.findMany.mockResolvedValue({
      data: [{ id: '1' }],
      total: 1,
    })

    const result = await service.list({ page: 1, limit: 10 })

    expect(result.data).toHaveLength(1)
  })
})
