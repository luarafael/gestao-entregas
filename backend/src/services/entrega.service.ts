import { ForbiddenError, NotFoundError, ValidationError } from '../errors/app.error.js'
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
    const { motoboyId: requestedMotoboyId, ...entregaData } = input

    let motoboyId: string | undefined

    if (isAdminUser(user)) {
      if (!requestedMotoboyId) {
        throw new ValidationError('Selecione o motoboy responsável pela entrega')
      }
      motoboyId = requestedMotoboyId
    } else {
      motoboyId = user.id
    }

    return entregaRepository.create(entregaData, motoboyId)
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

    const { motoboyId: requestedMotoboyId, ...entregaData } = input

    if (!isAdminUser(user) && requestedMotoboyId !== undefined) {
      throw new ForbiddenError('Você não pode alterar o motoboy da entrega')
    }

    return entregaRepository.update(id, {
      ...entregaData,
      ...(isAdminUser(user) && requestedMotoboyId
        ? { motoboyId: requestedMotoboyId }
        : {}),
    })
  }

  async delete(id: string) {
    const entrega = await entregaRepository.findById(id)
    if (!entrega) {
      throw new NotFoundError('Entrega não encontrada')
    }
    return entregaRepository.delete(id)
  }

  async getDashboardStats(reference?: Date | string, motoboyId?: string) {
    const day =
      reference === undefined
        ? toUtcDateOnlyFromBusinessTz()
        : typeof reference === 'string'
          ? toUtcDateOnly(reference)
          : toUtcDateOnly(formatDateOnlyISO(reference))

    const [entregaStats, pendenciaStats] = await Promise.all([
      entregaRepository.getStatsByDate(day, motoboyId ? { motoboyId } : undefined),
      pendenciaRepository.getPendingTotal(motoboyId),
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
      entregaRepository.getStatsByDate(day, { motoboyId: user.id }),
      pendenciaRepository.findPendingRepasseByMotoboy(user.id),
      entregaRepository.findByDate(day, { motoboyId: user.id }),
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

    return entregaRepository.findByDate(day, motoboyId ? { motoboyId } : undefined)
  }

  async getMonitoramento(reference?: Date | string, motoboyId?: string) {
    return monitoramentoService.getMonitoramento(reference, motoboyId)
  }

  async getMonitoramentoEventos(since: Date, motoboyId?: string) {
    return monitoramentoService.getEventosEntrega(since, motoboyId)
  }
}

export const entregaService = new EntregaService()
