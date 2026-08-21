import { prisma } from '../lib/prisma.js'
import { motoboyRelationSelect } from './motoboy-select.js'
import type { StatusExecucaoParada } from '../schemas/rota-execucao.schema.js'

export class RotaExecucaoRepository {
  async initForRota(rotaId: string) {
    const rota = await prisma.rotaPlanejada.findUnique({
      where: { id: rotaId },
      include: { paradas: { orderBy: { ordem: 'asc' } } },
    })

    if (!rota) return null

    const existing = await prisma.rotaExecucao.findMany({
      where: { rotaId },
      select: { paradaId: true },
    })

    const coveredParadaIds = new Set(
      existing
        .map((item) => item.paradaId)
        .filter((id): id is string => Boolean(id)),
    )

    const missingParadas = rota.paradas.filter(
      (parada) => !coveredParadaIds.has(parada.id),
    )

    if (missingParadas.length > 0) {
      await prisma.rotaExecucao.createMany({
        data: missingParadas.map((parada) => ({
          rotaId,
          paradaId: parada.id,
          entregaId: parada.entregaId,
          ordem: parada.ordem,
          status: 'PENDENTE',
        })),
      })
    }

    return this.findByRotaId(rotaId)
  }

  async findByRotaId(rotaId: string) {
    return prisma.rotaExecucao.findMany({
      where: { rotaId },
      orderBy: { ordem: 'asc' },
      include: {
        parada: {
          select: {
            id: true,
            cliente: true,
            endereco: true,
            bairro: true,
            telefone: true,
            observacao: true,
            ordem: true,
            distancia: true,
            tempo: true,
          },
        },
      },
    })
  }

  async updateByParadaId(
    rotaId: string,
    paradaId: string,
    data: {
      status: StatusExecucaoParada
      observacao?: string | null
      dataHoraStatus?: Date
    },
  ) {
    return prisma.rotaExecucao.updateMany({
      where: { rotaId, paradaId },
      data: {
        status: data.status,
        observacao: data.observacao ?? null,
        dataHoraStatus: data.dataHoraStatus ?? new Date(),
      },
    })
  }

  async findRecentEntregues(since: Date, motoboyId?: string) {
    return prisma.rotaExecucao.findMany({
      where: {
        status: 'ENTREGUE',
        dataHoraStatus: { gt: since },
        rota: {
          concluidaEm: null,
          ...(motoboyId ? { motoboyId } : {}),
        },
      },
      orderBy: { dataHoraStatus: 'asc' },
      take: 50,
      include: {
        parada: {
          select: {
            cliente: true,
            endereco: true,
            ordem: true,
          },
        },
        rota: {
          select: {
            motoboyId: true,
            motoboy: { select: motoboyRelationSelect },
          },
        },
      },
    })
  }

  async bulkSync(
    rotaId: string,
    paradas: Array<{
      paradaId: string
      status: StatusExecucaoParada
      observacao?: string | null
      dataHoraStatus?: Date | null
    }>,
  ) {
    const updates = await Promise.all(
      paradas.map((parada) =>
        prisma.rotaExecucao.updateMany({
          where: { rotaId, paradaId: parada.paradaId },
          data: {
            status: parada.status,
            observacao: parada.observacao ?? null,
            dataHoraStatus: parada.dataHoraStatus ?? new Date(),
          },
        }),
      ),
    )

    return updates.reduce((sum, item) => sum + item.count, 0)
  }
}

export const rotaExecucaoRepository = new RotaExecucaoRepository()
