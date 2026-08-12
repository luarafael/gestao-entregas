import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../errors/app.error.js'
import type { AuthenticatedUser } from '../middleware/auth.middleware.js'
import { entregaRepository } from '../repositories/entrega.repository.js'
import { rotaRepository } from '../repositories/rota.repository.js'
import { pushNotificationService } from './push-notification.service.js'
import { rotaExecucaoRepository } from '../repositories/rota-execucao.repository.js'
import type {
  ListRotasInput,
  OptimizeRotaInput,
  SaveRotaInput,
  SyncParadaFromEntregaInput,
} from '../schemas/rota.schema.js'
import {
  buildHaversineMatrix,
  applyUrgentPriority,
  matrixOrderToParadaIndices,
  optimizeStopOrder,
  paradaIndicesToMatrixOrder,
  summarizeRoute,
  summarizeRouteFromCoords,
} from '../utils/route-optimizer.js'
import { formatRoutingAddress } from '../utils/geocoding.utils.js'
import { buildPaginatedResult } from '../utils/pagination.utils.js'
import { toUtcDateOnlyFromBusinessTz } from '../utils/date.utils.js'
import { googleRoutesService } from './googleRoutes.service.js'
import { osrmService } from './osrm.service.js'
import { isAdminUser } from '../utils/auth-scope.utils.js'
import {
  isRouteActiveFromExecucoes,
  resolveMotoboyIdFromRota as resolveMotoboyIdFromRotaUtil,
  routeBelongsToMotoboy,
  routeHasExecutionProgress,
} from '../utils/route-motoboy.utils.js'

async function resolveMotoboyIdForSave(
  user: AuthenticatedUser,
  paradas: SaveRotaInput['paradas'],
  explicitMotoboyId?: string | null,
): Promise<string | null> {
  if (!isAdminUser(user)) {
    return user.id
  }

  if (explicitMotoboyId) {
    return explicitMotoboyId
  }

  const entregaIds = paradas
    .map((parada) => parada.entregaId)
    .filter((id): id is string => Boolean(id))

  if (entregaIds.length === 0) {
    return null
  }

  const entregas = await entregaRepository.findByIds(entregaIds)
  const motoboyIds = new Set(
    entregas
      .map((entrega) => entrega.motoboyId)
      .filter((id): id is string => Boolean(id)),
  )

  if (motoboyIds.size > 1) {
    throw new ValidationError(
      'A rota só pode conter entregas de um único motoboy',
    )
  }

  if (motoboyIds.size === 1) {
    return [...motoboyIds][0]!
  }

  return null
}

async function buildEntregaMotoboyMap(
  rotas: Array<{ paradas: Array<{ entregaId: string | null }> }>,
) {
  const entregaIds = [
    ...new Set(
      rotas.flatMap((rota) =>
        rota.paradas
          .map((parada) => parada.entregaId)
          .filter((id): id is string => Boolean(id)),
      ),
    ),
  ]

  if (entregaIds.length === 0) {
    return new Map<string, string | null>()
  }

  const entregas = await entregaRepository.findByIds(entregaIds)
  return new Map(entregas.map((entrega) => [entrega.id, entrega.motoboyId ?? null]))
}

async function prepareMotoboyRouteSlot(
  motoboyId: string,
  day: Date,
  substituirRotaId?: string | null,
) {
  const rotas = await rotaRepository.findByDateWithExecucoes(day)
  const entregaMotoboyById = await buildEntregaMotoboyMap(rotas)

  let rotaSubstituidaId = substituirRotaId ?? null

  if (rotaSubstituidaId) {
    const toReplace = rotas.find((rota) => rota.id === rotaSubstituidaId)
    if (
      toReplace &&
      routeBelongsToMotoboy(toReplace, motoboyId, entregaMotoboyById) &&
      isRouteActiveFromExecucoes(
        toReplace.execucoes,
        toReplace.paradas.length,
      )
    ) {
      await rotaRepository.delete(rotaSubstituidaId)
    } else {
      rotaSubstituidaId = null
    }
  }

  const remaining = rotaSubstituidaId
    ? rotas.filter((rota) => rota.id !== rotaSubstituidaId)
    : rotas

  for (const rota of remaining) {
    if (rota.concluidaEm) {
      continue
    }

    if (!routeBelongsToMotoboy(rota, motoboyId, entregaMotoboyById)) {
      continue
    }

    if (
      !isRouteActiveFromExecucoes(rota.execucoes, rota.paradas.length)
    ) {
      continue
    }

    if (routeHasExecutionProgress(rota.execucoes)) {
      throw new ConflictError(
        'Este motoboy já possui uma rota em andamento. Conclua a rota atual antes de montar outra.',
      )
    }

    await rotaRepository.delete(rota.id)
  }
}

async function resolveMotoboyIdFromRota(rota: {
  motoboyId: string | null
  paradas: Array<{ entregaId: string | null }>
}) {
  const entregaIds = rota.paradas
    .map((parada) => parada.entregaId)
    .filter((id): id is string => Boolean(id))

  const entregaMotoboyById = new Map<string, string | null>()

  if (entregaIds.length > 0) {
    const entregas = await entregaRepository.findByIds(entregaIds)
    for (const entrega of entregas) {
      entregaMotoboyById.set(entrega.id, entrega.motoboyId ?? null)
    }
  }

  return resolveMotoboyIdFromRotaUtil(rota, entregaMotoboyById)
}

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

  const urgentes = order.filter(
    (index) => paradas[index]?.prioridade === 'URGENTE',
  )

  if (urgentes.length > 1) {
    const ordens = urgentes.map((index) => paradas[index]?.ordemUrgencia)
    const definidas = ordens.filter((value) => value != null)
    const duplicadas = definidas.length !== new Set(definidas).size
    const semOrdem = ordens.some((value) => value == null)

    if (duplicadas || semOrdem) {
      sugestoes.push(
        'Defina a ordem de urgência (1ª, 2ª…) para ordenar entregas urgentes entre si.',
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

function resolveManualOrder(paradas: OptimizeRotaInput['paradas']): number[] {
  return paradas
    .map((parada, index) => ({
      index,
      ordem: parada.ordem ?? index + 1,
    }))
    .sort((a, b) => a.ordem - b.ordem || a.index - b.index)
    .map((item) => item.index)
}

export class RotaService {
  async optimize(input: OptimizeRotaInput) {
    const addresses = input.paradas.map((parada) => ({
      endereco: parada.endereco,
      bairro: parada.bairro,
    }))
    let order: number[] = input.preservarOrdem
      ? resolveManualOrder(input.paradas)
      : []
    let aproximada = true
    let polyline: string | undefined
    let matrix = null as ReturnType<typeof buildHaversineMatrix> | null
    let useCoordFallback = false

    const originCoord =
      (await googleRoutesService.geocode(input.enderecoInicial)) ??
      null
    const geocodedCoords = await googleRoutesService.geocodeMany(addresses)
    const coords = geocodedCoords.map((coord, index) => {
      if (coord) return coord
      const parada = input.paradas[index]
      if (parada?.latitude != null && parada?.longitude != null) {
        return { lat: parada.latitude, lng: parada.longitude }
      }
      return null
    })

    try {
      const googleMatrix = await googleRoutesService.computeRouteMatrix(
        input.enderecoInicial,
        addresses,
      )

      if (googleMatrix) {
        matrix = googleMatrix
        if (!input.preservarOrdem) {
          order = matrixOrderToParadaIndices(optimizeStopOrder(googleMatrix))
        }
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
            if (!input.preservarOrdem) {
              order = matrixOrderToParadaIndices(optimizeStopOrder(osrmMatrix))
            }
            aproximada = false
          }
        } catch {
          matrix = null
        }

        if (!matrix) {
          matrix = buildHaversineMatrix(geocodedPoints)
          if (!input.preservarOrdem) {
            order = matrixOrderToParadaIndices(optimizeStopOrder(matrix))
          }
          aproximada = true
        }
      } else {
        if (!input.preservarOrdem) {
          order = input.paradas
          .map((_, index) => index)
          .sort((a, b) => {
            const pa = input.paradas[a]
            const pb = input.paradas[b]
            if (pa?.prioridade === 'URGENTE' && pb?.prioridade !== 'URGENTE') {
              return -1
            }
            if (pa?.prioridade !== 'URGENTE' && pb?.prioridade === 'URGENTE') {
              return 1
            }
            if (pa?.prioridade === 'URGENTE' && pb?.prioridade === 'URGENTE') {
              return (
                (pa.ordemUrgencia ?? Number.POSITIVE_INFINITY) -
                (pb.ordemUrgencia ?? Number.POSITIVE_INFINITY)
              )
            }
            return a - b
          })
        }
        useCoordFallback = true
        aproximada = true
      }
    }

    if (input.preservarOrdem && order.length === 0) {
      order = resolveManualOrder(input.paradas)
    }

    if (!input.preservarOrdem) {
      order = applyUrgentPriority(order, input.paradas)
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

    const summary = useCoordFallback || !matrix
      ? summarizeRouteFromCoords(order, originCoord, coords)
      : summarizeRoute(paradaIndicesToMatrixOrder(order), matrix)

    const orderedCoords = order
      .map((index) => coords[index])
      .filter((point): point is { lat: number; lng: number } => point !== null)

    let legs = summary.legs
    let distanciaTotal = summary.distanciaTotal
    let tempoTotal = summary.tempoTotal

    if (originCoord && orderedCoords.length === order.length) {
      try {
        const osrmLegs = await osrmService.computeRouteLegs([
          originCoord,
          ...orderedCoords,
        ])
        if (osrmLegs && osrmLegs.length === order.length) {
          legs = osrmLegs
          distanciaTotal = osrmLegs.reduce((sum, leg) => sum + leg.distancia, 0)
          tempoTotal = osrmLegs.reduce((sum, leg) => sum + leg.tempo, 0)
        }
      } catch {
        // mantém legs da matriz/haversine
      }
    }

    const paradasOrdenadas = order.map((index, position) => {
      const parada = input.paradas[index]!
      const leg = legs[position]
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
      distanciaTotal: Math.round(distanciaTotal),
      tempoTotal: Math.round(tempoTotal),
      totalEntregas: paradasOrdenadas.length,
      aproximada,
      polyline: polyline ?? null,
      sugestoes,
      paradas: paradasOrdenadas,
    }
  }

  async planear(user: AuthenticatedUser, input: OptimizeRotaInput) {
    const optimized = await this.optimize(input)
    const rota = await this.save(user, {
      enderecoInicial: optimized.enderecoInicial,
      distanciaTotal: optimized.distanciaTotal,
      tempoTotal: optimized.tempoTotal,
      aproximada: optimized.aproximada,
      paradas: optimized.paradas,
      substituirRotaId: input.substituirRotaId,
      motoboyId: input.motoboyId,
    })

    const paradas = optimized.paradas.map((parada) => {
      const savedParada = rota.paradas.find(
        (item) =>
          item.ordem === parada.ordem &&
          item.endereco === parada.endereco &&
          (item.cliente ?? '') === (parada.cliente ?? ''),
      )

      return {
        ...parada,
        paradaId: savedParada?.id ?? null,
      }
    })

    return {
      ...optimized,
      paradas,
      rotaId: rota.id,
    }
  }

  async save(user: AuthenticatedUser, input: SaveRotaInput) {
    const motoboyId = await resolveMotoboyIdForSave(
      user,
      input.paradas,
      input.motoboyId,
    )
    const day = input.data ?? toUtcDateOnlyFromBusinessTz()

    if (motoboyId) {
      await prepareMotoboyRouteSlot(
        motoboyId,
        day,
        input.substituirRotaId,
      )
    }

    const rota = await rotaRepository.create({ ...input, data: day, motoboyId })
    await rotaExecucaoRepository.initForRota(rota.id)

    if (motoboyId) {
      pushNotificationService.notifyMotoboyNewRoute(motoboyId, {
        rotaId: rota.id,
        totalParadas: rota.paradas.length,
        enderecoInicial: rota.enderecoInicial,
      })
    }

    return rota
  }

  async list(filters: ListRotasInput) {
    const { data, total } = await rotaRepository.findMany(
      filters.page,
      filters.limit,
    )
    return buildPaginatedResult(data, total, filters.page, filters.limit)
  }

  async getEventosPlanejamento(user: AuthenticatedUser, since: Date) {
    if (isAdminUser(user)) {
      throw new ForbiddenError(
        'Eventos de rota planejada são exclusivos para motoboys',
      )
    }

    const rotas = await rotaRepository.findCreatedSince(user.id, since)

    return rotas.map((rota) => ({
      id: rota.id,
      motoboyId: rota.motoboyId,
      totalParadas: rota._count.paradas,
      enderecoInicial: rota.enderecoInicial,
      criadoEm: rota.criadoEm.toISOString(),
    }))
  }

  async findById(id: string) {
    const rota = await rotaRepository.findById(id)
    if (!rota) throw new NotFoundError('Rota planejada não encontrada')
    return rota
  }

  async getActiveToday(user: AuthenticatedUser) {
    const day = toUtcDateOnlyFromBusinessTz()

    if (isAdminUser(user)) {
      const rota = await rotaRepository.findActiveToday(day)
      return { rota: rota ?? null }
    }

    const rota = await rotaRepository.findActiveForMotoboyToday(user.id, day)
    return { rota: rota ?? null }
  }

  async delete(id: string) {
    await this.findById(id)
    return rotaRepository.delete(id)
  }

  async duplicate(_user: AuthenticatedUser, id: string) {
    const rota = await this.findById(id)
    const motoboyId = await resolveMotoboyIdFromRota(rota)
    const day = rota.data ?? toUtcDateOnlyFromBusinessTz()

    if (motoboyId) {
      await prepareMotoboyRouteSlot(motoboyId, day)
    }

    return rotaRepository.create({
      motoboyId: rota.motoboyId,
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
        telefone: parada.telefone,
        observacao: parada.observacao,
        prioridade: parada.prioridade,
        ordemUrgencia: parada.ordemUrgencia ?? null,
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
