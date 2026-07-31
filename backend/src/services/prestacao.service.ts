import { ConflictError, NotFoundError } from '../errors/app.error.js'
import { entregaRepository } from '../repositories/entrega.repository.js'
import { pendenciaRepository } from '../repositories/pendencia.repository.js'
import { prestacaoRepository } from '../repositories/prestacao.repository.js'
import type {
  GeneratePrestacaoInput,
  ListPrestacoesInput,
} from '../schemas/prestacao.schema.js'
import { startOfDay } from '../utils/date.utils.js'
import { buildPaginatedResult } from '../utils/pagination.utils.js'
import { generateWhatsAppText } from './whatsapp.service.js'

export class PrestacaoService {
  async generate(input: GeneratePrestacaoInput) {
    const date = startOfDay(input.data ?? new Date())

    const existing = await prestacaoRepository.findByDate(date)
    if (existing) {
      throw new ConflictError('Já existe uma prestação de contas para esta data')
    }

    const [entregas, pendencias, entregaStats] = await Promise.all([
      entregaRepository.findByDate(date),
      pendenciaRepository.findPendingByDate(date),
      entregaRepository.getStatsByDate(date),
    ])

    const valorPendencias = pendencias.reduce(
      (sum, p) => sum + Number(p.valor),
      0,
    )

    const valorFinal = entregaStats.valorTotal + valorPendencias

    const prestacao = await prestacaoRepository.create({
      data: date,
      totalEntregas: entregaStats.totalEntregas,
      valorTotal: entregaStats.valorTotal,
      valorPendencias,
      valorFinal,
      observacoes: input.observacoes,
    })

    const whatsappText = generateWhatsAppText(prestacao, entregas, pendencias)

    return { prestacao, entregas, pendencias, whatsappText }
  }

  async findById(id: string) {
    const prestacao = await prestacaoRepository.findById(id)
    if (!prestacao) {
      throw new NotFoundError('Prestação de contas não encontrada')
    }
    return prestacao
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
