import { NotFoundError } from '../errors/app.error.js'
import { entregaRepository } from '../repositories/entrega.repository.js'
import { rotaExecucaoRepository } from '../repositories/rota-execucao.repository.js'
import { rotaRepository } from '../repositories/rota.repository.js'
import { usuarioRepository } from '../repositories/usuario.repository.js'
import { pushNotificationService } from './push-notification.service.js'
import type {
  BulkSyncExecucaoInput,
  UpdateExecucaoParadaInput,
} from '../schemas/rota-execucao.schema.js'
import {
  areAllParadasDelivered,
  findNextParadaIdForEmRota,
  resolveMotoboyIdFromRota,
} from '../utils/route-motoboy.utils.js'

function getRouteConcludedAt(
  execucoes: Array<{ dataHoraStatus: Date | null }>,
): Date {
  const timestamps = execucoes
    .map((execucao) => execucao.dataHoraStatus)
    .filter((value): value is Date => value instanceof Date)
    .sort((a, b) => b.getTime() - a.getTime())

  return timestamps[0] ?? new Date()
}

export class RotaExecucaoService {
  async getOrInit(rotaId: string) {
    const rota = await rotaRepository.findById(rotaId)
    if (!rota) {
      throw new NotFoundError('Rota não encontrada')
    }

    const execucoes = await rotaExecucaoRepository.initForRota(rotaId)
    return execucoes ?? []
  }

  async list(rotaId: string) {
    const rota = await rotaRepository.findById(rotaId)
    if (!rota) {
      throw new NotFoundError('Rota não encontrada')
    }

    return rotaExecucaoRepository.findByRotaId(rotaId)
  }

  async updateParada(
    rotaId: string,
    paradaId: string,
    input: UpdateExecucaoParadaInput,
  ) {
    const rota = await rotaRepository.findById(rotaId)
    if (!rota) {
      throw new NotFoundError('Rota não encontrada')
    }

    const parada = rota.paradas.find((item) => item.id === paradaId)
    if (!parada) {
      throw new NotFoundError('Parada não encontrada nesta rota')
    }

    await rotaExecucaoRepository.initForRota(rotaId)

    const execucoesBefore = await rotaExecucaoRepository.findByRotaId(rotaId)
    const previousStatus = execucoesBefore.find(
      (item) => item.paradaId === paradaId,
    )?.status

    const deliveredAt = new Date()

    const result = await rotaExecucaoRepository.updateByParadaId(
      rotaId,
      paradaId,
      {
        status: input.status,
        observacao: input.observacao,
        dataHoraStatus: deliveredAt,
      },
    )

    if (result.count === 0) {
      throw new NotFoundError('Registro de execução não encontrado')
    }

    if (input.status === 'ENTREGUE' && parada.entregaId) {
      await entregaRepository.markDelivered(parada.entregaId, deliveredAt)
    }

    if (input.status === 'ENTREGUE') {
      const execucoesAtual = await rotaExecucaoRepository.findByRotaId(rotaId)
      const nextParadaId = findNextParadaIdForEmRota(
        rota.paradas,
        execucoesAtual,
      )

      if (nextParadaId) {
        await rotaExecucaoRepository.updateByParadaId(rotaId, nextParadaId, {
          status: 'EM_ROTA',
          dataHoraStatus: deliveredAt,
        })
      }

      if (previousStatus !== 'ENTREGUE') {
        void this.notifyDeliveryCompleted(rota, parada, deliveredAt)
      }
    }

    const rotaConcluida =
      input.status === 'ENTREGUE'
        ? await this.tryConcludeRouteEntregas(rotaId)
        : false
    const execucoes = await rotaExecucaoRepository.findByRotaId(rotaId)

    return { execucoes, rotaConcluida }
  }

  async bulkSync(rotaId: string, input: BulkSyncExecucaoInput) {
    const rota = await rotaRepository.findById(rotaId)
    if (!rota) {
      throw new NotFoundError('Rota não encontrada')
    }

    await rotaExecucaoRepository.initForRota(rotaId)

    const count = await rotaExecucaoRepository.bulkSync(rotaId, input.paradas)

    for (const item of input.paradas) {
      if (item.status !== 'ENTREGUE') continue

      const parada = rota.paradas.find((entry) => entry.id === item.paradaId)
      if (!parada?.entregaId) continue

      await entregaRepository.markDelivered(
        parada.entregaId,
        item.dataHoraStatus ?? new Date(),
      )
    }

    const rotaConcluida = await this.tryConcludeRouteEntregas(rotaId)
    const execucoes = await rotaExecucaoRepository.findByRotaId(rotaId)

    return { count, execucoes, rotaConcluida }
  }

  async reconcileRouteConclusion(rotaId: string) {
    return this.tryConcludeRouteEntregas(rotaId)
  }

  private async notifyDeliveryCompleted(
    rota: NonNullable<Awaited<ReturnType<typeof rotaRepository.findById>>>,
    parada: { id: string; cliente: string | null },
    deliveredAt: Date,
  ) {
    const motoboyId = rota.motoboyId
    if (!motoboyId) {
      return
    }

    const motoboy = await usuarioRepository.findById(motoboyId)
    const cliente = parada.cliente?.trim() || 'Cliente'

    pushNotificationService.notifyAdminsDeliveryCompleted({
      execucaoId: `${rota.id}-${parada.id}`,
      motoboyNome: motoboy?.nome ?? 'Motoboy',
      cliente,
      dataHoraStatus: deliveredAt,
    })
  }

  private async tryConcludeRouteEntregas(rotaId: string): Promise<boolean> {
    const rota = await rotaRepository.findById(rotaId)
    if (!rota || rota.paradas.length === 0 || rota.concluidaEm) {
      return false
    }

    const execucoes = await rotaExecucaoRepository.findByRotaId(rotaId)
    if (!areAllParadasDelivered(rota.paradas, execucoes)) {
      return false
    }

    const entregaIds = rota.paradas
      .map((parada) => parada.entregaId)
      .filter((id): id is string => Boolean(id))

    const entregas =
      entregaIds.length > 0 ? await entregaRepository.findByIds(entregaIds) : []

    const entregaMotoboyById = new Map(
      entregas.map((entrega) => [entrega.id, entrega.motoboyId ?? null]),
    )

    const motoboyId = resolveMotoboyIdFromRota(rota, entregaMotoboyById)
    const execucaoByParadaId = new Map(
      execucoes.map((execucao) => [execucao.paradaId, execucao]),
    )

    for (const parada of rota.paradas) {
      const execucao = execucaoByParadaId.get(parada.id)
      const deliveredAt = execucao?.dataHoraStatus ?? new Date()

      if (parada.entregaId) {
        await entregaRepository.markDelivered(parada.entregaId, deliveredAt)
        continue
      }

      if (!motoboyId) {
        continue
      }

      const valorEntrega =
        parada.valorEntrega != null && Number(parada.valorEntrega) > 0
          ? Number(parada.valorEntrega)
          : 1

      const entrega = await entregaRepository.create(
        {
          nomeCliente: parada.cliente ?? undefined,
          endereco: parada.endereco,
          bairro: parada.bairro?.trim() || 'Centro',
          observacao: parada.observacao ?? undefined,
          valorEntrega,
          pagoPeloCliente: false,
        },
        motoboyId,
      )

      await entregaRepository.markDelivered(entrega.id, deliveredAt)
      await rotaRepository.linkParadaEntrega(parada.id, entrega.id)
    }

    await rotaRepository.markConcluded(rotaId, getRouteConcludedAt(execucoes))
    return true
  }
}

export const rotaExecucaoService = new RotaExecucaoService()
