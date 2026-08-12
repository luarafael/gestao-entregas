import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UsuarioService } from '../services/usuario.service.js'
import { ConflictError, ForbiddenError, NotFoundError } from '../errors/app.error.js'

const usuarioRepository = vi.hoisted(() => ({
  findByEmail: vi.fn(),
  findMotoboyById: vi.fn(),
  findMotoboys: vi.fn(),
  findAdminById: vi.fn(),
  findAdmins: vi.fn(),
  create: vi.fn(),
  createAdmin: vi.fn(),
  updateMotoboy: vi.fn(),
  updateAdmin: vi.fn(),
  setAtivo: vi.fn(),
  deleteMotoboy: vi.fn(),
  deleteAdmin: vi.fn(),
  countActiveAdmins: vi.fn(),
}))

vi.mock('../repositories/usuario.repository.js', () => ({
  usuarioRepository,
}))

vi.mock('../utils/password.utils.js', () => ({
  hashPassword: vi.fn(async () => 'hashed-password'),
}))

vi.mock('../config/env.js', () => ({
  env: {
    ADMIN_EMAIL: 'admin@sistema.local',
  },
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

  it('lista admins paginados', async () => {
    usuarioRepository.findAdmins.mockResolvedValue({
      data: [{ id: 'a1', nome: 'Admin', email: 'admin@test.com', role: 'ADMIN', ativo: true }],
      total: 1,
    })

    const result = await service.listAdmins('acting-admin-id', {
      page: 1,
      limit: 10,
      ativo: undefined,
    })

    expect(usuarioRepository.findAdmins).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      ativo: undefined,
      excludeEmail: 'admin@sistema.local',
      excludeUserId: 'acting-admin-id',
    })
    expect(result.data).toHaveLength(1)
    expect(result.meta.total).toBe(1)
  })

  it('cria admin com senha hasheada', async () => {
    usuarioRepository.findByEmail.mockResolvedValue(null)
    usuarioRepository.createAdmin.mockResolvedValue({
      id: 'a1',
      nome: 'Admin 2',
      email: 'admin2@test.com',
      role: 'ADMIN',
      ativo: true,
    })

    const result = await service.createAdmin({
      nome: 'Admin 2',
      email: 'admin2@test.com',
      senha: 'senha123',
    })

    expect(usuarioRepository.createAdmin).toHaveBeenCalledWith({
      nome: 'Admin 2',
      email: 'admin2@test.com',
      senhaHash: 'hashed-password',
    })
    expect(result.id).toBe('a1')
  })

  it('impede criar admin com e-mail do administrador principal', async () => {
    await expect(
      service.createAdmin({
        nome: 'Principal',
        email: 'admin@sistema.local',
        senha: 'senha123',
      }),
    ).rejects.toBeInstanceOf(ConflictError)
  })

  it('nao permite editar administrador principal', async () => {
    usuarioRepository.findAdminById.mockResolvedValue({
      id: 'bootstrap',
      nome: 'Luã Rafael',
      email: 'admin@sistema.local',
      role: 'ADMIN',
      ativo: true,
    })

    await expect(
      service.updateAdmin('bootstrap', { nome: 'Outro' }),
    ).rejects.toBeInstanceOf(NotFoundError)
  })

  it('impede desativar o proprio admin', async () => {
    usuarioRepository.findAdminById.mockResolvedValue({
      id: 'a1',
      nome: 'Admin',
      email: 'admin@test.com',
      role: 'ADMIN',
      ativo: true,
    })

    await expect(
      service.setAdminAtivo('a1', 'a1', { ativo: false }),
    ).rejects.toBeInstanceOf(ForbiddenError)
  })

  it('impede excluir o ultimo admin ativo', async () => {
    usuarioRepository.findAdminById.mockResolvedValue({
      id: 'a2',
      nome: 'Admin 2',
      email: 'admin2@test.com',
      role: 'ADMIN',
      ativo: true,
    })
    usuarioRepository.countActiveAdmins.mockResolvedValue(0)

    await expect(service.deleteAdmin('a1', 'a2')).rejects.toBeInstanceOf(
      ForbiddenError,
    )
  })
})
