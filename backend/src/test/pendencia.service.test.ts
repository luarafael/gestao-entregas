import { beforeEach, describe, it, expect, vi } from 'vitest'
import { PendenciaService } from '../services/pendencia.service.js'
import { ForbiddenError, NotFoundError } from '../errors/app.error.js'
import type { AuthenticatedUser } from '../middleware/auth.middleware.js'

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

const adminUser: AuthenticatedUser = {
  id: 'admin-1',
  email: 'admin@test.com',
  role: 'ADMIN',
  nome: 'Admin',
}

const motoboyUser: AuthenticatedUser = {
  id: 'motoboy-1',
  email: 'motoboy@test.com',
  role: 'MOTOBOY',
  nome: 'Motoboy',
}

describe('PendenciaService', () => {
  const service = new PendenciaService()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('admin cria pendência de cliente vinculada ao motoboy', async () => {
    pendenciaRepository.create.mockResolvedValue({ id: '1', tipo: 'CLIENTE' })

    await service.create(adminUser, {
      descricao: 'Cliente devendo',
      valor: 20,
      referenteAoDia: new Date('2026-08-05'),
      status: 'PENDENTE',
      motoboyId: 'motoboy-1',
    })

    expect(pendenciaRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: 'CLIENTE',
        motoboyId: 'motoboy-1',
      }),
    )
  })

  it('exige motoboyId quando admin cria pendência', async () => {
    await expect(
      service.create(adminUser, {
        descricao: 'Cliente devendo',
        valor: 20,
        referenteAoDia: new Date('2026-08-05'),
        status: 'PENDENTE',
      }),
    ).rejects.toThrow('Selecione o motoboy responsável pela pendência')
  })

  it('motoboy cria pendência de repasse', async () => {
    pendenciaRepository.create.mockResolvedValue({ id: '1', tipo: 'REPASSE_MOTOBOY' })

    await service.create(motoboyUser, {
      descricao: 'Repasse não pago',
      valor: 50,
      referenteAoDia: new Date('2026-08-05'),
      status: 'PENDENTE',
    })

    expect(pendenciaRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: 'REPASSE_MOTOBOY',
        motoboyId: 'motoboy-1',
        status: 'PENDENTE',
      }),
    )
  })

  it('motoboy não pode marcar pendência como recebida', async () => {
    pendenciaRepository.findById.mockResolvedValue({
      id: '1',
      tipo: 'REPASSE_MOTOBOY',
      motoboyId: 'motoboy-1',
      status: 'PENDENTE',
    })

    await expect(
      service.update(motoboyUser, '1', { status: 'RECEBIDO' }),
    ).rejects.toBeInstanceOf(ForbiddenError)
  })

  it('lança NotFoundError quando pendência não existe', async () => {
    pendenciaRepository.findById.mockResolvedValue(null)

    await expect(service.findById(adminUser, 'x')).rejects.toBeInstanceOf(
      NotFoundError,
    )
  })
})
