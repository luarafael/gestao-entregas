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
