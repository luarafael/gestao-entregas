import { ForbiddenError, NotFoundError, ValidationError } from '../errors/app.error.js'
import type { AuthenticatedUser } from '../middleware/auth.middleware.js'
import { entregaRepository } from '../repositories/entrega.repository.js'
import type {
  CreateEntregaInput,
  CreateEntregaClienteInput,
  ImportEntregasClienteInput,
  ListEntregasInput,
  UpdateEntregaClienteInput,
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

    if (entrega.origemCadastro === 'CLIENTE') {
      return entrega
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

  async listClientes(user: AuthenticatedUser, filters: ListEntregasInput) {
    const motoboyId = resolveMotoboyScope(user, filters.motoboyId)
    const clientes = await entregaRepository.findDistinctClientes({
      search: filters.search,
      filter: filters.filter,
      referenceDate: filters.referenceDate,
      motoboyId,
      nomeCliente: filters.nomeCliente,
    })
    return { clientes }
  }

  async createCliente(_user: AuthenticatedUser, input: CreateEntregaClienteInput) {
    return entregaRepository.createCliente(input)
  }

  async updateCliente(
    user: AuthenticatedUser,
    id: string,
    input: UpdateEntregaClienteInput,
  ) {
    const entrega = await this.findById(user, id)
    if (entrega.origemCadastro !== 'CLIENTE') {
      throw new ValidationError('Esta entrega não é um cadastro de cliente')
    }

    return entregaRepository.updateCliente(id, input)
  }

  async importClienteToMotoboy(
    user: AuthenticatedUser,
    input: ImportEntregasClienteInput,
  ) {
    let motoboyId: string

    if (isAdminUser(user)) {
      if (!input.motoboyId) {
        throw new ValidationError('Selecione o motoboy para importar as entregas')
      }
      motoboyId = input.motoboyId
    } else {
      motoboyId = user.id
    }

    const entregas = await entregaRepository.findByIds(input.ids)
    const importadas = []

    for (const entrega of entregas) {
      if (entrega.origemCadastro !== 'CLIENTE') continue
      if (entrega.entregaMotoboyId) continue

      const taxa = Number(entrega.valorEntrega)
      const motoboyEntrega = await entregaRepository.create(
        {
          nomeCliente: entrega.nomeCliente ?? undefined,
          endereco: entrega.endereco,
          bairro: entrega.bairro === '—' ? 'Centro' : entrega.bairro,
          cidade: entrega.cidade ?? undefined,
          valorProduto: entrega.valorProduto
            ? Number(entrega.valorProduto)
            : undefined,
          formaPagamento: entrega.formaPagamento ?? undefined,
          valorEntrega: taxa > 0 ? taxa : Number(entrega.valorProduto ?? 0) || 1,
          observacao: entrega.observacao ?? undefined,
          pagoPeloCliente: false,
        },
        motoboyId,
      )

      await entregaRepository.linkEntregaMotoboy(entrega.id, motoboyEntrega.id)
      importadas.push(motoboyEntrega)
    }

    if (importadas.length === 0) {
      throw new ValidationError('Nenhuma entrega elegível para importação')
    }

    return { importadas, total: importadas.length }
  }

  async update(user: AuthenticatedUser, id: string, input: UpdateEntregaInput) {
    const entrega = await this.findById(user, id)
    if (entrega.origemCadastro === 'CLIENTE') {
      throw new ValidationError('Use a aba Cliente para editar este cadastro')
    }
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
