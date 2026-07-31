import { ConflictError, NotFoundError } from '../errors/app.error.js'
import { entregaRepository } from '../repositories/entrega.repository.js'
import { pendenciaRepository } from '../repositories/pendencia.repository.js'
import { prestacaoRepository } from '../repositories/prestacao.repository.js'
import type {
  GeneratePrestacaoInput,
  ListPrestacoesInput,
  UpdatePrestacaoInput,
} from '../schemas/prestacao.schema.js'
import { toUtcDateOnly, toUtcDateOnlyFromLocal } from '../utils/date.utils.js'
import { buildPaginatedResult } from '../utils/pagination.utils.js'
import { generateWhatsAppText } from './whatsapp.service.js'

export class PrestacaoService {
  private normalizeDate(input?: Date) {
    if (!input) {
      return toUtcDateOnlyFromLocal(new Date())
    }

    return toUtcDateOnly(input)
  }

  private async calculateTotals(date: Date) {
    const [entregaStats, pendencias] = await Promise.all([
      entregaRepository.getStatsByDate(date),
      pendenciaRepository.findPendingByDate(date),
    ])

    const valorPendencias = pendencias.reduce(
      (sum, pendencia) => sum + Number(pendencia.valor),
      0,
    )

    return {
      totalEntregas: entregaStats.totalEntregas,
      valorTotal: entregaStats.valorTotal,
      valorPendencias,
      valorFinal: entregaStats.valorTotal + valorPendencias,
      pendencias,
    }
  }

  async generate(input: GeneratePrestacaoInput) {
    const date = this.normalizeDate(input.data)

    const existing = await prestacaoRepository.findByDate(date)
    if (existing) {
      throw new ConflictError('Já existe uma prestação de contas para esta data')
    }

    const totals = await this.calculateTotals(date)
    const entregas = await entregaRepository.findByDate(date)

    const prestacao = await prestacaoRepository.create({
      data: date,
      totalEntregas: totals.totalEntregas,
      valorTotal: totals.valorTotal,
      valorPendencias: totals.valorPendencias,
      valorFinal: totals.valorFinal,
      observacoes: input.observacoes,
    })

    const whatsappText = generateWhatsAppText(
      prestacao,
      entregas,
      totals.pendencias,
    )

    return { prestacao, entregas, pendencias: totals.pendencias, whatsappText }
  }

  async findById(id: string) {
    const prestacao = await prestacaoRepository.findById(id)
    if (!prestacao) {
      throw new NotFoundError('Prestação de contas não encontrada')
    }
    return prestacao
  }

  async update(id: string, input: UpdatePrestacaoInput) {
    const prestacao = await this.findById(id)

    if (input.recalcular) {
      const totals = await this.calculateTotals(prestacao.data)

      return prestacaoRepository.update(id, {
        totalEntregas: totals.totalEntregas,
        valorTotal: totals.valorTotal,
        valorPendencias: totals.valorPendencias,
        valorFinal: totals.valorFinal,
        observacoes:
          input.observacoes === undefined
            ? prestacao.observacoes
            : input.observacoes,
      })
    }

    return prestacaoRepository.update(id, {
      observacoes:
        input.observacoes === undefined ? prestacao.observacoes : input.observacoes,
    })
  }

  async delete(id: string) {
    await this.findById(id)
    return prestacaoRepository.delete(id)
  }

  async getWhatsAppText(id: string) {
    const prestacao = await this.findById(id)

    const [entregas, pendencias] = await Promise.all([
      entregaRepository.findByDate(prestacao.data),
      pendenciaRepository.findPendingByDate(prestacao.data),
    ])

    return generateWhatsAppText(prestacao, entregas, pendencias)
  }

  async list(filters: ListPrestacoesInput) {
    const { data, total } = await prestacaoRepository.findMany(
      filters.page,
      filters.limit,
    )
    return buildPaginatedResult(data, total, filters.page, filters.limit)
  }
}

export const prestacaoService = new PrestacaoService()
