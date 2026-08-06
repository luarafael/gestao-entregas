import { ConflictError, ForbiddenError, NotFoundError } from '../errors/app.error.js'
import type { AuthenticatedUser } from '../middleware/auth.middleware.js'
import { entregaRepository } from '../repositories/entrega.repository.js'
import { pendenciaRepository } from '../repositories/pendencia.repository.js'
import { prestacaoMotoboyRepository } from '../repositories/prestacao-motoboy.repository.js'
import type {
  ListPrestacoesMotoboyInput,
  RejectPrestacaoMotoboyInput,
  SubmitPrestacaoMotoboyInput,
} from '../schemas/prestacao-motoboy.schema.js'
import { assertOwnsResource, isAdminUser } from '../utils/auth-scope.utils.js'
import {
  formatDateOnlyISO,
  toUtcDateOnly,
  toUtcDateOnlyFromBusinessTz,
} from '../utils/date.utils.js'
import { buildPaginatedResult } from '../utils/pagination.utils.js'
import { generateMotoboyPrestacaoWhatsAppText } from './whatsapp.service.js'

export class PrestacaoMotoboyService {
  private normalizeDate(input?: Date) {
    if (!input) {
      return toUtcDateOnlyFromBusinessTz()
    }

    return toUtcDateOnly(input)
  }

  private resolveStoredDate(date: Date) {
    return toUtcDateOnly(formatDateOnlyISO(date))
  }

  private async calculateTotals(motoboyId: string, date: Date) {
    const day = toUtcDateOnly(formatDateOnlyISO(date))

    const [entregaStats, repasseStats, pendencias] = await Promise.all([
      entregaRepository.getStatsByDate(day, motoboyId),
      pendenciaRepository.findPendingRepasseByMotoboy(motoboyId),
      pendenciaRepository.findOpenRepasseListByMotoboy(motoboyId),
    ])

    const valorPendencias = repasseStats.valorPendencias

    return {
      totalEntregas: entregaStats.totalEntregas,
      valorTotal: entregaStats.valorTotal,
      entregasPagasPeloCliente: entregaStats.entregasPagasPeloCliente,
      valorPagasPeloCliente: entregaStats.valorPagasPeloCliente,
      valorPendencias,
      valorFinal: entregaStats.valorTotal + valorPendencias,
      totalPendencias: repasseStats.totalPendencias,
      pendencias,
    }
  }

  async preview(user: AuthenticatedUser, input?: SubmitPrestacaoMotoboyInput) {
    const motoboyId = isAdminUser(user)
      ? undefined
      : user.id

    if (!motoboyId) {
      throw new ForbiddenError('Informe o motoboy para visualizar a prévia')
    }

    const date = this.normalizeDate(input?.data)
    const totals = await this.calculateTotals(motoboyId, date)
    const existing = await prestacaoMotoboyRepository.findByMotoboyAndDate(
      motoboyId,
      date,
    )

    return {
      data: formatDateOnlyISO(date),
      totalEntregas: totals.totalEntregas,
      valorTotal: totals.valorTotal,
      entregasPagasPeloCliente: totals.entregasPagasPeloCliente,
      valorPagasPeloCliente: totals.valorPagasPeloCliente,
      valorPendencias: totals.valorPendencias,
      valorFinal: totals.valorFinal,
      totalPendencias: totals.totalPendencias,
      statusExistente: existing?.status ?? null,
      prestacaoId: existing?.id ?? null,
    }
  }

  async submit(user: AuthenticatedUser, input: SubmitPrestacaoMotoboyInput) {
    if (isAdminUser(user)) {
      throw new ForbiddenError('Somente motoboys podem enviar prestação')
    }

    const date = this.normalizeDate(input.data)
    const totals = await this.calculateTotals(user.id, date)
    const entregas = await entregaRepository.findByDate(date, user.id)
    const existing = await prestacaoMotoboyRepository.findByMotoboyAndDate(
      user.id,
      date,
    )

    if (existing?.status === 'ENVIADA') {
      throw new ConflictError('Já existe uma prestação aguardando aprovação para esta data')
    }

    if (existing?.status === 'APROVADA') {
      throw new ConflictError('A prestação desta data já foi aprovada')
    }

    const payload = {
      totalEntregas: totals.totalEntregas,
      valorTotal: totals.valorTotal,
      valorPendencias: totals.valorPendencias,
      valorFinal: totals.valorFinal,
      observacoes: input.observacoes,
      status: 'ENVIADA' as const,
      motivoRejeicao: null,
      aprovadaEm: null,
      rejeitadaEm: null,
    }

    const prestacao = existing
      ? await prestacaoMotoboyRepository.update(existing.id, payload)
      : await prestacaoMotoboyRepository.create({
          motoboyId: user.id,
          data: date,
          ...payload,
        })

    const whatsappText = generateMotoboyPrestacaoWhatsAppText(
      user.nome,
      prestacao,
      entregas,
      totals.pendencias,
    )

    return {
      prestacao,
      entregas,
      pendencias: totals.pendencias,
      whatsappText,
    }
  }

  async findById(user: AuthenticatedUser, id: string) {
    const prestacao = await prestacaoMotoboyRepository.findById(id)
    if (!prestacao) {
      throw new NotFoundError('Prestação não encontrada')
    }

    assertOwnsResource(user, prestacao.motoboyId)
    return prestacao
  }

  async list(user: AuthenticatedUser, filters: ListPrestacoesMotoboyInput) {
    const scopedFilters = isAdminUser(user)
      ? filters
      : {
          ...filters,
          motoboyId: user.id,
        }

    const { data, total } = await prestacaoMotoboyRepository.findMany({
      page: scopedFilters.page,
      limit: scopedFilters.limit,
      motoboyId: scopedFilters.motoboyId,
      status: scopedFilters.status,
    })

    return buildPaginatedResult(data, total, filters.page, filters.limit)
  }

  async listPending(user: AuthenticatedUser) {
    if (!isAdminUser(user)) {
      throw new ForbiddenError()
    }

    const { data, total } = await prestacaoMotoboyRepository.findMany({
      page: 1,
      limit: 50,
      status: 'ENVIADA',
    })

    return { data, total }
  }

  async countPending(user: AuthenticatedUser) {
    if (!isAdminUser(user)) {
      throw new ForbiddenError()
    }

    return { total: await prestacaoMotoboyRepository.countPending() }
  }

  async approve(user: AuthenticatedUser, id: string) {
    if (!isAdminUser(user)) {
      throw new ForbiddenError()
    }

    const prestacao = await prestacaoMotoboyRepository.findById(id)
    if (!prestacao) {
      throw new NotFoundError('Prestação não encontrada')
    }

    if (prestacao.status !== 'ENVIADA') {
      throw new ConflictError('Esta prestação não está aguardando aprovação')
    }

    await pendenciaRepository.markRepasseReceivedByMotoboy(prestacao.motoboyId)

    return prestacaoMotoboyRepository.update(id, {
      status: 'APROVADA',
      aprovadaEm: new Date(),
      rejeitadaEm: null,
      motivoRejeicao: null,
    })
  }

  async reject(
    user: AuthenticatedUser,
    id: string,
    input: RejectPrestacaoMotoboyInput,
  ) {
    if (!isAdminUser(user)) {
      throw new ForbiddenError()
    }

    const prestacao = await prestacaoMotoboyRepository.findById(id)
    if (!prestacao) {
      throw new NotFoundError('Prestação não encontrada')
    }

    if (prestacao.status !== 'ENVIADA') {
      throw new ConflictError('Esta prestação não está aguardando aprovação')
    }

    return prestacaoMotoboyRepository.update(id, {
      status: 'REJEITADA',
      motivoRejeicao: input.motivoRejeicao,
      rejeitadaEm: new Date(),
      aprovadaEm: null,
    })
  }

  async getWhatsAppText(user: AuthenticatedUser, id: string) {
    const prestacao = await this.findById(user, id)
    const date = this.resolveStoredDate(prestacao.data)

    const [entregas, pendencias] = await Promise.all([
      entregaRepository.findByDate(date, prestacao.motoboyId),
      pendenciaRepository.findOpenRepasseListByMotoboy(prestacao.motoboyId),
    ])

    return {
      text: generateMotoboyPrestacaoWhatsAppText(
        prestacao.motoboy.nome,
        prestacao,
        entregas,
        pendencias,
      ),
    }
  }
}

export const prestacaoMotoboyService = new PrestacaoMotoboyService()
