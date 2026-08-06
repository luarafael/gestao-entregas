import { NotFoundError } from '../errors/app.error.js'
import { rotaRepository } from '../repositories/rota.repository.js'
import type {
  ListRotasInput,
  OptimizeRotaInput,
  SaveRotaInput,
  SyncParadaFromEntregaInput,
} from '../schemas/rota.schema.js'
import {
  buildHaversineMatrix,
  matrixOrderToParadaIndices,
  optimizeStopOrder,
  paradaIndicesToMatrixOrder,
  summarizeRoute,
  summarizeRouteFromCoords,
} from '../utils/route-optimizer.js'
import { formatRoutingAddress } from '../utils/geocoding.utils.js'
import { buildPaginatedResult } from '../utils/pagination.utils.js'
import { googleRoutesService } from './googleRoutes.service.js'
import { osrmService } from './osrm.service.js'

function buildSuggestions(params: {
  paradas: OptimizeRotaInput['paradas']
  order: number[]
  aproximada: boolean
  tempoTotal: number
}): string[] {
  const sugestoes: string[] = []
  const { paradas, order, aproximada } = params

  if (aproximada) {
    sugestoes.push(
      'Rota estimada em linha reta. Inclua bairro e cidade completos nos endereços para melhor precisão.',
    )
  }

  const urgentes = order
    .map((index) => ({ index, parada: paradas[index] }))
    .filter((item) => item.parada?.prioridade === 'URGENTE')

  if (urgentes.length > 0 && order[0] !== undefined) {
    const first = paradas[order[0]]
    if (first?.prioridade !== 'URGENTE') {
      sugestoes.push(
        'Há entregas urgentes que podem ser priorizadas no início da rota.',
      )
    }
  }

  for (let i = 0; i < order.length - 1; i += 1) {
    const a = paradas[order[i]!]?.bairro?.toLowerCase().trim()
    const b = paradas[order[i + 1]!]?.bairro?.toLowerCase().trim()
    if (a && b && a === b) {
      sugestoes.push(
        `Existem entregas próximas no bairro "${paradas[order[i]!]!.bairro}" que já estão em sequência.`,
      )
      break
    }
  }

  return sugestoes
}

export class RotaService {
  async optimize(input: OptimizeRotaInput) {
    const addresses = input.paradas.map((parada) => ({
      endereco: parada.endereco,
      bairro: parada.bairro,
    }))
    let order: number[] = []
    let aproximada = true
    let polyline: string | undefined
    let matrix = null as ReturnType<typeof buildHaversineMatrix> | null
    let useCoordFallback = false

    const originCoord = await googleRoutesService.geocode(input.enderecoInicial)
    const coords = await googleRoutesService.geocodeMany(addresses)

    try {
      const googleMatrix = await googleRoutesService.computeRouteMatrix(
        input.enderecoInicial,
        addresses,
      )

      if (googleMatrix) {
        matrix = googleMatrix
        order = matrixOrderToParadaIndices(optimizeStopOrder(googleMatrix))
        aproximada = false

        const orderedAddresses = order.map((index) =>
          formatRoutingAddress(addresses[index]!),
        )
        const googleRoute = await googleRoutesService.computeOptimizedRoute(
          input.enderecoInicial,
          orderedAddresses,
        )
        polyline = googleRoute?.polyline
      }
    } catch {
      matrix = null
    }

    if (!matrix) {
      const points = [originCoord, ...coords]
      if (points.every((point) => point !== null)) {
        const geocodedPoints = points as Array<{ lat: number; lng: number }>

        try {
          const osrmMatrix = await osrmService.computeRouteMatrix(geocodedPoints)
          if (osrmMatrix) {
            matrix = osrmMatrix
            order = matrixOrderToParadaIndices(optimizeStopOrder(osrmMatrix))
            aproximada = false
          }
        } catch {
          matrix = null
        }

        if (!matrix) {
          matrix = buildHaversineMatrix(geocodedPoints)
          order = matrixOrderToParadaIndices(optimizeStopOrder(matrix))
          aproximada = true
        }
      } else {
        order = input.paradas
          .map((_, index) => index)
          .sort((a, b) => {
            const pa = input.paradas[a]?.prioridade === 'URGENTE' ? 0 : 1
            const pb = input.paradas[b]?.prioridade === 'URGENTE' ? 0 : 1
            return pa - pb
          })
        useCoordFallback = true
        aproximada = true
      }
    }

    if (!polyline && originCoord) {
      const routePoints = [
        originCoord,
        ...order
          .map((index) => coords[index])
          .filter((point): point is { lat: number; lng: number } => point !== null),
      ]
      if (routePoints.length >= 2) {
        polyline = (await osrmService.computeRoutePolyline(routePoints)) ?? undefined
      }
    }

    // Preferir urgentes no início quando possível sem quebrar muito
    const urgentFirst = [...order].sort((a, b) => {
      const pa = input.paradas[a]?.prioridade === 'URGENTE' ? 0 : 1
      const pb = input.paradas[b]?.prioridade === 'URGENTE' ? 0 : 1
      return pa - pb
    })
    const hasUrgent = input.paradas.some((p) => p.prioridade === 'URGENTE')
    if (hasUrgent && urgentFirst[0] !== order[0]) {
      // Mantém NN/2-opt; só sugere — não força reordenar se já otimizado por tempo
    }

    const summary = useCoordFallback || !matrix
      ? summarizeRouteFromCoords(order, originCoord, coords)
      : summarizeRoute(paradaIndicesToMatrixOrder(order), matrix)

    const paradasOrdenadas = order.map((index, position) => {
      const parada = input.paradas[index]!
      const leg = summary.legs[position]
      const coord = coords[index]

      return {
        ...parada,
        ordem: position + 1,
        distancia: Math.round(leg?.distancia ?? 0),
        tempo: Math.round(leg?.tempo ?? 0),
        latitude: coord?.lat ?? null,
        longitude: coord?.lng ?? null,
      }
    })

    const sugestoes = buildSuggestions({
      paradas: input.paradas,
      order,
      aproximada,
      tempoTotal: summary.tempoTotal,
    })

    if (!originCoord) {
      sugestoes.push(
        'Não foi possível localizar o endereço de partida no mapa. Verifique o endereço completo (bairro e cidade).',
      )
    }

    const missingCoords = coords.filter((coord) => coord === null).length
    if (missingCoords > 0) {
      sugestoes.push(
        `${missingCoords} entrega(s) não foram localizadas no mapa. Informe rua/número no endereço e o bairro no campo correspondente.`,
      )
    }

    return {
      enderecoInicial: input.enderecoInicial,
      origem: originCoord,
      distanciaTotal: Math.round(summary.distanciaTotal),
      tempoTotal: Math.round(summary.tempoTotal),
      totalEntregas: paradasOrdenadas.length,
      aproximada,
      polyline: polyline ?? null,
      sugestoes,
      paradas: paradasOrdenadas,
    }
  }

  async save(input: SaveRotaInput) {
    return rotaRepository.create(input)
  }

  async list(filters: ListRotasInput) {
    const { data, total } = await rotaRepository.findMany(
      filters.page,
      filters.limit,
    )
    return buildPaginatedResult(data, total, filters.page, filters.limit)
  }

  async findById(id: string) {
    const rota = await rotaRepository.findById(id)
    if (!rota) throw new NotFoundError('Rota planejada não encontrada')
    return rota
  }

  async delete(id: string) {
    await this.findById(id)
    return rotaRepository.delete(id)
  }

  async duplicate(id: string) {
    const rota = await this.findById(id)
    return rotaRepository.create({
      enderecoInicial: rota.enderecoInicial,
      distanciaTotal: Number(rota.distanciaTotal),
      tempoTotal: rota.tempoTotal,
      aproximada: rota.aproximada,
      paradas: rota.paradas.map((parada) => ({
        tempId: parada.id,
        entregaId: parada.entregaId,
        cliente: parada.cliente,
        endereco: parada.endereco,
        bairro: parada.bairro,
        observacao: parada.observacao,
        prioridade: parada.prioridade,
        valorEntrega: parada.valorEntrega
          ? Number(parada.valorEntrega)
          : null,
        ordem: parada.ordem,
        distancia: parada.distancia ? Number(parada.distancia) : null,
        tempo: parada.tempo,
        latitude: parada.latitude,
        longitude: parada.longitude,
      })),
    })
  }

  async findByEntregaId(entregaId: string) {
    return rotaRepository.findByEntregaId(entregaId)
  }

  async syncFromEntrega(input: SyncParadaFromEntregaInput) {
    return rotaRepository.syncFromEntrega(input.entregaId, {
      cliente: input.cliente,
      endereco: input.endereco,
      bairro: input.bairro,
      observacao: input.observacao,
      valorEntrega: input.valorEntrega,
    })
  }

  async getEnderecoPartidaPadrao() {
    const enderecoPartidaPadrao =
      await rotaRepository.getEnderecoPartidaPadrao()
    return { enderecoPartidaPadrao }
  }

  async setEnderecoPartidaPadrao(enderecoPartidaPadrao: string) {
    const config = await rotaRepository.setEnderecoPartidaPadrao(
      enderecoPartidaPadrao,
    )
    return {
      enderecoPartidaPadrao: config.enderecoPartidaPadrao,
      atualizadoEm: config.atualizadoEm,
    }
  }
}

export const rotaService = new RotaService()
