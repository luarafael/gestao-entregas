import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthService } from '../services/auth.service.js'
import { UnauthorizedError } from '../errors/app.error.js'

const mocks = vi.hoisted(() => ({
  findByEmail: vi.fn(),
  findById: vi.fn(),
  upsertAdmin: vi.fn(),
  updatePassword: vi.fn(),
}))

vi.mock('../repositories/usuario.repository.js', () => ({
  usuarioRepository: {
    findByEmail: mocks.findByEmail,
    findById: mocks.findById,
    upsertAdmin: mocks.upsertAdmin,
    updatePassword: mocks.updatePassword,
    updatePix: vi.fn(),
    updateFotoPerfil: vi.fn(),
  },
}))

vi.mock('../utils/password.utils.js', () => ({
  hashPassword: vi.fn(async () => 'hashed-password'),
  verifyPassword: vi.fn(async () => true),
}))

vi.mock('../utils/jwt.utils.js', () => ({
  signAuthToken: vi.fn(() => 'jwt-token'),
}))

describe('AuthService', () => {
  const service = new AuthService()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('faz login com credenciais válidas', async () => {
    mocks.findByEmail.mockResolvedValue({
      id: 'user-1',
      nome: 'Admin',
      email: 'admin@test.com',
      senhaHash: 'hash',
      role: 'ADMIN',
      ativo: true,
      mustChangePassword: false,
      fotoPerfil: null,
    })

    const result = await service.login({
      email: 'admin@test.com',
      senha: '123456',
    })

    expect(result.token).toBe('jwt-token')
    expect(result.user).toEqual({
      id: 'user-1',
      nome: 'Admin',
      email: 'admin@test.com',
      role: 'ADMIN',
      mustChangePassword: false,
      fotoPerfil: null,
    })
  })

  it('retorna mustChangePassword true no login do primeiro acesso', async () => {
    mocks.findByEmail.mockResolvedValue({
      id: 'user-2',
      nome: 'Motoboy',
      email: 'motoboy@test.com',
      senhaHash: 'hash',
      role: 'MOTOBOY',
      ativo: true,
      mustChangePassword: true,
      pix: null,
      fotoPerfil: null,
    })

    const result = await service.login({
      email: 'motoboy@test.com',
      senha: '123456',
    })

    expect(result.user.mustChangePassword).toBe(true)
  })

  it('define senha no primeiro acesso', async () => {
    mocks.findById.mockResolvedValue({
      id: 'user-2',
      nome: 'Motoboy',
      email: 'motoboy@test.com',
      role: 'MOTOBOY',
      ativo: true,
      mustChangePassword: true,
      pix: null,
      fotoPerfil: null,
    })
    mocks.updatePassword.mockResolvedValue({
      id: 'user-2',
      nome: 'Motoboy',
      email: 'motoboy@test.com',
      role: 'MOTOBOY',
      mustChangePassword: false,
      pix: null,
      fotoPerfil: null,
    })

    const user = await service.changePassword('user-2', {
      senha: 'nova123',
      confirmacaoSenha: 'nova123',
    })

    expect(mocks.updatePassword).toHaveBeenCalledWith('user-2', 'hashed-password')
    expect(user.mustChangePassword).toBe(false)
  })

  it('rejeita login de usuário inexistente', async () => {
    mocks.findByEmail.mockResolvedValue(null)

    await expect(
      service.login({ email: 'x@test.com', senha: '123' }),
    ).rejects.toBeInstanceOf(UnauthorizedError)
  })

  it('retorna perfil do usuário autenticado', async () => {
    mocks.findById.mockResolvedValue({
      id: 'user-1',
      nome: 'Admin',
      email: 'admin@test.com',
      role: 'ADMIN',
      ativo: true,
      mustChangePassword: false,
      fotoPerfil: null,
    })

    const user = await service.getMe('user-1')
    expect(user.email).toBe('admin@test.com')
  })
})
