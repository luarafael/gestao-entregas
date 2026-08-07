import { ForbiddenError, NotFoundError, ValidationError } from '../errors/app.error.js'
import type { AuthenticatedUser } from '../middleware/auth.middleware.js'
import { pendenciaRepository } from '../repositories/pendencia.repository.js'
import type {
  CreatePendenciaInput,
  ListPendenciasInput,
  UpdatePendenciaInput,
} from '../schemas/pendencia.schema.js'
import { assertOwnsResource, isAdminUser } from '../utils/auth-scope.utils.js'
import { buildPaginatedResult } from '../utils/pagination.utils.js'

export class PendenciaService {
  async create(user: AuthenticatedUser, input: CreatePendenciaInput) {
    if (isAdminUser(user)) {
      if (!input.motoboyId) {
        throw new ValidationError(
          'Selecione o motoboy responsável pela pendência',
        )
      }

      return pendenciaRepository.create({
        ...input,
        tipo: 'CLIENTE',
        motoboyId: input.motoboyId,
      })
    }

    return pendenciaRepository.create({
      ...input,
      status: 'PENDENTE',
      tipo: 'REPASSE_MOTOBOY',
      motoboyId: user.id,
    })
  }

  async findById(user: AuthenticatedUser, id: string) {
    const pendencia = await pendenciaRepository.findById(id)
    if (!pendencia) {
      throw new NotFoundError('Pendência não encontrada')
    }

    if (!isAdminUser(user) && pendencia.tipo === 'CLIENTE') {
      throw new ForbiddenError('Você não tem permissão para acessar esta pendência')
    }

    assertOwnsResource(user, pendencia.motoboyId, 'Você não tem permissão para acessar esta pendência')
    return pendencia
  }

  async list(user: AuthenticatedUser, filters: ListPendenciasInput) {
    const scopedFilters = isAdminUser(user)
      ? filters
      : {
          ...filters,
          tipo: 'REPASSE_MOTOBOY' as const,
          motoboyId: user.id,
        }

    const { data, total } = await pendenciaRepository.findMany(scopedFilters)
    return buildPaginatedResult(data, total, filters.page, filters.limit)
  }

  async update(user: AuthenticatedUser, id: string, input: UpdatePendenciaInput) {
    const pendencia = await this.findById(user, id)

    if (!isAdminUser(user)) {
      if (pendencia.status === 'RECEBIDO') {
        throw new ForbiddenError('Pendências recebidas não podem ser alteradas')
      }

      if (input.status) {
        throw new ForbiddenError('Somente o administrador pode marcar como recebido')
      }

      if (input.motoboyId !== undefined) {
        throw new ForbiddenError('Você não pode alterar o motoboy da pendência')
      }
    }

    if (isAdminUser(user) && input.motoboyId === '') {
      throw new ValidationError('Selecione o motoboy responsável pela pendência')
    }

    return pendenciaRepository.update(id, input)
  }

  async delete(user: AuthenticatedUser, id: string) {
    const pendencia = await this.findById(user, id)

    if (!isAdminUser(user) && pendencia.status === 'RECEBIDO') {
      throw new ForbiddenError('Pendências recebidas não podem ser excluídas')
    }

    return pendenciaRepository.delete(id)
  }

  async getEventosRepasse(since: Date) {
    const pendencias = await pendenciaRepository.findRecentRepasseSince(since)

    return pendencias.map((pendencia) => ({
      id: pendencia.id,
      motoboyId: pendencia.motoboyId,
      motoboyNome: pendencia.motoboy?.nome ?? 'Motoboy',
      descricao: pendencia.descricao,
      valor: Number(pendencia.valor),
      criadoEm: pendencia.criadoEm.toISOString(),
    }))
  }
}

export const pendenciaService = new PendenciaService()
