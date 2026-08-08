import { ConflictError, NotFoundError, ValidationError } from '../errors/app.error.js'
import { entregaRepository } from '../repositories/entrega.repository.js'
import { pendenciaRepository } from '../repositories/pendencia.repository.js'
import { prestacaoMotoboyRepository } from '../repositories/prestacao-motoboy.repository.js'
import { prestacaoRepository } from '../repositories/prestacao.repository.js'
import type {
  GeneratePrestacaoInput,
  ListPrestacoesInput,
  UpdatePrestacaoInput,
} from '../schemas/prestacao.schema.js'
import type { PrestacaoWhatsAppQuery } from '../schemas/prestacao-cliente.schema.js'
import {
  formatDateOnlyISO,
  toUtcDateOnly,
  toUtcDateOnlyFromBusinessTz,
} from '../utils/date.utils.js'
import { buildPaginatedResult } from '../utils/pagination.utils.js'
import { generateEmpresaPrestacaoWhatsAppText } from './whatsapp.service.js'

export class PrestacaoService {
  private normalizeDate(input?: Date) {
    if (!input) {
      return toUtcDateOnlyFromBusinessTz()
    }

    return toUtcDateOnly(input)
  }

  private resolveStoredDate(date: Date) {
    return toUtcDateOnly(formatDateOnlyISO(date))
  }

  private async getMotoboyConsolidation(date: Date) {
    const [aprovadas, pendentesAprovacao] = await Promise.all([
      prestacaoMotoboyRepository.findByDate(date, 'APROVADA'),
      prestacaoMotoboyRepository.countPendingByDate(date),
    ])

    const valorRepasseMotoboys = aprovadas.reduce(
      (sum, item) => sum + Number(item.valorFinal),
      0,
    )

    return {
      aprovadas,
      pendentesAprovacao,
      valorRepasseMotoboys,
      prestacoesMotoboy: aprovadas.map((item) => ({
        id: item.id,
        motoboyId: item.motoboyId,
        motoboyNome: item.motoboy.nome,
        totalEntregas: item.totalEntregas,
        valorFinal: Number(item.valorFinal),
        status: item.status,
        pix: item.motoboy.pix,
      })),
    }
  }

  private async calculateTotals(date: Date) {
    const day = toUtcDateOnly(formatDateOnlyISO(date))

    const [entregaStats, pendencias, motoboy] = await Promise.all([
      entregaRepository.getStatsByDate(day),
      pendenciaRepository.findPendingCliente(),
      this.getMotoboyConsolidation(day),
    ])

    const valorPendencias = pendencias.reduce(
      (sum, pendencia) => sum + Number(pendencia.valor),
      0,
    )

    const valorFinal = entregaStats.valorTotal + valorPendencias
    const valorLiquido = valorFinal - motoboy.valorRepasseMotoboys

    return {
      totalEntregas: entregaStats.totalEntregas,
      valorTotal: entregaStats.valorTotal,
      entregasPagasPeloCliente: entregaStats.entregasPagasPeloCliente,
      valorPagasPeloCliente: entregaStats.valorPagasPeloCliente,
      valorPendencias,
      valorFinal,
      valorLiquido,
      pendencias,
      ...motoboy,
    }
  }

  private assertCanGenerate(pendentesAprovacao: number) {
    if (pendentesAprovacao > 0) {
      throw new ValidationError(
        `Existem ${pendentesAprovacao} prestação(ões) de motoboy aguardando aprovação para esta data`,
      )
    }
  }

  async generate(input: GeneratePrestacaoInput) {
    const date = this.normalizeDate(input.data)

    const existing = await prestacaoRepository.findByDate(date)
    if (existing) {
      throw new ConflictError('Já existe uma prestação de contas para esta data')
    }

    const totals = await this.calculateTotals(date)
    await this.assertCanGenerate(totals.pendentesAprovacao)

    const entregas = await entregaRepository.findByDate(date)

    const prestacao = await prestacaoRepository.create({
      data: date,
      totalEntregas: totals.totalEntregas,
      valorTotal: totals.valorTotal,
      valorPendencias: totals.valorPendencias,
      valorFinal: totals.valorFinal,
      valorRepasseMotoboys: totals.valorRepasseMotoboys,
      valorLiquido: totals.valorLiquido,
      observacoes: input.observacoes,
    })

    await prestacaoMotoboyRepository.linkApprovedToPrestacaoContas(
      date,
      prestacao.id,
    )

    const whatsappText = generateEmpresaPrestacaoWhatsAppText(
      { ...prestacao, observacoes: prestacao.observacoes },
      totals.pendencias,
      totals.prestacoesMotoboy,
    )

    return {
      prestacao,
      entregas,
      pendencias: totals.pendencias,
      prestacoesMotoboy: totals.prestacoesMotoboy,
      whatsappText,
    }
  }

  async preview(input?: GeneratePrestacaoInput) {
    const date = this.normalizeDate(input?.data)
    const totals = await this.calculateTotals(date)

    return {
      data: formatDateOnlyISO(date),
      totalEntregas: totals.totalEntregas,
      valorTotal: totals.valorTotal,
      entregasPagasPeloCliente: totals.entregasPagasPeloCliente,
      valorPagasPeloCliente: totals.valorPagasPeloCliente,
      valorPendencias: totals.valorPendencias,
      valorFinal: totals.valorFinal,
      valorRepasseMotoboys: totals.valorRepasseMotoboys,
      valorLiquido: totals.valorLiquido,
      totalPendencias: totals.pendencias.length,
      pendentesAprovacaoMotoboy: totals.pendentesAprovacao,
      prestacoesMotoboy: totals.prestacoesMotoboy,
    }
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
      const totals = await this.calculateTotals(this.resolveStoredDate(prestacao.data))
      await this.assertCanGenerate(totals.pendentesAprovacao)

      return prestacaoRepository.update(id, {
        totalEntregas: totals.totalEntregas,
        valorTotal: totals.valorTotal,
        valorPendencias: totals.valorPendencias,
        valorFinal: totals.valorFinal,
        valorRepasseMotoboys: totals.valorRepasseMotoboys,
        valorLiquido: totals.valorLiquido,
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

  async getWhatsAppText(id: string, _options?: PrestacaoWhatsAppQuery) {
    const prestacao = await this.findById(id)

    const date = this.resolveStoredDate(prestacao.data)

    const [pendencias, motoboy] = await Promise.all([
      pendenciaRepository.findPendingCliente(),
      prestacaoMotoboyRepository.findByDate(date, 'APROVADA'),
    ])

    const prestacoesMotoboy = motoboy.map((item) => ({
      id: item.id,
      motoboyId: item.motoboyId,
      motoboyNome: item.motoboy.nome,
      totalEntregas: item.totalEntregas,
      valorFinal: Number(item.valorFinal),
      status: item.status,
      pix: item.motoboy.pix,
    }))

    return generateEmpresaPrestacaoWhatsAppText(
      { ...prestacao, observacoes: prestacao.observacoes },
      pendencias,
      prestacoesMotoboy,
    )
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
