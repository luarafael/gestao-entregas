import { beforeEach, describe, it, expect, vi } from 'vitest'
import { PendenciaService } from '../services/pendencia.service.js'
import { ForbiddenError, NotFoundError } from '../errors/app.error.js'
import type { AuthenticatedUser } from '../middleware/auth.middleware.js'

const pendenciaRepository = vi.hoisted(() => ({
  create: vi.fn(),
  findById: vi.fn(),
  findMany: vi.fn(),
  findRecentRepasseSince: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('../repositories/pendencia.repository.js', () => ({
  pendenciaRepository,
}))

vi.mock('../services/push-notification.service.js', () => ({
  pushNotificationService: {
    notifyAdminsNewPendencia: vi.fn(),
  },
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
    pendenciaRepository.create.mockResolvedValue({
      id: '1',
      tipo: 'REPASSE_MOTOBOY',
      descricao: 'Repasse não pago',
      criadoEm: new Date('2026-08-05T12:00:00Z'),
    })

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

  it('lista eventos de repasse criados após a data informada', async () => {
    const since = new Date('2026-08-06T12:00:00.000Z')
    pendenciaRepository.findRecentRepasseSince.mockResolvedValue([
      {
        id: 'pend-1',
        motoboyId: 'motoboy-1',
        motoboy: { id: 'motoboy-1', nome: 'João' },
        descricao: 'Repasse não pago',
        valor: 50,
        criadoEm: new Date('2026-08-06T13:00:00.000Z'),
      },
    ])

    const eventos = await service.getEventosRepasse(since)

    expect(pendenciaRepository.findRecentRepasseSince).toHaveBeenCalledWith(since)
    expect(eventos).toEqual([
      {
        id: 'pend-1',
        motoboyId: 'motoboy-1',
        motoboyNome: 'João',
        descricao: 'Repasse não pago',
        valor: 50,
        criadoEm: '2026-08-06T13:00:00.000Z',
      },
    ])
  })
})
