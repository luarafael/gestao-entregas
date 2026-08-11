import { useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  MetaChip,
  PageHeader,
  PageHeaderActions,
  PageShell,
} from '@/shared/components/ui'
import { IconRoute } from '@/shared/components/icons'
import { formatCurrency } from '@/shared/utils/cn'
import { toast } from '@/shared/stores/toast.store'
import { WhatsAppPreview } from '@/features/accounting/components/WhatsAppPreview'
import {
  WhatsAppSendModal,
  type WhatsAppSendPayload,
} from '@/features/accounting/components/WhatsAppSendModal'
import { useCopyWhatsAppText } from '@/features/accounting/hooks/usePrestacao'
import { useIsAdmin } from '@/features/auth/hooks/useIsAdmin'
import {
  MotoboySelect,
  motoboySelectToolbarProps,
  type MotoboySelectValue,
} from '@/shared/components/MotoboySelect'
import { EnderecoInicial } from '../components/EnderecoInicial'
import { FormularioEntrega } from '../components/FormularioEntrega'
import { ListaEntregas } from '../components/ListaEntregas'
import { ImportadorEnderecos } from '../components/ImportadorEnderecos'
import { ImportarEntregasModal } from '../components/ImportarEntregasModal'
import { ResumoRota } from '../components/ResumoRota'
import { BarraProgressoExecucao } from '../components/BarraProgressoExecucao'
import { ProximaParadaCard } from '../components/ProximaParadaCard'
import { HistoricoExecucao } from '../components/HistoricoExecucao'
import { MapaRota } from '../components/MapaRota'
import { HistoricoRotas } from '../components/HistoricoRotas'
import {
  useEnderecoPartida,
  useOptimizeRoute,
  usePlanRoute,
  useSaveRoute,
  ROTAS_QUERY_KEY,
} from '../hooks/useRouting'
import { usePlannerBootstrap, usePlannerSync } from '../hooks/usePlannerBootstrap'
import { usePlannerStore } from '../stores/planner.store'
import { usePlannerEntregas, useUpdateEntregaPaymentStatus } from '../hooks/usePlannerEntregas'
import { routingService } from '../services/routing.service'
import { createPlannerStop } from '../utils/parseAddresses'
import { normalizePlannerStopForm } from '../utils/urgentPriority'
import {
  buildGoogleMapsNavigationUrls,
  formatDistance,
  formatDuration,
} from '../utils/googleMapsUrl'
import type {
  OptimizedRouteResult,
  PlannerStop,
  PlannerStopFormData,
  RotaPlanejada,
  StatusExecucao,
} from '../schemas/routing.schema'
import type { StatusPagamentoCliente } from '@/features/deliveries/schemas/delivery.schema'
import {
  buildRouteWhatsAppPayload,
  formatRouteWhatsAppText,
} from '../utils/whatsappRouteMessage'
import { formatRouteProgressWhatsAppText } from '../utils/whatsappRouteProgressMessage'
import {
  mergeStopsWithLiveEntregas,
} from '../utils/routeStopPayment'
import {
  applyDeliveryStatusUpdates,
  mergeExecucoesIntoStops,
  buildHistoricoEntry,
  computeExecutionStats,
  getActiveStopsForRoute,
  getNextStop,
  getStopStatus,
  isActiveRouteStop,
  isAllStopsDelivered,
  mergeStopsWithStatus,
  resolveEmbarqueEndereco,
  restoreStopRouteMetrics,
  snapshotStopRouteMetrics,
  sumStopRouteMetrics,
} from '../utils/executionStatus'
import { invalidateDeliveryRelated } from '@/shared/lib/invalidate-related'
import { DEFAULT_START_ADDRESS } from '../schemas/routing.schema'

export function PlannerPage() {
  usePlannerBootstrap()
  usePlannerSync(true, { notifyOnClear: true })
  const queryClient = useQueryClient()
  const isAdmin = useIsAdmin()
  const [motoboyFilter, setMotoboyFilter] = useState<MotoboySelectValue>('')

  const { data: enderecoPartidaData } = useEnderecoPartida()
  const enderecoPartidaPadrao =
    enderecoPartidaData?.enderecoPartidaPadrao ?? DEFAULT_START_ADDRESS

  const {
    stops,
    setStops,
    result,
    setResult,
    tab,
    setTab,
    selectedTempId,
    setSelectedTempId,
    autoRecalc,
    setAutoRecalc,
    reorderLocked,
    setReorderLocked,
    orderDirty,
    setOrderDirty,
    savedRotaId,
    setSavedRotaId,
    progressUpdatedAt,
    setProgressUpdatedAt,
    historicoExecucao,
    setHistoricoExecucao,
    syncStops,
    resetRoutePlanning,
    clearActiveRoute,
    hydrateFromRota,
  } = usePlannerStore()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<PlannerStop | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [sendPayload, setSendPayload] = useState<WhatsAppSendPayload | null>(null)
  const [progressModalOpen, setProgressModalOpen] = useState(false)
  const [paymentStatusUpdatingId, setPaymentStatusUpdatingId] = useState<
    string | null
  >(null)

  const optimizeMutation = useOptimizeRoute()
  const planMutation = usePlanRoute()
  const saveMutation = useSaveRoute()

  const resolvePlannerMotoboyId = () => {
    if (!isAdmin) return null
    if (!motoboyFilter || motoboyFilter === 'all') return null
    return motoboyFilter
  }
  const copyMutation = useCopyWhatsAppText()
  const updatePaymentMutation = useUpdateEntregaPaymentStatus()

  const displayStops = result?.paradas ?? stops

  const entregaIds = useMemo(
    () =>
      displayStops
        .map((stop) => stop.entregaId)
        .filter((id): id is string => Boolean(id)),
    [displayStops],
  )

  const { data: liveEntregasData } = usePlannerEntregas(
    entregaIds,
    entregaIds.length > 0,
  )

  const enrichedStops = useMemo(
    () => mergeStopsWithLiveEntregas(displayStops, liveEntregasData?.data ?? []),
    [displayStops, liveEntregasData?.data],
  )

  const enderecoPartidaRota = result?.enderecoInicial ?? enderecoPartidaPadrao

  const embarqueEndereco = useMemo(
    () => resolveEmbarqueEndereco(displayStops, enderecoPartidaRota),
    [displayStops, enderecoPartidaRota],
  )

  const embarqueLabel = useMemo(() => {
    const hasDelivered = displayStops.some(
      (stop) => getStopStatus(stop) === 'ENTREGUE',
    )
    return hasDelivered ? 'Embarque atual' : 'Endereço de embarque'
  }, [displayStops])

  const whatsappText = useMemo(() => {
    if (!result) return ''
    return formatRouteWhatsAppText(
      buildRouteWhatsAppPayload({
        ...result,
        enderecoInicial: enderecoPartidaRota,
        paradas: enrichedStops,
      }),
    )
  }, [result, enrichedStops, enderecoPartidaRota])

  const progressWhatsappText = useMemo(() => {
    if (!result) return ''
    const metrics = sumStopRouteMetrics(enrichedStops)
    const activeMetrics = sumStopRouteMetrics(
      getActiveStopsForRoute(enrichedStops),
    )
    const completed = isAllStopsDelivered(enrichedStops)
    return formatRouteProgressWhatsAppText({
      stops: enrichedStops,
      enderecoInicial: completed ? enderecoPartidaRota : embarqueEndereco,
      distanciaTotal: metrics.distancia || result.distanciaTotal,
      tempoTotal: metrics.tempo || result.tempoTotal,
      aproximada: result.aproximada,
      distanciaRestante: activeMetrics.distancia || result.distanciaTotal,
      tempoRestante: activeMetrics.tempo || result.tempoTotal,
      data: new Date().toISOString(),
      atualizadoEm: progressUpdatedAt,
    })
  }, [
    embarqueEndereco,
    enderecoPartidaRota,
    enrichedStops,
    progressUpdatedAt,
    result,
  ])

  const hasExecutionUpdates = useMemo(
    () => displayStops.some((stop) => getStopStatus(stop) !== 'PENDENTE'),
    [displayStops],
  )

  const routeCompleted = useMemo(
    () => isAllStopsDelivered(displayStops),
    [displayStops],
  )

  const staleRouteHandledRef = useRef(false)

  useEffect(() => {
    staleRouteHandledRef.current = false
  }, [savedRotaId])

  useEffect(() => {
    if (!savedRotaId || !routeCompleted || staleRouteHandledRef.current) {
      return
    }

    staleRouteHandledRef.current = true

    void (async () => {
      try {
        await routingService.reconcileRouteConclusion(savedRotaId)
      } catch {
        // Rota legada ou já sincronizada — limpar mesmo assim.
      }

      clearActiveRoute()
      invalidateDeliveryRelated(queryClient)
      queryClient.invalidateQueries({ queryKey: [ROTAS_QUERY_KEY] })
      toast(
        'Rota já estava concluída — removida do planejador e enviada ao histórico.',
        'info',
      )
    })()
  }, [
    savedRotaId,
    routeCompleted,
    clearActiveRoute,
    queryClient,
  ])

  const nextStop = useMemo(
    () => (result ? getNextStop(displayStops) : null),
    [displayStops, result],
  )

  const routeMetrics = useMemo(() => {
    const fromStops = sumStopRouteMetrics(displayStops)
    return {
      distanciaTotal: fromStops.distancia || result?.distanciaTotal || 0,
      tempoTotal: fromStops.tempo || result?.tempoTotal || 0,
    }
  }, [displayStops, result])

  const routeCompletedSummary = useMemo(() => {
    if (!routeCompleted || !result) return null

    const stats = computeExecutionStats(displayStops)
    const valorTotal = enrichedStops.reduce(
      (sum, stop) =>
        sum + (stop.valorEntrega != null ? Number(stop.valorEntrega) : 0),
      0,
    )

    return {
      totalEntregas: stats.total,
      entregues: stats.entregues,
      distanciaTotal: routeMetrics.distanciaTotal,
      tempoTotal: routeMetrics.tempoTotal,
      valorTotal,
      enderecoPartida: enderecoPartidaRota,
      aproximada: result.aproximada,
    }
  }, [
    displayStops,
    enderecoPartidaRota,
    enrichedStops,
    result,
    routeCompleted,
    routeMetrics,
  ])

  const routePlanned = Boolean(result)
  const executionActive = hasExecutionUpdates
  const canEditOrder = !executionActive
  const reorderEnabled = canEditOrder && (!routePlanned || !reorderLocked)

  const existingEntregaIds = useMemo(
    () =>
      new Set(
        stops
          .map((stop) => stop.entregaId)
          .filter((id): id is string => Boolean(id)),
      ),
    [stops],
  )

  const applySavedParadaIds = (
    saved: RotaPlanejada,
    paradas: PlannerStop[],
  ) =>
    paradas.map((stop) => {
      const parada = saved.paradas.find(
        (item) =>
          item.ordem === stop.ordem &&
          item.endereco === stop.endereco &&
          (item.cliente ?? '') === (stop.cliente ?? ''),
      )

      return {
        ...stop,
        paradaId: parada?.id ?? stop.paradaId ?? null,
      }
    })

  const persistCalculatedRoute = async (
    optimized: OptimizedRouteResult,
    options?: { silent?: boolean },
  ) => {
    const saved = await saveMutation.mutateAsync({
      enderecoInicial: optimized.enderecoInicial,
      distanciaTotal: optimized.distanciaTotal,
      tempoTotal: optimized.tempoTotal,
      aproximada: optimized.aproximada,
      paradas: optimized.paradas,
      substituirRotaId: routeCompleted ? null : savedRotaId,
      motoboyId: resolvePlannerMotoboyId(),
      silent: options?.silent ?? true,
    })

    setSavedRotaId(saved.id)
    syncStops(applySavedParadaIds(saved, optimized.paradas))
    return saved
  }

  const handleAddOrUpdate = (data: PlannerStopFormData) => {
    const normalized = normalizePlannerStopForm(
      data,
      stops,
      editing?.tempId,
    )

    if (editing) {
      setStops((current) =>
        current.map((stop) =>
          stop.tempId === editing.tempId
            ? {
                ...stop,
                ...normalized,
                cliente: normalized.cliente || null,
                bairro: normalized.bairro || null,
                telefone: normalized.telefone || null,
                observacao: normalized.observacao || null,
                ordemUrgencia: normalized.ordemUrgencia ?? null,
              }
            : stop,
        ),
      )
      setEditing(null)
    } else {
      setStops((current) => [
        ...current,
        createPlannerStop({
          cliente: normalized.cliente,
          endereco: normalized.endereco,
          bairro: normalized.bairro,
          telefone: normalized.telefone,
          observacao: normalized.observacao,
          prioridade: normalized.prioridade,
          ordemUrgencia: normalized.ordemUrgencia ?? null,
        }),
      ])
    }
    resetRoutePlanning()
  }

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const source = result?.paradas ?? stops
    const next = [...source]
    const [moved] = next.splice(fromIndex, 1)
    if (!moved) return

    next.splice(toIndex, 0, moved)
    const reordered = next.map((stop, index) => ({ ...stop, ordem: index + 1 }))

    setStops(reordered)
    setResult((current) =>
      current ? { ...current, paradas: reordered } : current,
    )
    setOrderDirty(true)
    toast('Ordem alterada. Recalcule a rota para atualizar distâncias.', 'info')
  }

  const applyOptimizedResult = (
    currentStops: PlannerStop[],
    optimized: OptimizedRouteResult,
  ) => {
    const merged = mergeStopsWithStatus(currentStops, optimized.paradas)
    setResult({ ...optimized, paradas: merged })
    setStops(merged)
    return merged
  }

  const handleRecalculateManualOrder = async () => {
    const currentStops = result?.paradas ?? stops
    if (currentStops.length === 0) {
      toast('Adicione ao menos uma entrega', 'error')
      return
    }

    const planned = await planMutation.mutateAsync({
      enderecoInicial: resolveEmbarqueEndereco(
        currentStops,
        result?.enderecoInicial ?? enderecoPartidaPadrao,
      ),
      paradas: currentStops,
      preservarOrdem: true,
      substituirRotaId: routeCompleted ? null : savedRotaId,
      motoboyId: resolvePlannerMotoboyId(),
    })
    applyOptimizedResult(currentStops, {
      ...planned,
      enderecoInicial: result?.enderecoInicial ?? enderecoPartidaPadrao,
    })
    setSavedRotaId(planned.rotaId ?? null)
    setOrderDirty(false)
    setReorderLocked(true)

    toast('Rota recalculada e atualizada no monitoramento', 'success')
  }

  const handleOptimize = async () => {
    if (stops.length === 0) {
      toast('Adicione ao menos uma entrega', 'error')
      return
    }

    const planned = await planMutation.mutateAsync({
      enderecoInicial: enderecoPartidaPadrao,
      paradas: stops,
      substituirRotaId: routeCompleted ? null : savedRotaId,
      motoboyId: resolvePlannerMotoboyId(),
    })
    applyOptimizedResult(stops, planned)
    setSavedRotaId(planned.rotaId ?? null)
    setReorderLocked(true)
    setOrderDirty(false)

    if (
      planned.paradas.length > 0 &&
      planned.distanciaTotal === 0 &&
      planned.tempoTotal === 0
    ) {
      toast(
        'Rota registrada no monitoramento. Não foi possível calcular distâncias — verifique endereço e bairro de cada parada.',
        'info',
      )
      return
    }

    toast(
      planned.aproximada
        ? 'Rota calculada e registrada no monitoramento (aproximada)'
        : 'Melhor rota calculada e registrada no monitoramento!',
      planned.aproximada ? 'info' : 'success',
    )
  }

  const recalcRemainingRoute = async (currentStops: PlannerStop[]) => {
    const metricsSnapshot = snapshotStopRouteMetrics(currentStops)
    const inactive = currentStops.filter(
      (stop) => !isActiveRouteStop(getStopStatus(stop)),
    )
    const active = getActiveStopsForRoute(currentStops)
    const inactiveMetrics = sumStopRouteMetrics(inactive)

    if (active.length === 0) {
      setStops(currentStops)
      setResult((current) =>
        current
          ? {
              ...current,
              paradas: currentStops,
              distanciaTotal: inactiveMetrics.distancia,
              tempoTotal: inactiveMetrics.tempo,
            }
          : current,
      )
      return
    }

    const embarque = resolveEmbarqueEndereco(
      currentStops,
      result?.enderecoInicial ?? enderecoPartidaPadrao,
    )

    const optimized = await optimizeMutation.mutateAsync({
      enderecoInicial: embarque,
      paradas: active,
    })

    if (
      optimized.distanciaTotal === 0 &&
      optimized.tempoTotal === 0 &&
      active.some((stop) => stop.latitude != null)
    ) {
      toast(
        'Recálculo falhou; mantendo distâncias anteriores das paradas entregues.',
        'info',
      )
    }

    const mergedActive = mergeStopsWithStatus(active, optimized.paradas).map(
      (stop, index) =>
        restoreStopRouteMetrics(
          {
            ...stop,
            ordem: inactive.length + index + 1,
            distancia:
              optimized.distanciaTotal > 0
                ? stop.distancia
                : active[index]?.distancia ?? stop.distancia,
            tempo:
              optimized.tempoTotal > 0
                ? stop.tempo
                : active[index]?.tempo ?? stop.tempo,
          },
          metricsSnapshot,
        ),
    )
    const finalStops = [
      ...inactive.map((stop, index) =>
        restoreStopRouteMetrics({ ...stop, ordem: index + 1 }, metricsSnapshot),
      ),
      ...mergedActive,
    ]
    const finalMetrics = sumStopRouteMetrics(finalStops)

    setStops(finalStops)
    setResult({
      ...optimized,
      enderecoInicial: result?.enderecoInicial ?? enderecoPartidaPadrao,
      paradas: finalStops,
      totalEntregas: finalStops.length,
      distanciaTotal:
        finalMetrics.distancia ||
        inactiveMetrics.distancia + optimized.distanciaTotal,
      tempoTotal:
        finalMetrics.tempo || inactiveMetrics.tempo + optimized.tempoTotal,
      origem: optimized.origem ?? result?.origem ?? null,
    })
    setProgressUpdatedAt(new Date().toISOString())
  }

  const handleStatusChange = async (
    stop: PlannerStop,
    status: StatusExecucao,
    observacao?: string | null,
  ) => {
    const { stops: nextStops, autoEmRota } = applyDeliveryStatusUpdates(
      displayStops,
      stop,
      status,
      observacao,
    )
    syncStops(nextStops)
    setProgressUpdatedAt(new Date().toISOString())
    setHistoricoExecucao((current) => [
      ...current,
      buildHistoricoEntry(
        nextStops.find((item) => item.tempId === stop.tempId) ?? stop,
      ),
      ...(autoEmRota ? [buildHistoricoEntry(autoEmRota)] : []),
    ])
    setSelectedTempId(autoEmRota?.tempId ?? stop.tempId)

    let rotaConcluida = false

    if (savedRotaId && stop.paradaId) {
      try {
        const response = await routingService.updateExecucaoParada(
          savedRotaId,
          stop.paradaId,
          {
            status,
            observacao: observacao ?? null,
          },
        )
        rotaConcluida = response.rotaConcluida

        const syncedStops = mergeExecucoesIntoStops(
          nextStops,
          response.execucoes,
        )
        syncStops(syncedStops)
        setProgressUpdatedAt(new Date().toISOString())
      } catch {
        toast('Erro ao salvar status no servidor', 'error')
      }
    }

    if (rotaConcluida) {
      const summary = computeExecutionStats(nextStops)
      const metrics = sumStopRouteMetrics(nextStops)
      clearActiveRoute()
      invalidateDeliveryRelated(queryClient)
      queryClient.invalidateQueries({ queryKey: [ROTAS_QUERY_KEY] })
      toast(
        `Rota concluída: ${summary.entregues} entrega(s) · ${formatDistance(metrics.distancia || result?.distanciaTotal || 0)} · ${formatDuration(metrics.tempo || result?.tempoTotal || 0)}. Movida para o histórico.`,
        'success',
      )
      return
    }

    if (status === 'ENTREGUE' && autoRecalc) {
      await recalcRemainingRoute(nextStops)
    }
  }

  const handlePaymentStatusChange = async (
    stop: PlannerStop,
    status: StatusPagamentoCliente,
  ) => {
    const nextStops = displayStops.map((item) =>
      item.tempId === stop.tempId
        ? { ...item, statusPagamentoCliente: status }
        : item,
    )
    syncStops(nextStops)
    setProgressUpdatedAt(new Date().toISOString())

    if (!stop.entregaId) return

    setPaymentStatusUpdatingId(stop.tempId)
    try {
      await updatePaymentMutation.mutateAsync({
        id: stop.entregaId,
        status,
      })
    } catch {
      syncStops(
        displayStops.map((item) =>
          item.tempId === stop.tempId
            ? {
                ...item,
                statusPagamentoCliente: stop.statusPagamentoCliente ?? null,
              }
            : item,
        ),
      )
      toast('Erro ao atualizar status de pagamento', 'error')
    } finally {
      setPaymentStatusUpdatingId(null)
    }
  }

  const handleSave = async () => {
    if (!result) {
      toast('Calcule a rota antes de registrar', 'error')
      return
    }

    await persistCalculatedRoute(result, { silent: false })
  }

  const handleCopyWhatsApp = () => {
    if (!whatsappText) return
    copyMutation.mutate(whatsappText)
  }

  const handleSendWhatsApp = () => {
    if (!whatsappText) return
    setSendPayload({ baseText: whatsappText })
    setSendModalOpen(true)
  }

  const handleCopyProgressWhatsApp = () => {
    if (!progressWhatsappText) return
    copyMutation.mutate(progressWhatsappText)
  }

  const handleSendProgressWhatsApp = () => {
    if (!progressWhatsappText) return
    setSendPayload({ baseText: progressWhatsappText })
    setProgressModalOpen(true)
  }

  const handleNavigate = () => {
    const ordered = getActiveStopsForRoute(result?.paradas ?? stops)
    if (ordered.length === 0) {
      toast('Não há paradas para navegar', 'error')
      return
    }

    const urls = buildGoogleMapsNavigationUrls(embarqueEndereco, ordered)
    urls.forEach((url, index) => {
      window.setTimeout(() => window.open(url, '_blank', 'noopener,noreferrer'), index * 400)
    })

    if (urls.length > 1) {
      toast(
        `Abrindo ${urls.length} trechos no Google Maps (limite de waypoints)`,
        'info',
      )
    }
  }

  const handleLoadRoute = async (rota: RotaPlanejada) => {
    if (rota.concluidaEm) {
      toast(
        'Esta rota já foi concluída. Use Duplicar no histórico para montar outra.',
        'info',
      )
      return
    }

    try {
      const execucoes = await routingService.getExecucao(rota.id)
      hydrateFromRota(rota, execucoes, { tab: 'planejar' })
    } catch {
      hydrateFromRota(rota, [], { tab: 'planejar' })
      toast('Não foi possível carregar o andamento salvo', 'info')
    }

    toast('Rota carregada no planejador', 'success')
  }

  const selectedStop =
    displayStops.find((stop) => stop.tempId === selectedTempId) ?? null

  return (
    <PageShell>
      <PageHeader
        title="Planejador de Rotas"
        description="Importe entregas, otimize a sequência e inicie a navegação. A rota calculada sincroniza automaticamente entre dispositivos."
      >
        {isAdmin ? (
          <MotoboySelect
            id="planner-motoboy"
            value={motoboyFilter}
            onChange={setMotoboyFilter}
            allowAll={false}
            label="Motoboy"
            {...motoboySelectToolbarProps}
          />
        ) : null}
        <PageHeaderActions className="sm:ml-0">
          <Button
            variant={tab === 'planejar' ? 'primary' : 'secondary'}
            onClick={() => setTab('planejar')}
          >
            Planejar
          </Button>
          <Button
            variant={tab === 'historico' ? 'primary' : 'secondary'}
            onClick={() => setTab('historico')}
          >
            Histórico
          </Button>
        </PageHeaderActions>
      </PageHeader>

      {tab === 'historico' ? (
        <HistoricoRotas onLoadRoute={handleLoadRoute} />
      ) : (
        <>
          <ResumoRota
            totalEntregas={displayStops.length}
            distanciaTotal={routeMetrics.distanciaTotal}
            tempoTotal={routeMetrics.tempoTotal}
            enderecoInicial={routePlanned ? embarqueEndereco : enderecoPartidaPadrao}
            enderecoLabel={routePlanned ? embarqueLabel : 'Endereço de embarque'}
            aproximada={result?.aproximada}
          />

          {routePlanned ? (
            <BarraProgressoExecucao stops={displayStops} />
          ) : null}

          {routePlanned ? (
            <WhatsAppPreview
              title="Início de rota — WhatsApp"
              text={whatsappText}
              onCopy={handleCopyWhatsApp}
              onSend={handleSendWhatsApp}
              isCopying={copyMutation.isPending}
            />
          ) : null}

          {routePlanned && executionActive ? (
            <WhatsAppPreview
              title={
                routeCompleted
                  ? 'Rota concluída — WhatsApp'
                  : 'Andamento da rota — WhatsApp'
              }
              text={progressWhatsappText}
              onCopy={handleCopyProgressWhatsApp}
              onSend={handleSendProgressWhatsApp}
              isCopying={copyMutation.isPending}
            />
          ) : null}

          <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="min-w-0 space-y-4">
              <EnderecoInicial />

              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={() => {
                  setEditing(null)
                  setFormOpen(true)
                }}>
                  + Adicionar entrega
                </Button>
                <Button variant="import" onClick={() => setImportOpen(true)}>
                  Importar entregas
                </Button>
                {routePlanned && !executionActive ? (
                  <label className="flex items-center gap-2 rounded-xl border border-border/60 bg-surface/30 px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={!reorderLocked}
                      onChange={(event) => setReorderLocked(!event.target.checked)}
                    />
                    Permitir alterar ordem
                  </label>
                ) : null}
                {executionActive ? (
                  <label className="flex items-center gap-2 rounded-xl border border-border/60 bg-surface/30 px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={autoRecalc}
                      onChange={(event) => setAutoRecalc(event.target.checked)}
                    />
                    Recalcular automaticamente
                  </label>
                ) : null}
                {orderDirty ? (
                  <Button
                    variant="secondary"
                    isLoading={
                      planMutation.isPending || saveMutation.isPending
                    }
                    onClick={handleRecalculateManualOrder}
                  >
                    Recalcular rota
                  </Button>
                ) : null}
                <Button
                  size="lg"
                  className="sm:ml-auto"
                  isLoading={planMutation.isPending || saveMutation.isPending}
                  onClick={handleOptimize}
                >
                  <span className="inline-flex items-center gap-2">
                    <IconRoute className="size-4" />
                    Calcular melhor rota
                  </span>
                </Button>
                {savedRotaId ? (
                  <span className="w-full text-xs text-muted-foreground sm:w-auto">
                    Visível no monitoramento
                  </span>
                ) : null}
              </div>

              <ListaEntregas
                stops={enrichedStops}
                optimized={routePlanned}
                showStatusControls={routePlanned}
                deliveryStarted={executionActive}
                reorderEnabled={reorderEnabled}
                orderDirty={orderDirty}
                nextStopTempId={nextStop?.tempId}
                onStatusChange={handleStatusChange}
                onPaymentStatusChange={handlePaymentStatusChange}
                paymentStatusUpdatingId={paymentStatusUpdatingId}
                onEdit={(stop) => {
                  setEditing(stop)
                  setFormOpen(true)
                }}
                onRemove={(tempId) => {
                  setStops((current) =>
                    current.filter((stop) => stop.tempId !== tempId),
                  )
                  resetRoutePlanning()
                }}
                onReorder={handleReorder}
              />

              {executionActive ? (
                <HistoricoExecucao items={historicoExecucao} />
              ) : null}

              <ImportadorEnderecos
                onImport={(imported) => {
                  setStops((current) => [...current, ...imported])
                  resetRoutePlanning()
                }}
              />
            </div>

            <div className="min-w-0 space-y-4">
              <MapaRota
                origem={result?.origem ?? null}
                paradas={displayStops}
                selectedTempId={selectedTempId}
                executionMode={routePlanned}
                onSelect={(stop) => setSelectedTempId(stop.tempId)}
              />

              {routePlanned ? (
                <ProximaParadaCard
                  stop={nextStop}
                  completedSummary={routeCompletedSummary}
                  onCopyMessage={
                    routeCompleted && progressWhatsappText
                      ? handleCopyProgressWhatsApp
                      : undefined
                  }
                  isCopying={copyMutation.isPending}
                />
              ) : null}

              {selectedStop ? (
                <Card glass className="min-w-0 overflow-hidden">
                  <CardHeader>
                    <CardTitle>Parada selecionada</CardTitle>
                  </CardHeader>
                  <CardContent className="min-w-0 space-y-2">
                    <MetaChip
                      tone="client"
                      className="max-w-full text-sm font-semibold"
                      title={selectedStop.cliente ?? undefined}
                    >
                      {selectedStop.cliente?.trim() || 'Sem nome'}
                    </MetaChip>
                    <MetaChip
                      tone="address"
                      className="w-full items-start whitespace-normal"
                    >
                      <span className="line-clamp-2 text-left leading-relaxed">
                        {[selectedStop.endereco, selectedStop.bairro]
                          .filter(Boolean)
                          .join(' — ')}
                      </span>
                    </MetaChip>
                    {selectedStop.telefone ? (
                      <MetaChip tone="phone" className="tabular-nums">
                        {selectedStop.telefone}
                      </MetaChip>
                    ) : null}
                    {selectedStop.valorEntrega != null &&
                    Number(selectedStop.valorEntrega) > 0 ? (
                      <MetaChip tone="money" className="tabular-nums">
                        {formatCurrency(Number(selectedStop.valorEntrega))}
                      </MetaChip>
                    ) : null}
                    {selectedStop.observacao ? (
                      <p className="text-xs text-muted-foreground">
                        {selectedStop.observacao}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              ) : null}

              {result?.sugestoes?.length ? (
                <Card glass>
                  <CardHeader>
                    <CardTitle>Sugestões</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                      {result.sugestoes.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button onClick={handleNavigate} disabled={displayStops.length === 0}>
                  Iniciar navegação
                </Button>
                {result && !savedRotaId ? (
                  <Button
                    variant="secondary"
                    onClick={handleSave}
                    isLoading={saveMutation.isPending}
                  >
                    Registrar no monitoramento
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </>
      )}

      <FormularioEntrega
        open={formOpen}
        editing={editing}
        stops={stops}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        onSubmit={handleAddOrUpdate}
      />

      <ImportarEntregasModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={(imported) => {
          setStops((current) => [...current, ...imported])
          resetRoutePlanning()
          toast(`${imported.length} entrega(s) adicionada(s)`, 'success')
        }}
        existingEntregaIds={existingEntregaIds}
      />

      <WhatsAppSendModal
        open={sendModalOpen}
        onClose={() => {
          setSendModalOpen(false)
          setSendPayload(null)
        }}
        payload={sendPayload}
      />

      <WhatsAppSendModal
        open={progressModalOpen}
        onClose={() => {
          setProgressModalOpen(false)
          setSendPayload(null)
        }}
        payload={sendPayload}
      />
    </PageShell>
  )
}
