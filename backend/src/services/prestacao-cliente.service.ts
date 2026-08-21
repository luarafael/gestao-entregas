import { ConflictError, NotFoundError, ValidationError } from '../errors/app.error.js'
import { entregaRepository } from '../repositories/entrega.repository.js'
import { prestacaoClienteRepository } from '../repositories/prestacao-cliente.repository.js'
import type {
  ListClientesByDateQuery,
  ListPrestacoesClienteInput,
  SubmitPrestacaoClienteInput,
  UpdatePrestacaoClienteInput,
} from '../schemas/prestacao-cliente.schema.js'
import {
  formatDateOnlyISO,
  formatDateOnlyBR,
  toUtcDateOnly,
  toUtcDateOnlyFromBusinessTz,
} from '../utils/date.utils.js'
import { buildPaginatedResult } from '../utils/pagination.utils.js'
import { generateClientePrestacaoWhatsAppText } from './whatsapp.service.js'
import { pushNotificationService } from './push-notification.service.js'

function mapEntregasForWhatsApp(
  entregas: Awaited<ReturnType<typeof entregaRepository.findByDate>>,
) {
  return entregas.map((entrega) => ({
    bairro: entrega.bairro,
    endereco: entrega.endereco,
    cidade: entrega.cidade,
    nomeCliente: entrega.nomeCliente,
    valorEntrega: entrega.valorEntrega,
    valorProduto: entrega.valorProduto,
    formaPagamento: entrega.formaPagamento,
    observacao: entrega.observacao,
    pagoPeloCliente: entrega.pagoPeloCliente,
    motoboyNome: entrega.motoboy?.nome ?? null,
    motoboyId: entrega.motoboyId,
  }))
}

export class PrestacaoClienteService {
  private normalizeDate(input?: Date) {
    if (!input) {
      return toUtcDateOnlyFromBusinessTz()
    }

    return toUtcDateOnly(input)
  }

  private resolveStoredDate(date: Date) {
    return toUtcDateOnly(formatDateOnlyISO(date))
  }

  private normalizeCliente(nomeCliente: string) {
    const normalized = nomeCliente.trim()
    if (!normalized) {
      throw new ValidationError('Selecione um cliente')
    }
    return normalized
  }

  private async calculateTotals(nomeCliente: string, date: Date) {
    const day = toUtcDateOnly(formatDateOnlyISO(date))
    const stats = await entregaRepository.getStatsByDate(day, { nomeCliente })

    return {
      totalEntregas: stats.totalEntregas,
      valorTotal: stats.valorTotal,
      entregasPagasPeloCliente: stats.entregasPagasPeloCliente,
      valorPagasPeloCliente: stats.valorPagasPeloCliente,
      valorFinal: stats.valorTotal,
    }
  }

  async listClientesByDate(query: ListClientesByDateQuery) {
    const clientes = await entregaRepository.findDistinctClientesByDate(query.data)
    return { clientes }
  }

  async preview(input: SubmitPrestacaoClienteInput) {
    const nomeCliente = this.normalizeCliente(input.nomeCliente)
    const date = this.normalizeDate(input.data)
    const totals = await this.calculateTotals(nomeCliente, date)
    const existing = await prestacaoClienteRepository.findByClienteAndDate(
      nomeCliente,
      date,
    )

    return {
      data: formatDateOnlyISO(date),
      nomeCliente,
      totalEntregas: totals.totalEntregas,
      valorTotal: totals.valorTotal,
      entregasPagasPeloCliente: totals.entregasPagasPeloCliente,
      valorPagasPeloCliente: totals.valorPagasPeloCliente,
      valorFinal: totals.valorFinal,
      prestacaoId: existing?.id ?? null,
    }
  }

  async submit(input: SubmitPrestacaoClienteInput) {
    const nomeCliente = this.normalizeCliente(input.nomeCliente)
    const date = this.normalizeDate(input.data)

    const existing = await prestacaoClienteRepository.findByClienteAndDate(
      nomeCliente,
      date,
    )
    if (existing) {
      throw new ConflictError(
        `Já existe uma prestação para ${nomeCliente} nesta data`,
      )
    }

    const totals = await this.calculateTotals(nomeCliente, date)
    if (totals.totalEntregas === 0) {
      throw new ValidationError('Nenhuma entrega encontrada para este cliente na data')
    }

    const entregas = await entregaRepository.findByDate(date, { nomeCliente })

    const prestacao = await prestacaoClienteRepository.create({
      nomeCliente,
      data: date,
      totalEntregas: totals.totalEntregas,
      valorTotal: totals.valorTotal,
      valorFinal: totals.valorFinal,
      observacoes: input.observacoes,
    })

    const whatsappText = generateClientePrestacaoWhatsAppText(
      nomeCliente,
      prestacao,
      mapEntregasForWhatsApp(entregas),
      prestacao.observacoes,
    )

    pushNotificationService.notifyAdminsPrestacaoEnviada({
      prestacaoId: prestacao.id,
      body: `Prestação do cliente ${nomeCliente} de ${formatDateOnlyBR(prestacao.data)} foi gerada.`,
      url: '/prestacao',
    })

    return {
      prestacao,
      entregas,
      whatsappText,
    }
  }

  async findById(id: string) {
    const prestacao = await prestacaoClienteRepository.findById(id)
    if (!prestacao) {
      throw new NotFoundError('Prestação do cliente não encontrada')
    }
    return prestacao
  }

  async getWhatsAppText(id: string) {
    const prestacao = await this.findById(id)
    const date = this.resolveStoredDate(prestacao.data)
    const entregas = await entregaRepository.findByDate(date, {
      nomeCliente: prestacao.nomeCliente,
    })

    return generateClientePrestacaoWhatsAppText(
      prestacao.nomeCliente,
      prestacao,
      mapEntregasForWhatsApp(entregas),
      prestacao.observacoes,
    )
  }

  async getEventos(since: Date) {
    const prestacoes = await prestacaoClienteRepository.findCreatedSince(since)
    return prestacoes.map((prestacao) => ({
      id: prestacao.id,
      tipo: 'cliente' as const,
      nomeCliente: prestacao.nomeCliente,
      data: formatDateOnlyISO(prestacao.data),
      criadoEm: prestacao.criadoEm.toISOString(),
    }))
  }

  async list(filters: ListPrestacoesClienteInput) {
    const { data, total } = await prestacaoClienteRepository.findMany(
      filters.page,
      filters.limit,
      filters.nomeCliente,
    )
    return buildPaginatedResult(data, total, filters.page, filters.limit)
  }

  async delete(id: string) {
    await this.findById(id)
    return prestacaoClienteRepository.delete(id)
  }

  async update(id: string, input: UpdatePrestacaoClienteInput) {
    const prestacao = await this.findById(id)

    if (input.recalcular) {
      const date = this.resolveStoredDate(prestacao.data)
      const totals = await this.calculateTotals(prestacao.nomeCliente, date)

      return prestacaoClienteRepository.update(id, {
        totalEntregas: totals.totalEntregas,
        valorTotal: totals.valorTotal,
        valorFinal: totals.valorFinal,
        observacoes:
          input.observacoes === undefined
            ? prestacao.observacoes
            : input.observacoes,
      })
    }

    return prestacaoClienteRepository.update(id, {
      observacoes:
        input.observacoes === undefined ? prestacao.observacoes : input.observacoes,
    })
  }
}

export const prestacaoClienteService = new PrestacaoClienteService()
