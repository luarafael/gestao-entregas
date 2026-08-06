import { UnauthorizedError } from '../errors/app.error.js'
import { usuarioRepository } from '../repositories/usuario.repository.js'
import type { LoginInput } from '../schemas/auth.schema.js'
import { hashPassword, verifyPassword } from '../utils/password.utils.js'
import { signAuthToken } from '../utils/jwt.utils.js'

function toPublicUser(user: {
  id: string
  nome: string
  email: string
  role: 'ADMIN' | 'MOTOBOY'
}) {
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    role: user.role,
  }
}

export class AuthService {
  async login(input: LoginInput) {
    const user = await usuarioRepository.findByEmail(input.email)

    if (!user || !user.ativo) {
      throw new UnauthorizedError('E-mail ou senha inválidos')
    }

    const valid = await verifyPassword(input.senha, user.senhaHash)
    if (!valid) {
      throw new UnauthorizedError('E-mail ou senha inválidos')
    }

    const publicUser = toPublicUser(user)
    const token = signAuthToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      nome: user.nome,
    })

    return { token, user: publicUser }
  }

  async getMe(userId: string) {
    const user = await usuarioRepository.findById(userId)

    if (!user || !user.ativo) {
      throw new UnauthorizedError('Usuário não encontrado ou inativo')
    }

    return toPublicUser(user)
  }

  async ensureAdminUser(params: {
    nome: string
    email: string
    password: string
  }) {
    const senhaHash = await hashPassword(params.password)
    return usuarioRepository.upsertAdmin({
      nome: params.nome,
      email: params.email,
      senhaHash,
      role: 'ADMIN',
    })
  }

  async ensureMotoboyUser(params: {
    nome: string
    email: string
    password: string
  }) {
    const senhaHash = await hashPassword(params.password)
    return usuarioRepository.upsertMotoboy({
      nome: params.nome,
      email: params.email,
      senhaHash,
      role: 'MOTOBOY',
    })
  }
}

export const authService = new AuthService()
