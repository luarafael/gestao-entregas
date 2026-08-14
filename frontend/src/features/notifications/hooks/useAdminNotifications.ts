import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { aprovacoesService } from '@/features/aprovacoes/services/aprovacoes.service'
import { monitoramentoService } from '@/features/monitoramento/services/monitoramento.service'
import { pendingService } from '@/features/pending/services/pending.service'
import { routingService } from '@/features/routing/services/routing.service'
import { useNotificationStore } from '@/shared/stores/notification.store'
import { formatPrestacaoMotoboyDate } from '@/features/motoboy/schemas/prestacaoMotoboy.schema'
import { formatTimeBR } from '@/shared/utils/format'
import { notifyUser } from '../utils/notifyUser'

const POLL_INTERVAL = 10_000

export function useAdminNotifications(enabled: boolean) {
  const addNotification = useNotificationStore((state) => state.addNotification)
  const location = useLocation()
  const pendingReadyRef = useRef(false)
  const deliveryReadyRef = useRef(false)
  const pendenciaReadyRef = useRef(false)
  const routeCompletedReadyRef = useRef(false)
  const knownPendingIdsRef = useRef<Set<string>>(new Set())
  const knownDeliveryIdsRef = useRef<Set<string>>(new Set())
  const knownPendenciaIdsRef = useRef<Set<string>>(new Set())
  const knownRouteCompletedIdsRef = useRef<Set<string>>(new Set())
  const sinceRef = useRef(new Date().toISOString())
  const pendenciaSinceRef = useRef(new Date().toISOString())
  const routeCompletedSinceRef = useRef(new Date().toISOString())

  const pendingQuery = useQuery({
    queryKey: ['admin-notifications', 'pending'],
    queryFn: () => aprovacoesService.listPending(),
    enabled,
    refetchInterval: POLL_INTERVAL,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  })

  const eventosQuery = useQuery({
    queryKey: ['admin-notifications', 'eventos'],
    queryFn: () => monitoramentoService.getEventos(sinceRef.current),
    enabled,
    refetchInterval: POLL_INTERVAL,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  })

  const pendenciaEventosQuery = useQuery({
    queryKey: ['admin-notifications', 'pendencias'],
    queryFn: () => pendingService.getEventos(pendenciaSinceRef.current),
    enabled,
    refetchInterval: POLL_INTERVAL,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  })

  const rotaConcluidaQuery = useQuery({
    queryKey: ['admin-notifications', 'rotas-concluidas'],
    queryFn: () => routingService.getEventosConclusao(routeCompletedSinceRef.current),
    enabled,
    refetchInterval: POLL_INTERVAL,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  })

  useEffect(() => {
    if (!enabled || !pendingQuery.data) {
      return
    }

    if (!pendingReadyRef.current) {
      knownPendingIdsRef.current = new Set(
        pendingQuery.data.data.map((item) => item.id),
      )
      pendingReadyRef.current = true
      return
    }

    const currentPendingIds = new Set(
      pendingQuery.data.data.map((item) => item.id),
    )

    for (const item of pendingQuery.data.data) {
      if (knownPendingIdsRef.current.has(item.id)) continue

      const message = `${item.motoboy?.nome ?? 'Motoboy'} enviou prestação de ${formatPrestacaoMotoboyDate(item.data)}`
      notifyUser(addNotification, {
        type: 'approval',
        title: 'Nova solicitação de aprovação',
        message,
        href: '/aprovacoes',
        tag: `approval-${item.id}`,
        showToast: true,
        toastVariant: 'info',
      })
    }

    knownPendingIdsRef.current = currentPendingIds
  }, [addNotification, enabled, pendingQuery.data])

  useEffect(() => {
    if (!enabled || !eventosQuery.data) {
      return
    }

    if (!deliveryReadyRef.current) {
      for (const evento of eventosQuery.data.eventos) {
        knownDeliveryIdsRef.current.add(evento.id)
      }
      deliveryReadyRef.current = true
      return
    }

    for (const evento of eventosQuery.data.eventos) {
      if (knownDeliveryIdsRef.current.has(evento.id)) continue

      knownDeliveryIdsRef.current.add(evento.id)
      if (evento.dataHoraStatus > sinceRef.current) {
        sinceRef.current = evento.dataHoraStatus
      }

      const cliente = evento.cliente?.trim() || 'Cliente'
      const message = `${evento.motoboyNome} concluiu entrega: ${cliente} · ${formatTimeBR(evento.dataHoraStatus)}`
      notifyUser(addNotification, {
        type: 'delivery',
        title: 'Entrega concluída',
        message,
        href: '/monitoramento',
        tag: `delivery-${evento.id}`,
        showToast: location.pathname !== '/monitoramento',
        toastVariant: 'success',
      })
    }
  }, [addNotification, enabled, eventosQuery.data, location.pathname])

  useEffect(() => {
    if (!enabled || !pendenciaEventosQuery.data) {
      return
    }

    if (!pendenciaReadyRef.current) {
      for (const evento of pendenciaEventosQuery.data.eventos) {
        knownPendenciaIdsRef.current.add(evento.id)
      }
      pendenciaReadyRef.current = true
      return
    }

    for (const evento of pendenciaEventosQuery.data.eventos) {
      if (knownPendenciaIdsRef.current.has(evento.id)) continue

      knownPendenciaIdsRef.current.add(evento.id)
      if (evento.criadoEm > pendenciaSinceRef.current) {
        pendenciaSinceRef.current = evento.criadoEm
      }

      const message = `${evento.motoboyNome} registrou pendência: ${evento.descricao} · ${formatTimeBR(evento.criadoEm)}`
      notifyUser(addNotification, {
        type: 'pendencia',
        title: 'Nova pendência do motoboy',
        message,
        href: '/pendencias',
        tag: `pendencia-${evento.id}`,
        showToast: location.pathname !== '/pendencias',
        toastVariant: 'info',
      })
    }
  }, [addNotification, enabled, location.pathname, pendenciaEventosQuery.data])

  useEffect(() => {
    if (!enabled || !rotaConcluidaQuery.data) {
      return
    }

    if (!routeCompletedReadyRef.current) {
      for (const evento of rotaConcluidaQuery.data.eventos) {
        knownRouteCompletedIdsRef.current.add(evento.id)
      }
      routeCompletedReadyRef.current = true
      return
    }

    for (const evento of rotaConcluidaQuery.data.eventos) {
      if (knownRouteCompletedIdsRef.current.has(evento.id)) continue

      knownRouteCompletedIdsRef.current.add(evento.id)
      if (evento.concluidaEm > routeCompletedSinceRef.current) {
        routeCompletedSinceRef.current = evento.concluidaEm
      }

      const message = `${evento.motoboyNome} concluiu a rota: ${evento.totalParadas} entrega(s) · ${formatTimeBR(evento.concluidaEm)}`
      notifyUser(addNotification, {
        type: 'route_completed',
        title: 'Rota concluída',
        message,
        href: '/monitoramento',
        tag: `route-completed-${evento.id}`,
        showToast: location.pathname !== '/monitoramento',
        toastVariant: 'success',
      })
    }
  }, [
    addNotification,
    enabled,
    location.pathname,
    rotaConcluidaQuery.data,
  ])
}
