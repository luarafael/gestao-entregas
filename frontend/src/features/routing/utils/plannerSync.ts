import { ApiError } from '@/shared/services/api'
import { routingService } from '../services/routing.service'
import type { RotaPlanejada } from '../schemas/routing.schema'
import { usePlannerStore } from '../stores/planner.store'
import { shouldClearPlannerRoute } from '../utils/executionStatus'

export type PlannerSyncResult =
  | 'hydrated-active'
  | 'hydrated-saved'
  | 'draft-kept'
  | 'cleared'
  | 'empty'

async function finalizeStaleRoute(rotaId: string, concluidaEm?: string | null) {
  if (!concluidaEm) {
    try {
      await routingService.reconcileRouteConclusion(rotaId)
    } catch {
      // Melhor esforço — o planejador será limpo mesmo assim.
    }
  }
}

async function hydrateRouteFromServer(
  rotaOrId: string | RotaPlanejada,
  stops: ReturnType<typeof usePlannerStore.getState>['stops'],
) {
  const { hydrateFromRota, clearActiveRoute } = usePlannerStore.getState()
  const rota =
    typeof rotaOrId === 'string'
      ? await routingService.getById(rotaOrId)
      : rotaOrId
  const execucoes = await routingService.getExecucao(rota.id)

  if (
    shouldClearPlannerRoute({
      concluidaEm: rota.concluidaEm,
      paradaCount: rota.paradas.length,
      execucoes,
      stops,
    })
  ) {
    await finalizeStaleRoute(rota.id, rota.concluidaEm)
    clearActiveRoute()
    return 'cleared' as const
  }

  hydrateFromRota(rota, execucoes)
  return 'hydrated-saved' as const
}

export async function syncPlannerFromServer(): Promise<PlannerSyncResult> {
  const { stops, savedRotaId } = usePlannerStore.getState()
  const hasLocalDraft = stops.length > 0 && !savedRotaId

  if (hasLocalDraft) {
    if (
      shouldClearPlannerRoute({
        paradaCount: stops.length,
        execucoes: [],
        stops,
      })
    ) {
      usePlannerStore.getState().clearActiveRoute()
      return 'cleared'
    }

    return 'draft-kept'
  }

  try {
    const active = await routingService.getActiveToday()
    if (active.rota) {
      const result = await hydrateRouteFromServer(active.rota, stops)
      return result === 'cleared' ? 'cleared' : 'hydrated-active'
    }

    if (savedRotaId) {
      const result = await hydrateRouteFromServer(savedRotaId, stops)
      return result === 'cleared' ? 'cleared' : 'hydrated-saved'
    }

    return 'empty'
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      usePlannerStore.getState().clearActiveRoute()
      return 'cleared'
    }

    throw error
  }
}
