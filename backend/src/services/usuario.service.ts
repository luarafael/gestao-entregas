import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../errors/app.error.js'
import { env } from '../config/env.js'
import { usuarioRepository } from '../repositories/usuario.repository.js'
import type {
  CreateAdminInput,
  CreateMotoboyInput,
  ListAdminsInput,
  ListMotoboysInput,
  SetMotoboyAtivoInput,
  UpdateAdminInput,
  UpdateMotoboyInput,
} from '../schemas/usuario.schema.js'
import { buildPaginatedResult } from '../utils/pagination.utils.js'
import { hashPassword } from '../utils/password.utils.js'

export class UsuarioService {
  private get bootstrapAdminEmail(): string {
    return env.ADMIN_EMAIL.toLowerCase().trim()
  }

  private isBootstrapAdminEmail(email: string): boolean {
    return email.toLowerCase().trim() === this.bootstrapAdminEmail
  }

  private async getManageableAdminById(id: string) {
    const admin = await this.getAdminById(id)
    if (this.isBootstrapAdminEmail(admin.email)) {
      throw new NotFoundError('Administrador não encontrado')
    }
    return admin
  }

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
      ...(senhaHash ? { mustChangePassword: true } : {}),
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

  async listAdmins(actingUserId: string, filters: ListAdminsInput) {
    const { data, total } = await usuarioRepository.findAdmins({
      page: filters.page,
      limit: filters.limit,
      search: filters.search,
      ativo: filters.ativo,
      excludeEmail: this.bootstrapAdminEmail,
      excludeUserId: actingUserId,
    })

    return buildPaginatedResult(data, total, filters.page, filters.limit)
  }

  async getAdminById(id: string) {
    const admin = await usuarioRepository.findAdminById(id)
    if (!admin) {
      throw new NotFoundError('Administrador não encontrado')
    }
    return admin
  }

  async createAdmin(input: CreateAdminInput) {
    const email = input.email.toLowerCase().trim()

    if (this.isBootstrapAdminEmail(email)) {
      throw new ConflictError(
        'Este e-mail pertence ao administrador principal do sistema',
      )
    }

    const existing = await usuarioRepository.findByEmail(email)

    if (existing) {
      throw new ConflictError('Já existe um usuário com este e-mail')
    }

    const senhaHash = await hashPassword(input.senha)

    return usuarioRepository.createAdmin({
      nome: input.nome,
      email,
      senhaHash,
    })
  }

  async updateAdmin(id: string, input: UpdateAdminInput) {
    await this.getManageableAdminById(id)

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

    return usuarioRepository.updateAdmin(id, {
      nome: input.nome,
      email: input.email,
      senhaHash,
      ...(senhaHash ? { mustChangePassword: true } : {}),
    })
  }

  private async assertCanModifyAdminTarget(
    actingUserId: string,
    targetAdminId: string,
    action: 'desativar' | 'excluir',
  ) {
    if (actingUserId === targetAdminId) {
      throw new ForbiddenError(
        `Você não pode ${action} o seu próprio usuário administrador`,
      )
    }
  }

  private async assertAtLeastOneActiveAdminRemaining(excludeId: string) {
    const remaining = await usuarioRepository.countActiveAdmins(excludeId)
    if (remaining === 0) {
      throw new ForbiddenError(
        'Não é possível remover o último administrador ativo do sistema',
      )
    }
  }

  async setAdminAtivo(
    actingUserId: string,
    id: string,
    input: SetMotoboyAtivoInput,
  ) {
    await this.getManageableAdminById(id)

    if (!input.ativo) {
      await this.assertCanModifyAdminTarget(actingUserId, id, 'desativar')
      await this.assertAtLeastOneActiveAdminRemaining(id)
    }

    return usuarioRepository.setAtivo(id, input.ativo)
  }

  async deleteAdmin(actingUserId: string, id: string) {
    await this.getManageableAdminById(id)
    await this.assertCanModifyAdminTarget(actingUserId, id, 'excluir')
    await this.assertAtLeastOneActiveAdminRemaining(id)
    return usuarioRepository.deleteAdmin(id)
  }
}

export const usuarioService = new UsuarioService()
