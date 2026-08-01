import { NotFoundError } from '../errors/app.error.js'
import { entregaRepository } from '../repositories/entrega.repository.js'
import type {
  CreateEntregaInput,
  ListEntregasInput,
  UpdateEntregaInput,
} from '../schemas/entrega.schema.js'
import { pendenciaRepository } from '../repositories/pendencia.repository.js'
import { buildPaginatedResult } from '../utils/pagination.utils.js'
import { formatDateOnlyISO, toUtcDateOnly, toUtcDateOnlyFromBusinessTz } from '../utils/date.utils.js'

export class EntregaService {
  async create(input: CreateEntregaInput) {
    return entregaRepository.create(input)
  }

  async findById(id: string) {
    const entrega = await entregaRepository.findById(id)
    if (!entrega) {
      throw new NotFoundError('Entrega não encontrada')
    }
    return entrega
  }

  async list(filters: ListEntregasInput) {
    const { data, total } = await entregaRepository.findMany(filters)
    return buildPaginatedResult(data, total, filters.page, filters.limit)
  }

  async update(id: string, input: UpdateEntregaInput) {
    await this.findById(id)
    return entregaRepository.update(id, input)
  }

  async delete(id: string) {
    await this.findById(id)
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

  async getTodayDeliveries(reference: Date | string = new Date()) {
    const day =
      typeof reference === 'string'
        ? toUtcDateOnly(reference)
        : toUtcDateOnlyFromBusinessTz(reference)

    return entregaRepository.findByDate(day)
  }
}

export const entregaService = new EntregaService()
