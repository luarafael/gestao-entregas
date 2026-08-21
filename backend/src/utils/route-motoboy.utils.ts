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

type RotaParadaOrdemRef = { id: string; ordem: number }
type RotaExecucaoParadaRef = {
  paradaId: string | null
  status: StatusExecucaoParada | string
}

export function findNextParadaIdForEmRota(
  paradas: RotaParadaOrdemRef[],
  execucoes: RotaExecucaoParadaRef[],
): string | null {
  const statusByParadaId = new Map<string, string>()

  for (const execucao of execucoes) {
    if (execucao.paradaId) {
      statusByParadaId.set(execucao.paradaId, execucao.status)
    }
  }

  const ordered = [...paradas].sort((a, b) => a.ordem - b.ordem)

  if (ordered.some((parada) => statusByParadaId.get(parada.id) === 'EM_ROTA')) {
    return null
  }

  const nextPending = ordered.find(
    (parada) => (statusByParadaId.get(parada.id) ?? 'PENDENTE') === 'PENDENTE',
  )

  return nextPending?.id ?? null
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

export function areAllParadasDelivered(
  paradas: Array<{ id: string }>,
  execucoes: Array<{ paradaId: string | null; status: string }>,
): boolean {
  if (paradas.length === 0) {
    return false
  }

  const statusByParadaId = new Map<string, string>()
  for (const execucao of execucoes) {
    if (execucao.paradaId) {
      statusByParadaId.set(execucao.paradaId, execucao.status)
    }
  }

  return paradas.every(
    (parada) => statusByParadaId.get(parada.id) === 'ENTREGUE',
  )
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

export type PreviousExecucaoMatch = {
  entregaId?: string | null
  status: string
  observacao?: string | null
  dataHoraStatus?: Date | null
  parada?: { endereco?: string | null; cliente?: string | null } | null
}

export function findMatchingPreviousExecucaoIndex(
  parada: {
    entregaId?: string | null
    endereco: string
    cliente?: string | null
  },
  previous: PreviousExecucaoMatch[],
  used: Set<number>,
) {
  const byEntrega = previous.findIndex(
    (execucao, index) =>
      !used.has(index) &&
      Boolean(parada.entregaId) &&
      execucao.entregaId === parada.entregaId,
  )
  if (byEntrega >= 0) {
    return byEntrega
  }

  return previous.findIndex((execucao, index) => {
    if (used.has(index)) return false
    return (
      (execucao.parada?.endereco ?? '') === parada.endereco &&
      (execucao.parada?.cliente ?? '') === (parada.cliente ?? '')
    )
  })
}
