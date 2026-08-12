import { UnauthorizedError, ValidationError } from '../errors/app.error.js'
import { usuarioRepository } from '../repositories/usuario.repository.js'
import type { LoginInput, ChangePasswordInput } from '../schemas/auth.schema.js'
import { hashPassword, verifyPassword } from '../utils/password.utils.js'
import { signAuthToken } from '../utils/jwt.utils.js'

function toPublicUser(user: {
  id: string
  nome: string
  email: string
  role: 'ADMIN' | 'MOTOBOY'
  mustChangePassword: boolean
  pix?: string | null
  fotoPerfil?: string | null
}) {
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
    fotoPerfil: user.fotoPerfil ?? null,
    ...(user.role === 'MOTOBOY' ? { pix: user.pix ?? null } : {}),
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

  async updatePix(userId: string, pix: string | null) {
    const user = await usuarioRepository.findById(userId)

    if (!user || !user.ativo || user.role !== 'MOTOBOY') {
      throw new UnauthorizedError('Usuário não encontrado ou inativo')
    }

    const updated = await usuarioRepository.updatePix(userId, pix)
    void updated
    return this.getMe(userId)
  }

  async updateFotoPerfil(userId: string, fotoPerfil: string | null) {
    const user = await usuarioRepository.findById(userId)

    if (!user || !user.ativo) {
      throw new UnauthorizedError('Usuário não encontrado ou inativo')
    }

    await usuarioRepository.updateFotoPerfil(userId, fotoPerfil)
    return this.getMe(userId)
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await usuarioRepository.findById(userId)

    if (!user || !user.ativo) {
      throw new UnauthorizedError('Usuário não encontrado ou inativo')
    }

    if (!user.mustChangePassword) {
      throw new ValidationError(
        'A redefinição de senha só é necessária no primeiro acesso',
      )
    }

    const senhaHash = await hashPassword(input.senha)
    const updated = await usuarioRepository.updatePassword(userId, senhaHash)
    return toPublicUser(updated)
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
