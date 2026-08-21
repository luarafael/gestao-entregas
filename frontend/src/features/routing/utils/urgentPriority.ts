import type { PlannerStop, PlannerStopFormData } from '../schemas/routing.schema'

export function resolveNextOrdemUrgencia(
  stops: PlannerStop[],
  excludeTempId?: string,
): number {
  const used = stops
    .filter(
      (stop) =>
        stop.prioridade === 'URGENTE' && stop.tempId !== excludeTempId,
    )
    .map((stop) => stop.ordemUrgencia)
    .filter((value): value is number => value != null)

  let next = 1
  while (used.includes(next)) next += 1
  return next
}

export function normalizePlannerStopForm(
  data: PlannerStopFormData,
  stops: PlannerStop[],
  editingTempId?: string,
): PlannerStopFormData {
  if (data.prioridade !== 'URGENTE') {
    return { ...data, ordemUrgencia: undefined }
  }

  return {
    ...data,
    ordemUrgencia:
      data.ordemUrgencia ??
      resolveNextOrdemUrgencia(stops, editingTempId),
  }
}

export function formatUrgentLabel(ordemUrgencia?: number | null): string {
  if (!ordemUrgencia) return 'Urgente'
  return `Urgente ${ordemUrgencia}ª`
}

export function sortStopsByUrgentPriority<
  T extends { prioridade?: string; ordemUrgencia?: number | null },
>(stops: T[]): Array<T & { ordem: number }> {
  const position = new Map(stops.map((_, index) => [index, index]))
  const indices = stops.map((_, index) => index)

  const urgent = indices
    .filter((index) => stops[index]?.prioridade === 'URGENTE')
    .sort((a, b) => {
      const ordemA = stops[a]?.ordemUrgencia ?? Number.POSITIVE_INFINITY
      const ordemB = stops[b]?.ordemUrgencia ?? Number.POSITIVE_INFINITY
      if (ordemA !== ordemB) return ordemA - ordemB
      return (position.get(a) ?? 0) - (position.get(b) ?? 0)
    })

  const normal = indices.filter(
    (index) => stops[index]?.prioridade !== 'URGENTE',
  )

  return [...urgent, ...normal].map((index, ordem) => ({
    ...stops[index]!,
    ordem: ordem + 1,
  }))
}
