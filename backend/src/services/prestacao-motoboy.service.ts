import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../errors/app.error.js'
import type { AuthenticatedUser } from '../middleware/auth.middleware.js'
import { entregaRepository } from '../repositories/entrega.repository.js'
import { pendenciaRepository } from '../repositories/pendencia.repository.js'
import { prestacaoMotoboyRepository } from '../repositories/prestacao-motoboy.repository.js'
import { usuarioRepository } from '../repositories/usuario.repository.js'
import type {
  ListPrestacoesMotoboyInput,
  RejectPrestacaoMotoboyInput,
  SubmitPrestacaoMotoboyInput,
  UpdatePrestacaoMotoboyInput,
} from '../schemas/prestacao-motoboy.schema.js'
import { assertOwnsResource, isAdminUser } from '../utils/auth-scope.utils.js'
import {
  formatDateOnlyISO,
  toUtcDateOnly,
  toUtcDateOnlyFromBusinessTz,
} from '../utils/date.utils.js'
import { buildPaginatedResult } from '../utils/pagination.utils.js'
import { generateMotoboyPrestacaoWhatsAppText } from './whatsapp.service.js'
import { pushNotificationService } from './push-notification.service.js'

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
      entregaRepository.getStatsByDate(day, { motoboyId }),
      pendenciaRepository.findPendingRepasseByMotoboy(motoboyId, day),
      pendenciaRepository.findOpenRepasseListByMotoboy(motoboyId, day),
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

  private async resolveMotoboyTarget(
    user: AuthenticatedUser,
    motoboyId?: string,
  ) {
    if (!isAdminUser(user)) {
      const motoboy = await usuarioRepository.findMotoboyById(user.id)
      return {
        motoboyId: user.id,
        motoboyNome: user.nome,
        pix: motoboy?.pix ?? null,
      }
    }

    if (!motoboyId) {
      throw new ValidationError('Selecione um motoboy')
    }

    const motoboy = await usuarioRepository.findMotoboyById(motoboyId)
    if (!motoboy || !motoboy.ativo) {
      throw new NotFoundError('Motoboy não encontrado')
    }

    return {
      motoboyId: motoboy.id,
      motoboyNome: motoboy.nome,
      pix: motoboy.pix ?? null,
    }
  }

  async preview(
    user: AuthenticatedUser,
    input?: Pick<SubmitPrestacaoMotoboyInput, 'data' | 'motoboyId'>,
  ) {
    const { motoboyId } = await this.resolveMotoboyTarget(user, input?.motoboyId)
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
    const { motoboyId, motoboyNome, pix } = await this.resolveMotoboyTarget(
      user,
      input.motoboyId,
    )

    const date = this.normalizeDate(input.data)
    const totals = await this.calculateTotals(motoboyId, date)
    const entregas = await entregaRepository.findByDate(date, { motoboyId })
    const existing = await prestacaoMotoboyRepository.findByMotoboyAndDate(
      motoboyId,
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
          motoboyId,
          data: date,
          ...payload,
        })

    const whatsappText = generateMotoboyPrestacaoWhatsAppText(
      motoboyNome,
      prestacao,
      entregas,
      totals.pendencias,
      pix,
    )

    pushNotificationService.notifyAdminsNewApproval({
      prestacaoId: prestacao.id,
      motoboyNome,
      data: prestacao.data,
    })

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
      historico: scopedFilters.historico,
    })

    return buildPaginatedResult(data, total, filters.page, filters.limit)
  }

  async listPending(user: AuthenticatedUser, motoboyId?: string) {
    if (!isAdminUser(user)) {
      throw new ForbiddenError()
    }

    const { data, total } = await prestacaoMotoboyRepository.findMany({
      page: 1,
      limit: 50,
      status: 'ENVIADA',
      motoboyId,
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

    const updated = await prestacaoMotoboyRepository.update(id, {
      status: 'APROVADA',
      aprovadaEm: new Date(),
      rejeitadaEm: null,
      motivoRejeicao: null,
    })

    pushNotificationService.notifyMotoboyPrestacaoApproved(
      prestacao.motoboyId,
      prestacao.data,
    )

    return updated
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

    const updated = await prestacaoMotoboyRepository.update(id, {
      status: 'REJEITADA',
      motivoRejeicao: input.motivoRejeicao,
      rejeitadaEm: new Date(),
      aprovadaEm: null,
    })

    pushNotificationService.notifyMotoboyPrestacaoRejected(prestacao.motoboyId, {
      data: prestacao.data,
      motivoRejeicao: input.motivoRejeicao,
    })

    return updated
  }

  async getWhatsAppText(user: AuthenticatedUser, id: string) {
    const prestacao = await this.findById(user, id)
    const date = this.resolveStoredDate(prestacao.data)

    const [entregas, pendencias] = await Promise.all([
      entregaRepository.findByDate(date, { motoboyId: prestacao.motoboyId }),
      pendenciaRepository.findOpenRepasseListByMotoboy(
        prestacao.motoboyId,
        date,
      ),
    ])

    return {
      text: generateMotoboyPrestacaoWhatsAppText(
        prestacao.motoboy.nome,
        prestacao,
        entregas,
        pendencias,
        prestacao.motoboy.pix,
      ),
    }
  }

  async update(user: AuthenticatedUser, id: string, input: UpdatePrestacaoMotoboyInput) {
    if (!isAdminUser(user)) {
      throw new ForbiddenError()
    }

    const prestacao = await prestacaoMotoboyRepository.findById(id)
    if (!prestacao) {
      throw new NotFoundError('Prestação não encontrada')
    }

    if (input.recalcular) {
      const date = this.resolveStoredDate(prestacao.data)
      const totals = await this.calculateTotals(prestacao.motoboyId, date)

      return prestacaoMotoboyRepository.update(id, {
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

    return prestacaoMotoboyRepository.update(id, {
      observacoes:
        input.observacoes === undefined ? prestacao.observacoes : input.observacoes,
    })
  }

  async delete(user: AuthenticatedUser, id: string) {
    if (!isAdminUser(user)) {
      throw new ForbiddenError()
    }

    const prestacao = await prestacaoMotoboyRepository.findById(id)
    if (!prestacao) {
      throw new NotFoundError('Prestação não encontrada')
    }

    return prestacaoMotoboyRepository.delete(id)
  }

  async getEventosStatus(user: AuthenticatedUser, since: Date) {
    if (isAdminUser(user)) {
      throw new ForbiddenError(
        'Eventos de prestação são exclusivos para motoboys',
      )
    }

    const prestacoes = await prestacaoMotoboyRepository.findStatusEventsSince(
      user.id,
      since,
    )

    const eventos: Array<{
      id: string
      prestacaoId: string
      status: 'APROVADA' | 'REJEITADA'
      data: string
      dataHora: string
      motivoRejeicao: string | null
    }> = []

    for (const prestacao of prestacoes) {
      if (prestacao.aprovadaEm && prestacao.aprovadaEm > since) {
        eventos.push({
          id: `${prestacao.id}-aprovada`,
          prestacaoId: prestacao.id,
          status: 'APROVADA',
          data: formatDateOnlyISO(prestacao.data),
          dataHora: prestacao.aprovadaEm.toISOString(),
          motivoRejeicao: null,
        })
      }

      if (prestacao.rejeitadaEm && prestacao.rejeitadaEm > since) {
        eventos.push({
          id: `${prestacao.id}-rejeitada`,
          prestacaoId: prestacao.id,
          status: 'REJEITADA',
          data: formatDateOnlyISO(prestacao.data),
          dataHora: prestacao.rejeitadaEm.toISOString(),
          motivoRejeicao: prestacao.motivoRejeicao,
        })
      }
    }

    return eventos.sort((a, b) => a.dataHora.localeCompare(b.dataHora))
  }
}

export const prestacaoMotoboyService = new PrestacaoMotoboyService()
