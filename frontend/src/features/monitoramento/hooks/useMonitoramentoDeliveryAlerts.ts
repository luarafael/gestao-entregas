import { useEffect, useRef } from 'react'
import { toast } from '@/shared/stores/toast.store'
import type { MonitoramentoResponse } from '../types'

export function useMonitoramentoDeliveryAlerts(
  monitoramento: MonitoramentoResponse | undefined,
  motoboyId: string | undefined,
) {
  const readyRef = useRef(false)
  const statusByParadaRef = useRef<Map<string, string>>(new Map())

  useEffect(() => {
    if (!monitoramento || !motoboyId) {
      readyRef.current = false
      statusByParadaRef.current = new Map()
      return
    }

    const paradas = [
      ...monitoramento.rotas.flatMap((rota) => rota.paradas),
      ...monitoramento.historico.flatMap((rota) => rota.paradas),
    ]

    if (!readyRef.current) {
      statusByParadaRef.current = new Map(
        paradas.map((parada) => [parada.paradaId, parada.status]),
      )
      readyRef.current = true
      return
    }

    for (const parada of paradas) {
      const previous = statusByParadaRef.current.get(parada.paradaId)
      statusByParadaRef.current.set(parada.paradaId, parada.status)

      if (
        previous &&
        previous !== 'ENTREGUE' &&
        parada.status === 'ENTREGUE'
      ) {
        const cliente = parada.cliente?.trim() || 'Cliente'
        toast(`${cliente} marcada como entregue`, 'success')
      }
    }
  }, [monitoramento, motoboyId])
}
