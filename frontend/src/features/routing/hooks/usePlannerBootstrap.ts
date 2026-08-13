import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { invalidateDeliveryRelated } from '@/shared/lib/invalidate-related'
import { useNotifyUser } from '@/features/notifications/utils/notifyUser'
import { ROTAS_QUERY_KEY } from './useRouting'
import { usePlannerStore } from '../stores/planner.store'
import { syncPlannerFromServer } from '../utils/plannerSync'

const PLANNER_SYNC_INTERVAL_MS = 30_000

function hasPlannerStateToSync() {
  const { savedRotaId, stops, result } = usePlannerStore.getState()
  return Boolean(savedRotaId || stops.length > 0 || result)
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
      try {
        await syncPlannerFromServer()
      } catch {
        const { savedRotaId, stops, clearActiveRoute } =
          usePlannerStore.getState()

        if (savedRotaId || stops.length > 0) {
          clearActiveRoute()
        }
      }
    })()
  }, [hydrated])
}

export function usePlannerSync(
  enabled = true,
  options?: { notifyOnClear?: boolean },
) {
  const queryClient = useQueryClient()
  const notify = useNotifyUser()
  const notifyRef = useRef(notify)
  const syncingRef = useRef(false)
  const notifyOnClear = options?.notifyOnClear ?? false

  useEffect(() => {
    notifyRef.current = notify
  }, [notify])

  useEffect(() => {
    if (!enabled) return

    const runSync = () => {
      if (document.visibilityState !== 'visible' || syncingRef.current) return
      if (!hasPlannerStateToSync()) return

      syncingRef.current = true
      void syncPlannerFromServer()
        .then((result) => {
          if (result !== 'cleared' || !notifyOnClear) return

          invalidateDeliveryRelated(queryClient)
          queryClient.invalidateQueries({ queryKey: [ROTAS_QUERY_KEY] })
          notifyRef.current({
            type: 'route',
            title: 'Rota concluída',
            message:
              'Rota concluída em outro dispositivo — removida do planejador.',
            href: '/planejador',
            tag: 'planner-sync-cleared',
            showToast: true,
            toastVariant: 'info',
          })
        })
        .catch(() => undefined)
        .finally(() => {
          syncingRef.current = false
        })
    }

    runSync()

    document.addEventListener('visibilitychange', runSync)
    window.addEventListener('focus', runSync)
    const intervalId = window.setInterval(runSync, PLANNER_SYNC_INTERVAL_MS)

    return () => {
      document.removeEventListener('visibilitychange', runSync)
      window.removeEventListener('focus', runSync)
      window.clearInterval(intervalId)
    }
  }, [enabled, notifyOnClear, queryClient])
}
