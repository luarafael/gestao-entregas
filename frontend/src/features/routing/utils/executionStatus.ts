import type { PlannerStop } from '../schemas/routing.schema'

export type StatusExecucao =
  | 'PENDENTE'
  | 'EM_ROTA'
  | 'ENTREGUE'
  | 'CLIENTE_AUSENTE'
  | 'NAO_LOCALIZADO'
  | 'CANCELADA'
  | 'FALHA_ENTREGA'

export const STATUS_EXECUCAO_OPTIONS: Array<{
  value: StatusExecucao
  label: string
}> = [
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'EM_ROTA', label: 'Em rota' },
  { value: 'ENTREGUE', label: 'Entregue' },
  { value: 'CLIENTE_AUSENTE', label: 'Cliente ausente' },
  { value: 'NAO_LOCALIZADO', label: 'Não localizado' },
  { value: 'CANCELADA', label: 'Cancelada' },
  { value: 'FALHA_ENTREGA', label: 'Falha na entrega' },
]

export const STATUS_LABELS: Record<StatusExecucao, string> = {
  PENDENTE: 'Pendente',
  EM_ROTA: 'Em rota',
  ENTREGUE: 'Entregue',
  CLIENTE_AUSENTE: 'Cliente ausente',
  NAO_LOCALIZADO: 'Não localizado',
  CANCELADA: 'Cancelada',
  FALHA_ENTREGA: 'Falha na entrega',
}

export const STATUS_COLORS: Record<
  StatusExecucao,
  { badge: string; marker: string; row: string }
> = {
  PENDENTE: {
    badge: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    marker: '#64748b',
    row: 'border-slate-500/30',
  },
  EM_ROTA: {
    badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    marker: '#3b82f6',
    row: 'border-blue-500/50 ring-1 ring-blue-500/30',
  },
  ENTREGUE: {
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    marker: '#16a34a',
    row: 'border-emerald-500/30 opacity-80',
  },
  CLIENTE_AUSENTE: {
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    marker: '#ef4444',
    row: 'border-red-500/40',
  },
  NAO_LOCALIZADO: {
    badge: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    marker: '#ef4444',
    row: 'border-red-500/40',
  },
  CANCELADA: {
    badge: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
    marker: '#52525b',
    row: 'border-zinc-500/40 opacity-70',
  },
  FALHA_ENTREGA: {
    badge: 'bg-red-500/15 text-red-300 border-red-500/30',
    marker: '#ef4444',
    row: 'border-red-500/40',
  },
}

export interface ExecucaoHistoricoItem {
  id: string
  tempId: string
  cliente?: string | null
  endereco: string
  bairro?: string | null
  status: StatusExecucao
  observacao?: string | null
  dataHora: string
}

export function defaultStatus(): StatusExecucao {
  return 'PENDENTE'
}

export function withDefaultStatus(stop: PlannerStop): PlannerStop {
  return {
    ...stop,
    statusExecucao: stop.statusExecucao ?? defaultStatus(),
  }
}

export function isProblemStatus(status: StatusExecucao): boolean {
  return (
    status === 'CLIENTE_AUSENTE' ||
    status === 'NAO_LOCALIZADO' ||
    status === 'FALHA_ENTREGA'
  )
}

export function isDeliveredStatus(status: StatusExecucao): boolean {
  return status === 'ENTREGUE'
}

export function isActiveRouteStop(status: StatusExecucao): boolean {
  return status !== 'ENTREGUE'
}

export function getStopStatus(stop: PlannerStop): StatusExecucao {
  return stop.statusExecucao ?? 'PENDENTE'
}

export function computeExecutionStats(stops: PlannerStop[]) {
  const total = stops.length
  let pendentes = 0
  let emRota = 0
  let entregues = 0
  let problemas = 0

  for (const stop of stops) {
    const status = getStopStatus(stop)
    if (status === 'PENDENTE') pendentes += 1
    if (status === 'EM_ROTA') emRota += 1
    if (status === 'ENTREGUE') entregues += 1
    if (isProblemStatus(status) || status === 'CANCELADA') problemas += 1
  }

  const percentual = total > 0 ? Math.round((entregues / total) * 100) : 0

  return { total, pendentes, emRota, entregues, problemas, percentual }
}

export function getNextStop(stops: PlannerStop[]): PlannerStop | null {
  const ordered = [...stops].sort(
    (a, b) => (a.ordem ?? 0) - (b.ordem ?? 0),
  )

  const emRota = ordered.find((stop) => getStopStatus(stop) === 'EM_ROTA')
  if (emRota) return emRota

  return (
    ordered.find((stop) => getStopStatus(stop) === 'PENDENTE') ?? null
  )
}

export function mergeStopsWithStatus(
  base: PlannerStop[],
  updated: PlannerStop[],
): PlannerStop[] {
  const statusByTempId = new Map(
    base.map((stop) => [stop.tempId, stop]),
  )

  return updated.map((stop) => {
    const previous = statusByTempId.get(stop.tempId)
    if (!previous) return withDefaultStatus(stop)
    return {
      ...stop,
      statusExecucao: previous.statusExecucao ?? 'PENDENTE',
      statusObservacao: previous.statusObservacao ?? null,
      statusAtualizadoEm: previous.statusAtualizadoEm ?? null,
      telefone: stop.telefone ?? previous.telefone ?? null,
      paradaId: stop.paradaId ?? previous.paradaId ?? null,
    }
  })
}

export function applyStatusUpdate(
  stop: PlannerStop,
  status: StatusExecucao,
  observacao?: string | null,
): PlannerStop {
  return {
    ...stop,
    statusExecucao: status,
    statusObservacao: observacao ?? stop.statusObservacao ?? null,
    statusAtualizadoEm: new Date().toISOString(),
  }
}

export function getActiveStopsForRoute(stops: PlannerStop[]): PlannerStop[] {
  return stops.filter((stop) => isActiveRouteStop(getStopStatus(stop)))
}

export function buildHistoricoEntry(stop: PlannerStop): ExecucaoHistoricoItem {
  return {
    id: `${stop.tempId}-${stop.statusAtualizadoEm ?? Date.now()}`,
    tempId: stop.tempId,
    cliente: stop.cliente,
    endereco: stop.endereco,
    bairro: stop.bairro,
    status: getStopStatus(stop),
    observacao: stop.statusObservacao ?? stop.observacao,
    dataHora: stop.statusAtualizadoEm ?? new Date().toISOString(),
  }
}

export function getMarkerStyle(
  stop: PlannerStop,
  nextStopTempId?: string | null,
): { color: string; symbol: string } {
  const status = getStopStatus(stop)

  if (status === 'ENTREGUE') {
    return { color: '#16a34a', symbol: '✓' }
  }

  if (isProblemStatus(status) || status === 'CANCELADA') {
    return {
      color: status === 'CANCELADA' ? '#52525b' : '#ef4444',
      symbol: '!',
    }
  }

  if (stop.tempId === nextStopTempId || status === 'EM_ROTA') {
    return { color: '#3b82f6', symbol: String(stop.ordem ?? '?') }
  }

  return {
    color: STATUS_COLORS[status].marker,
    symbol: String(stop.ordem ?? '?'),
  }
}
