import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthService } from '../services/auth.service.js'
import { UnauthorizedError } from '../errors/app.error.js'

const mocks = vi.hoisted(() => ({
  findByEmail: vi.fn(),
  findById: vi.fn(),
  upsertAdmin: vi.fn(),
}))

vi.mock('../repositories/usuario.repository.js', () => ({
  usuarioRepository: {
    findByEmail: mocks.findByEmail,
    findById: mocks.findById,
    upsertAdmin: mocks.upsertAdmin,
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
      fotoPerfil: null,
    })
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
    })

    const user = await service.getMe('user-1')
    expect(user.email).toBe('admin@test.com')
  })
})
