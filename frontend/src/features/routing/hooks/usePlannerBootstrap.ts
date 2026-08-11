import { useEffect, useRef, useState } from 'react'
import { usePlannerStore } from '../stores/planner.store'
import { syncPlannerFromServer } from '../utils/plannerSync'

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

export function usePlannerSync(enabled = true) {
  const syncingRef = useRef(false)

  useEffect(() => {
    if (!enabled) return

    const syncIfVisible = () => {
      if (document.visibilityState !== 'visible' || syncingRef.current) return

      syncingRef.current = true
      void syncPlannerFromServer()
        .catch(() => undefined)
        .finally(() => {
          syncingRef.current = false
        })
    }

    document.addEventListener('visibilitychange', syncIfVisible)
    window.addEventListener('focus', syncIfVisible)

    return () => {
      document.removeEventListener('visibilitychange', syncIfVisible)
      window.removeEventListener('focus', syncIfVisible)
    }
  }, [enabled])
}
