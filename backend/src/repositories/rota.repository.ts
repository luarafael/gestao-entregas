import { prisma } from '../lib/prisma.js'
import type { SaveRotaInput } from '../schemas/rota.schema.js'
import { DEFAULT_ENDERECO_PARTIDA } from '../schemas/rota.schema.js'
import { toUtcDateOnlyFromBusinessTz } from '../utils/date.utils.js'

export class RotaRepository {
  async create(input: SaveRotaInput & { motoboyId?: string | null }) {
    const data = input.data ?? toUtcDateOnlyFromBusinessTz()

    return prisma.rotaPlanejada.create({
      data: {
        data,
        enderecoInicial: input.enderecoInicial,
        distanciaTotal: input.distanciaTotal,
        tempoTotal: input.tempoTotal,
        aproximada: input.aproximada ?? false,
        motoboyId: input.motoboyId ?? null,
        paradas: {
          create: input.paradas.map((parada) => ({
            entregaId: parada.entregaId ?? null,
            cliente: parada.cliente ?? null,
            endereco: parada.endereco,
            bairro: parada.bairro ?? null,
            telefone: parada.telefone ?? null,
            observacao: parada.observacao ?? null,
            ordem: parada.ordem,
            distancia: parada.distancia ?? null,
            tempo: parada.tempo ?? null,
            prioridade: parada.prioridade,
            ordemUrgencia: parada.ordemUrgencia ?? null,
            valorEntrega: parada.valorEntrega ?? null,
            latitude: parada.latitude ?? null,
            longitude: parada.longitude ?? null,
          })),
        },
      },
      include: { paradas: { orderBy: { ordem: 'asc' } } },
    })
  }

  async findMany(page: number, limit: number) {
    const skip = (page - 1) * limit
    const [data, total] = await Promise.all([
      prisma.rotaPlanejada.findMany({
        skip,
        take: limit,
        orderBy: { criadoEm: 'desc' },
        include: {
          paradas: {
            orderBy: { ordem: 'asc' },
            select: {
              id: true,
              ordem: true,
              cliente: true,
              endereco: true,
              prioridade: true,
            },
          },
        },
      }),
      prisma.rotaPlanejada.count(),
    ])

    return { data, total }
  }

  async findById(id: string) {
    return prisma.rotaPlanejada.findUnique({
      where: { id },
      include: { paradas: { orderBy: { ordem: 'asc' } } },
    })
  }

  async findByDate(date: Date) {
    return prisma.rotaPlanejada.findMany({
      where: { data: date },
      orderBy: { criadoEm: 'desc' },
      include: {
        paradas: { orderBy: { ordem: 'asc' } },
        motoboy: { select: { id: true, nome: true } },
      },
    })
  }

  async delete(id: string) {
    return prisma.rotaPlanejada.delete({ where: { id } })
  }

  async findByEntregaId(entregaId: string) {
    return prisma.rotaParada.findMany({
      where: { entregaId },
      include: {
        rota: {
          select: { id: true, data: true, enderecoInicial: true },
        },
      },
      orderBy: { ordem: 'asc' },
    })
  }

  async syncFromEntrega(
    entregaId: string,
    data: {
      cliente?: string | null
      endereco: string
      bairro?: string | null
      observacao?: string | null
      valorEntrega?: number | null
    },
  ) {
    return prisma.rotaParada.updateMany({
      where: { entregaId },
      data: {
        cliente: data.cliente ?? null,
        endereco: data.endereco,
        bairro: data.bairro ?? null,
        observacao: data.observacao ?? null,
        valorEntrega: data.valorEntrega ?? null,
      },
    })
  }

  async getEnderecoPartidaPadrao() {
    const config = await prisma.configuracaoPlanejador.findUnique({
      where: { id: 'default' },
    })

    if (config) {
      return config.enderecoPartidaPadrao
    }

    const created = await prisma.configuracaoPlanejador.create({
      data: {
        id: 'default',
        enderecoPartidaPadrao: DEFAULT_ENDERECO_PARTIDA,
      },
    })

    return created.enderecoPartidaPadrao
  }

  async setEnderecoPartidaPadrao(enderecoPartidaPadrao: string) {
    return prisma.configuracaoPlanejador.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        enderecoPartidaPadrao,
      },
      update: { enderecoPartidaPadrao },
    })
  }
}

export const rotaRepository = new RotaRepository()
