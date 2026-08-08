import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { prestacaoMotoboyService } from '@/features/motoboy/services/prestacaoMotoboy.service'
import { routingService } from '@/features/routing/services/routing.service'
import { useNotificationStore } from '@/shared/stores/notification.store'
import { notifyUser } from '../utils/notifyUser'
import { formatPrestacaoMotoboyDate } from '@/features/motoboy/schemas/prestacaoMotoboy.schema'

const POLL_INTERVAL = 10_000

export function useMotoboyNotifications(enabled: boolean) {
  const addNotification = useNotificationStore((state) => state.addNotification)
  const location = useLocation()
  const readyRef = useRef(false)
  const knownRouteIdsRef = useRef<Set<string>>(new Set())
  const knownPrestacaoEventIdsRef = useRef<Set<string>>(new Set())
  const sinceRef = useRef(new Date().toISOString())

  const routeEventosQuery = useQuery({
    queryKey: ['motoboy-notifications', 'rotas'],
    queryFn: () => routingService.getEventos(sinceRef.current),
    enabled,
    refetchInterval: POLL_INTERVAL,
  })

  const prestacaoEventosQuery = useQuery({
    queryKey: ['motoboy-notifications', 'prestacao'],
    queryFn: () => prestacaoMotoboyService.getEventos(sinceRef.current),
    enabled,
    refetchInterval: POLL_INTERVAL,
  })

  useEffect(() => {
    if (!enabled || !routeEventosQuery.data || !prestacaoEventosQuery.data) {
      return
    }

    if (!readyRef.current) {
      for (const evento of routeEventosQuery.data.eventos) {
        knownRouteIdsRef.current.add(evento.id)
      }
      for (const evento of prestacaoEventosQuery.data.eventos) {
        knownPrestacaoEventIdsRef.current.add(evento.id)
      }
      readyRef.current = true
      return
    }

    for (const evento of routeEventosQuery.data.eventos) {
      if (knownRouteIdsRef.current.has(evento.id)) continue

      knownRouteIdsRef.current.add(evento.id)
      if (evento.criadoEm > sinceRef.current) {
        sinceRef.current = evento.criadoEm
      }

      const message = `${evento.totalParadas} entrega(s) · Partida: ${evento.enderecoInicial}`
      notifyUser(addNotification, {
        type: 'route',
        title: 'Nova rota planejada',
        message,
        href: '/planejador',
        tag: `route-${evento.id}`,
        showToast: location.pathname !== '/planejador',
        toastVariant: 'info',
      })
    }

    for (const evento of prestacaoEventosQuery.data.eventos) {
      if (knownPrestacaoEventIdsRef.current.has(evento.id)) continue

      knownPrestacaoEventIdsRef.current.add(evento.id)
      if (evento.dataHora > sinceRef.current) {
        sinceRef.current = evento.dataHora
      }

      const dataLabel = formatPrestacaoMotoboyDate(evento.data)
      if (evento.status === 'APROVADA') {
        notifyUser(addNotification, {
          type: 'prestacao',
          title: 'Prestação aprovada',
          message: `Sua prestação de ${dataLabel} foi aprovada.`,
          href: '/minha-prestacao',
          tag: evento.id,
          showToast: location.pathname !== '/minha-prestacao',
          toastVariant: 'success',
        })
        continue
      }

      const motivo = evento.motivoRejeicao?.trim()
      notifyUser(addNotification, {
        type: 'prestacao',
        title: 'Prestação rejeitada',
        message: motivo
          ? `Prestação de ${dataLabel} rejeitada: ${motivo}`
          : `Sua prestação de ${dataLabel} foi rejeitada.`,
        href: '/minha-prestacao',
        tag: evento.id,
        showToast: location.pathname !== '/minha-prestacao',
        toastVariant: 'error',
      })
    }
  }, [
    addNotification,
    enabled,
    location.pathname,
    prestacaoEventosQuery.data,
    routeEventosQuery.data,
  ])
}
