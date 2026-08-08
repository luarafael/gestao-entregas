import { useEffect, useRef, useState } from 'react'
import { ApiError } from '@/shared/services/api'
import { routingService } from '../services/routing.service'
import { usePlannerStore } from '../stores/planner.store'
import { shouldClearPlannerRoute } from '../utils/executionStatus'

async function finalizeStaleRoute(rotaId: string, concluidaEm?: string | null) {
  if (!concluidaEm) {
    try {
      await routingService.reconcileRouteConclusion(rotaId)
    } catch {
      // Melhor esforço — o planejador será limpo mesmo assim.
    }
  }
}

export function usePlannerBootstrap() {
  const [hydrated, setHydrated] = useState(() =>
    usePlannerStore.persist.hasHydrated(),
  )
  const bootstrapStarted = useRef(false)

  useEffect(() => {
    const unsub = usePlannerStore.persist.onFinishHydration(() => {
      setHydrated(true)
    })
    return unsub
  }, [])

  useEffect(() => {
    if (!hydrated || bootstrapStarted.current) return

    bootstrapStarted.current = true

    void (async () => {
      const {
        stops,
        savedRotaId,
        hydrateFromRota,
        clearActiveRoute,
      } = usePlannerStore.getState()

      try {
        if (savedRotaId) {
          const [rota, execucoes] = await Promise.all([
            routingService.getById(savedRotaId),
            routingService.getExecucao(savedRotaId),
          ])

          if (
            shouldClearPlannerRoute({
              concluidaEm: rota.concluidaEm,
              paradaCount: rota.paradas.length,
              execucoes,
              stops,
            })
          ) {
            await finalizeStaleRoute(savedRotaId, rota.concluidaEm)
            clearActiveRoute()
            return
          }

          hydrateFromRota(rota, execucoes)
          return
        }

        if (stops.length > 0) {
          if (shouldClearPlannerRoute({ paradaCount: stops.length, execucoes: [], stops })) {
            clearActiveRoute()
          }
          return
        }

        const active = await routingService.getActiveToday()
        if (!active.rota) return

        const execucoes = await routingService.getExecucao(active.rota.id)
        hydrateFromRota(active.rota, execucoes)
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          clearActiveRoute()
          return
        }

        if (savedRotaId || stops.length > 0) {
          clearActiveRoute()
        }
      }
    })()
  }, [hydrated])
}
