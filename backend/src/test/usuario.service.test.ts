import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UsuarioService } from '../services/usuario.service.js'
import { ConflictError, NotFoundError } from '../errors/app.error.js'

const usuarioRepository = vi.hoisted(() => ({
  findByEmail: vi.fn(),
  findMotoboyById: vi.fn(),
  findMotoboys: vi.fn(),
  create: vi.fn(),
  updateMotoboy: vi.fn(),
  setAtivo: vi.fn(),
  deleteMotoboy: vi.fn(),
}))

vi.mock('../repositories/usuario.repository.js', () => ({
  usuarioRepository,
}))

vi.mock('../utils/password.utils.js', () => ({
  hashPassword: vi.fn(async () => 'hashed-password'),
}))

describe('UsuarioService', () => {
  const service = new UsuarioService()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lista motoboys paginados', async () => {
    usuarioRepository.findMotoboys.mockResolvedValue({
      data: [{ id: 'm1', nome: 'João', email: 'joao@test.com', role: 'MOTOBOY', ativo: true }],
      total: 1,
    })

    const result = await service.listMotoboys({
      page: 1,
      limit: 10,
      ativo: undefined,
    })

    expect(result.data).toHaveLength(1)
    expect(result.meta.total).toBe(1)
  })

  it('cria motoboy com senha hasheada', async () => {
    usuarioRepository.findByEmail.mockResolvedValue(null)
    usuarioRepository.create.mockResolvedValue({
      id: 'm1',
      nome: 'João',
      email: 'joao@test.com',
      role: 'MOTOBOY',
      ativo: true,
    })

    const result = await service.createMotoboy({
      nome: 'João',
      email: 'joao@test.com',
      senha: 'senha123',
    })

    expect(usuarioRepository.create).toHaveBeenCalledWith({
      nome: 'João',
      email: 'joao@test.com',
      senhaHash: 'hashed-password',
      role: 'MOTOBOY',
      pix: null,
    })
    expect(result.id).toBe('m1')
  })

  it('bloqueia criação com e-mail duplicado', async () => {
    usuarioRepository.findByEmail.mockResolvedValue({ id: 'outro' })

    await expect(
      service.createMotoboy({
        nome: 'João',
        email: 'joao@test.com',
        senha: 'senha123',
      }),
    ).rejects.toBeInstanceOf(ConflictError)
  })

  it('desativa motoboy existente', async () => {
    usuarioRepository.findMotoboyById.mockResolvedValue({
      id: 'm1',
      nome: 'João',
      email: 'joao@test.com',
      role: 'MOTOBOY',
      ativo: true,
    })
    usuarioRepository.setAtivo.mockResolvedValue({
      id: 'm1',
      ativo: false,
    })

    const result = await service.setMotoboyAtivo('m1', { ativo: false })

    expect(usuarioRepository.setAtivo).toHaveBeenCalledWith('m1', false)
    expect(result.ativo).toBe(false)
  })

  it('lança NotFound ao editar motoboy inexistente', async () => {
    usuarioRepository.findMotoboyById.mockResolvedValue(null)

    await expect(
      service.updateMotoboy('x', { nome: 'Novo' }),
    ).rejects.toBeInstanceOf(NotFoundError)
  })

  it('exclui motoboy existente', async () => {
    usuarioRepository.findMotoboyById.mockResolvedValue({
      id: 'm1',
      nome: 'João',
      email: 'joao@test.com',
      role: 'MOTOBOY',
      ativo: true,
    })
    usuarioRepository.deleteMotoboy.mockResolvedValue({ id: 'm1' })

    await service.deleteMotoboy('m1')

    expect(usuarioRepository.deleteMotoboy).toHaveBeenCalledWith('m1')
  })
})
