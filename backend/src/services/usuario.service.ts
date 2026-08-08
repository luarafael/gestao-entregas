import { ConflictError, NotFoundError, ValidationError } from '../errors/app.error.js'
import { usuarioRepository } from '../repositories/usuario.repository.js'
import type {
  CreateMotoboyInput,
  ListMotoboysInput,
  SetMotoboyAtivoInput,
  UpdateMotoboyInput,
} from '../schemas/usuario.schema.js'
import { buildPaginatedResult } from '../utils/pagination.utils.js'
import { hashPassword } from '../utils/password.utils.js'

export class UsuarioService {
  async listMotoboys(filters: ListMotoboysInput) {
    const { data, total } = await usuarioRepository.findMotoboys({
      page: filters.page,
      limit: filters.limit,
      search: filters.search,
      ativo: filters.ativo,
    })

    return buildPaginatedResult(data, total, filters.page, filters.limit)
  }

  async getMotoboyById(id: string) {
    const motoboy = await usuarioRepository.findMotoboyById(id)
    if (!motoboy) {
      throw new NotFoundError('Motoboy não encontrado')
    }
    return motoboy
  }

  async createMotoboy(input: CreateMotoboyInput) {
    const email = input.email.toLowerCase().trim()
    const existing = await usuarioRepository.findByEmail(email)

    if (existing) {
      throw new ConflictError('Já existe um usuário com este e-mail')
    }

    const senhaHash = await hashPassword(input.senha)

    return usuarioRepository.create({
      nome: input.nome,
      email,
      senhaHash,
      role: 'MOTOBOY',
      pix: input.pix ?? null,
    })
  }

  async updateMotoboy(id: string, input: UpdateMotoboyInput) {
    await this.getMotoboyById(id)

    if (input.email) {
      const email = input.email.toLowerCase().trim()
      const existing = await usuarioRepository.findByEmail(email)
      if (existing && existing.id !== id) {
        throw new ConflictError('Já existe um usuário com este e-mail')
      }
    }

    const senha = input.senha?.trim()
    if (senha !== undefined && senha.length > 0 && senha.length < 6) {
      throw new ValidationError('Senha deve ter no mínimo 6 caracteres')
    }

    const senhaHash =
      senha && senha.length > 0 ? await hashPassword(senha) : undefined

    return usuarioRepository.updateMotoboy(id, {
      nome: input.nome,
      email: input.email,
      senhaHash,
      pix: input.pix,
    })
  }

  async setMotoboyAtivo(id: string, input: SetMotoboyAtivoInput) {
    await this.getMotoboyById(id)
    return usuarioRepository.setAtivo(id, input.ativo)
  }

  async deleteMotoboy(id: string) {
    await this.getMotoboyById(id)
    return usuarioRepository.deleteMotoboy(id)
  }
}

export const usuarioService = new UsuarioService()
