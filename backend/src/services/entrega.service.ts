import { ForbiddenError, NotFoundError } from '../errors/app.error.js'
import type { AuthenticatedUser } from '../middleware/auth.middleware.js'
import { entregaRepository } from '../repositories/entrega.repository.js'
import type {
  CreateEntregaInput,
  ListEntregasInput,
  UpdateEntregaInput,
} from '../schemas/entrega.schema.js'
import { pendenciaRepository } from '../repositories/pendencia.repository.js'
import { monitoramentoService } from './monitoramento.service.js'
import { assertOwnsResource, isAdminUser, resolveMotoboyScope } from '../utils/auth-scope.utils.js'
import { buildPaginatedResult } from '../utils/pagination.utils.js'
import { formatDateOnlyISO, toUtcDateOnly, toUtcDateOnlyFromBusinessTz } from '../utils/date.utils.js'

export class EntregaService {
  async create(user: AuthenticatedUser, input: CreateEntregaInput) {
    const motoboyId = isAdminUser(user) ? undefined : user.id
    return entregaRepository.create(input, motoboyId)
  }

  async findById(user: AuthenticatedUser, id: string) {
    const entrega = await entregaRepository.findById(id)
    if (!entrega) {
      throw new NotFoundError('Entrega não encontrada')
    }

    assertOwnsResource(user, entrega.motoboyId)
    return entrega
  }

  async list(user: AuthenticatedUser, filters: ListEntregasInput) {
    const motoboyId = resolveMotoboyScope(user, filters.motoboyId)

    const { data, total } = await entregaRepository.findMany({
      ...filters,
      motoboyId,
    })

    return buildPaginatedResult(data, total, filters.page, filters.limit)
  }

  async update(user: AuthenticatedUser, id: string, input: UpdateEntregaInput) {
    const entrega = await this.findById(user, id)
    assertOwnsResource(user, entrega.motoboyId, 'Você não pode editar esta entrega')
    return entregaRepository.update(id, input)
  }

  async delete(id: string) {
    const entrega = await entregaRepository.findById(id)
    if (!entrega) {
      throw new NotFoundError('Entrega não encontrada')
    }
    return entregaRepository.delete(id)
  }

  async getDashboardStats(reference?: Date | string) {
    const day =
      reference === undefined
        ? toUtcDateOnlyFromBusinessTz()
        : typeof reference === 'string'
          ? toUtcDateOnly(reference)
          : toUtcDateOnly(formatDateOnlyISO(reference))

    const [entregaStats, pendenciaStats] = await Promise.all([
      entregaRepository.getStatsByDate(day),
      pendenciaRepository.getPendingTotal(),
    ])

    return {
      entregasHoje: entregaStats.totalEntregas,
      valorRecebidoHoje: entregaStats.valorTotal,
      totalPendencias: pendenciaStats.totalPendencias,
      valorTotalDia: entregaStats.valorTotal + pendenciaStats.valorPendencias,
    }
  }

  async getMotoboyResumo(user: AuthenticatedUser, reference?: Date | string) {
    if (isAdminUser(user)) {
      throw new ForbiddenError('Este resumo é exclusivo para motoboys')
    }

    const day =
      reference === undefined
        ? toUtcDateOnlyFromBusinessTz()
        : typeof reference === 'string'
          ? toUtcDateOnly(reference)
          : toUtcDateOnly(formatDateOnlyISO(reference))

    const [entregaStats, pendenciaStats, entregas] = await Promise.all([
      entregaRepository.getStatsByDate(day, user.id),
      pendenciaRepository.findPendingRepasseByMotoboy(user.id),
      entregaRepository.findByDate(day, user.id),
    ])

    return {
      data: formatDateOnlyISO(day),
      entregasHoje: entregaStats.totalEntregas,
      valorRecebidoHoje: entregaStats.valorTotal,
      entregasPagasPeloCliente: entregaStats.entregasPagasPeloCliente,
      valorPagasPeloCliente: entregaStats.valorPagasPeloCliente,
      pendenciasAbertas: pendenciaStats.totalPendencias,
      valorPendenciasAbertas: pendenciaStats.valorPendencias,
      entregas: entregas.slice(0, 10),
    }
  }

  async getTodayDeliveries(reference: Date | string = new Date(), motoboyId?: string) {
    const day =
      typeof reference === 'string'
        ? toUtcDateOnly(reference)
        : toUtcDateOnlyFromBusinessTz(reference)

    return entregaRepository.findByDate(day, motoboyId)
  }

  async getMonitoramento(reference?: Date | string) {
    return monitoramentoService.getMonitoramento(reference)
  }
}

export const entregaService = new EntregaService()
