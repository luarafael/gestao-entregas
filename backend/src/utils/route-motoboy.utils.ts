import type { StatusExecucaoParada } from '../schemas/rota-execucao.schema.js'

type RotaParadaRef = { entregaId: string | null }
type RotaExecucaoRef = { status: StatusExecucaoParada | string }

export function isRouteActiveFromExecucoes(
  execucoes: RotaExecucaoRef[],
  paradaCount: number,
): boolean {
  if (paradaCount === 0) return false
  if (execucoes.length === 0) return true

  return execucoes.some(
    (execucao) =>
      execucao.status === 'PENDENTE' || execucao.status === 'EM_ROTA',
  )
}

export function routeHasExecutionProgress(execucoes: RotaExecucaoRef[]): boolean {
  return execucoes.some((execucao) => execucao.status !== 'PENDENTE')
}

export function routeBelongsToMotoboy(
  rota: { motoboyId: string | null; paradas: RotaParadaRef[] },
  motoboyId: string,
  entregaMotoboyById: Map<string, string | null>,
): boolean {
  if (rota.motoboyId === motoboyId) {
    return true
  }

  return rota.paradas.some((parada) => {
    if (!parada.entregaId) return false
    return entregaMotoboyById.get(parada.entregaId) === motoboyId
  })
}

export function isRouteExecucaoConcluida(
  execucoes: RotaExecucaoRef[],
  paradaCount: number,
): boolean {
  if (paradaCount === 0 || execucoes.length === 0) {
    return false
  }

  return execucoes.every((execucao) => execucao.status === 'ENTREGUE')
}

export function resolveMotoboyIdFromRota(
  rota: { motoboyId: string | null; paradas: RotaParadaRef[] },
  entregaMotoboyById: Map<string, string | null>,
): string | null {
  if (rota.motoboyId) {
    return rota.motoboyId
  }

  const motoboyIds = new Set<string>()

  for (const parada of rota.paradas) {
    if (!parada.entregaId) continue
    const motoboyId = entregaMotoboyById.get(parada.entregaId)
    if (motoboyId) {
      motoboyIds.add(motoboyId)
    }
  }

  if (motoboyIds.size === 1) {
    return [...motoboyIds][0]!
  }

  return null
}
