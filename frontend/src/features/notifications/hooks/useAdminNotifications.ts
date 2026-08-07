import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { aprovacoesService } from '@/features/aprovacoes/services/aprovacoes.service'
import { monitoramentoService } from '@/features/monitoramento/services/monitoramento.service'
import { pendingService } from '@/features/pending/services/pending.service'
import { useNotificationStore } from '@/shared/stores/notification.store'
import { toast } from '@/shared/stores/toast.store'
import { formatPrestacaoMotoboyDate } from '@/features/motoboy/schemas/prestacaoMotoboy.schema'
import { formatCurrency } from '@/shared/utils/cn'
import { formatTimeBR } from '@/shared/utils/format'

const POLL_INTERVAL = 10_000

export function useAdminNotifications(enabled: boolean) {
  const addNotification = useNotificationStore((state) => state.addNotification)
  const location = useLocation()
  const readyRef = useRef(false)
  const knownPendingIdsRef = useRef<Set<string>>(new Set())
  const knownDeliveryIdsRef = useRef<Set<string>>(new Set())
  const knownPendenciaIdsRef = useRef<Set<string>>(new Set())
  const sinceRef = useRef(new Date().toISOString())
  const pendenciaSinceRef = useRef(new Date().toISOString())

  const pendingQuery = useQuery({
    queryKey: ['admin-notifications', 'pending'],
    queryFn: () => aprovacoesService.listPending(),
    enabled,
    refetchInterval: POLL_INTERVAL,
  })

  const eventosQuery = useQuery({
    queryKey: ['admin-notifications', 'eventos'],
    queryFn: () => monitoramentoService.getEventos(sinceRef.current),
    enabled,
    refetchInterval: POLL_INTERVAL,
  })

  const pendenciaEventosQuery = useQuery({
    queryKey: ['admin-notifications', 'pendencias'],
    queryFn: () => pendingService.getEventos(pendenciaSinceRef.current),
    enabled,
    refetchInterval: POLL_INTERVAL,
  })

  useEffect(() => {
    if (
      !enabled ||
      !pendingQuery.data ||
      !eventosQuery.data ||
      !pendenciaEventosQuery.data
    ) {
      return
    }

    if (!readyRef.current) {
      knownPendingIdsRef.current = new Set(
        pendingQuery.data.data.map((item) => item.id),
      )
      for (const evento of eventosQuery.data.eventos) {
        knownDeliveryIdsRef.current.add(evento.id)
      }
      for (const evento of pendenciaEventosQuery.data.eventos) {
        knownPendenciaIdsRef.current.add(evento.id)
      }
      readyRef.current = true
      return
    }

    const currentPendingIds = new Set(
      pendingQuery.data.data.map((item) => item.id),
    )

    for (const item of pendingQuery.data.data) {
      if (knownPendingIdsRef.current.has(item.id)) continue

      const message = `${item.motoboy?.nome ?? 'Motoboy'} enviou prestação de ${formatPrestacaoMotoboyDate(item.data)}`
      addNotification({
        type: 'approval',
        title: 'Nova solicitação de aprovação',
        message,
        href: '/aprovacoes',
      })
      toast(message, 'info')
    }

    knownPendingIdsRef.current = currentPendingIds

    for (const evento of eventosQuery.data.eventos) {
      if (knownDeliveryIdsRef.current.has(evento.id)) continue

      knownDeliveryIdsRef.current.add(evento.id)
      if (evento.dataHoraStatus > sinceRef.current) {
        sinceRef.current = evento.dataHoraStatus
      }

      const cliente = evento.cliente?.trim() || 'Cliente'
      const message = `${evento.motoboyNome} concluiu entrega: ${cliente}`
      addNotification({
        type: 'delivery',
        title: 'Entrega concluída',
        message: `${message} · ${formatTimeBR(evento.dataHoraStatus)}`,
        href: '/monitoramento',
      })

      if (location.pathname === '/monitoramento') {
        toast(message, 'success')
      }
    }

    for (const evento of pendenciaEventosQuery.data.eventos) {
      if (knownPendenciaIdsRef.current.has(evento.id)) continue

      knownPendenciaIdsRef.current.add(evento.id)
      if (evento.criadoEm > pendenciaSinceRef.current) {
        pendenciaSinceRef.current = evento.criadoEm
      }

      const message = `${evento.motoboyNome} registrou pendência: ${evento.descricao} · ${formatCurrency(evento.valor)}`
      addNotification({
        type: 'pendencia',
        title: 'Nova pendência do motoboy',
        message: `${message} · ${formatTimeBR(evento.criadoEm)}`,
        href: '/pendencias',
      })

      if (location.pathname !== '/pendencias') {
        toast(message, 'info')
      }
    }
  }, [
    addNotification,
    enabled,
    eventosQuery.data,
    location.pathname,
    pendenciaEventosQuery.data,
    pendingQuery.data,
  ])
}
