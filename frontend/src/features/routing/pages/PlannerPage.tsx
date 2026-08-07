import { useMemo, useState } from 'react'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui'
import { IconRoute } from '@/shared/components/icons'
import { toast } from '@/shared/stores/toast.store'
import { WhatsAppPreview } from '@/features/accounting/components/WhatsAppPreview'
import {
  WhatsAppSendModal,
  type WhatsAppSendPayload,
} from '@/features/accounting/components/WhatsAppSendModal'
import { useCopyWhatsAppText } from '@/features/accounting/hooks/usePrestacao'
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
  useSaveRoute,
} from '../hooks/useRouting'
import { routingService } from '../services/routing.service'
import { createPlannerStop } from '../utils/parseAddresses'
import { normalizePlannerStopForm } from '../utils/urgentPriority'
import {
  buildGoogleMapsNavigationUrls,
} from '../utils/googleMapsUrl'
import type {
  OptimizedRouteResult,
  PlannerStop,
  PlannerStopFormData,
  RotaPlanejada,
  StatusExecucao,
} from '../schemas/routing.schema'
import {
  buildRouteWhatsAppPayload,
  formatRouteWhatsAppText,
} from '../utils/whatsappRouteMessage'
import { formatRouteProgressWhatsAppText } from '../utils/whatsappRouteProgressMessage'
import {
  applyStatusUpdate,
  buildHistoricoEntry,
  getActiveStopsForRoute,
  getNextStop,
  getStopStatus,
  isActiveRouteStop,
  isAllStopsDelivered,
  mergeStopsWithStatus,
  restoreStopRouteMetrics,
  snapshotStopRouteMetrics,
  sumStopRouteMetrics,
  withDefaultStatus,
  type ExecucaoHistoricoItem,
} from '../utils/executionStatus'
import { DEFAULT_START_ADDRESS } from '../schemas/routing.schema'

export function PlannerPage() {
  const { data: enderecoPartidaData } = useEnderecoPartida()
  const enderecoInicial =
    enderecoPartidaData?.enderecoPartidaPadrao ?? DEFAULT_START_ADDRESS
  const [stops, setStops] = useState<PlannerStop[]>([])
  const [result, setResult] = useState<OptimizedRouteResult | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<PlannerStop | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [selectedTempId, setSelectedTempId] = useState<string | null>(null)
  const [tab, setTab] = useState<'planejar' | 'historico'>('planejar')
  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [sendPayload, setSendPayload] = useState<WhatsAppSendPayload | null>(null)
  const [progressModalOpen, setProgressModalOpen] = useState(false)
  const [autoRecalc, setAutoRecalc] = useState(true)
  const [reorderLocked, setReorderLocked] = useState(false)
  const [orderDirty, setOrderDirty] = useState(false)
  const [savedRotaId, setSavedRotaId] = useState<string | null>(null)
  const [progressUpdatedAt, setProgressUpdatedAt] = useState<string>(
    new Date().toISOString(),
  )
  const [historicoExecucao, setHistoricoExecucao] = useState<
    ExecucaoHistoricoItem[]
  >([])

  const optimizeMutation = useOptimizeRoute()
  const saveMutation = useSaveRoute()
  const copyMutation = useCopyWhatsAppText()

  const displayStops = result?.paradas ?? stops

  const whatsappText = useMemo(() => {
    if (!result) return ''
    return formatRouteWhatsAppText(buildRouteWhatsAppPayload(result))
  }, [result])

  const progressWhatsappText = useMemo(() => {
    if (!result) return ''
    const metrics = sumStopRouteMetrics(displayStops)
    const activeMetrics = sumStopRouteMetrics(
      getActiveStopsForRoute(displayStops),
    )
    return formatRouteProgressWhatsAppText({
      stops: displayStops,
      enderecoInicial: result.enderecoInicial,
      distanciaTotal: metrics.distancia || result.distanciaTotal,
      tempoTotal: metrics.tempo || result.tempoTotal,
      aproximada: result.aproximada,
      distanciaRestante: activeMetrics.distancia || result.distanciaTotal,
      tempoRestante: activeMetrics.tempo || result.tempoTotal,
      data: new Date().toISOString(),
      atualizadoEm: progressUpdatedAt,
    })
  }, [displayStops, progressUpdatedAt, result])

  const hasExecutionUpdates = useMemo(
    () => displayStops.some((stop) => getStopStatus(stop) !== 'PENDENTE'),
    [displayStops],
  )

  const routeCompleted = useMemo(
    () => isAllStopsDelivered(displayStops),
    [displayStops],
  )

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

  const routePlanned = Boolean(result)
  const executionActive = hasExecutionUpdates
  const canEditOrder = !executionActive
  const reorderEnabled = canEditOrder && (!routePlanned || !reorderLocked)

  const syncStops = (updated: PlannerStop[]) => {
    const normalized = updated.map(withDefaultStatus)
    setStops(normalized)
    setResult((current) =>
      current ? { ...current, paradas: normalized } : current,
    )
  }

  const existingEntregaIds = useMemo(
    () =>
      new Set(
        stops
          .map((stop) => stop.entregaId)
          .filter((id): id is string => Boolean(id)),
      ),
    [stops],
  )

  const resetRoutePlanning = () => {
    setResult(null)
    setOrderDirty(false)
    setReorderLocked(false)
    setSavedRotaId(null)
  }

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

    const optimized = await optimizeMutation.mutateAsync({
      enderecoInicial,
      paradas: currentStops,
      preservarOrdem: true,
    })
    const merged = applyOptimizedResult(currentStops, optimized)
    setOrderDirty(false)
    setReorderLocked(true)

    try {
      await persistCalculatedRoute({ ...optimized, paradas: merged })
    } catch {
      toast(
        'Rota recalculada, mas não foi possível atualizar o monitoramento.',
        'error',
      )
    }

    toast('Rota recalculada com a ordem atual', 'success')
  }

  const handleOptimize = async () => {
    if (stops.length === 0) {
      toast('Adicione ao menos uma entrega', 'error')
      return
    }

    const optimized = await optimizeMutation.mutateAsync({
      enderecoInicial,
      paradas: stops,
    })
    const merged = applyOptimizedResult(stops, optimized)
    setReorderLocked(true)
    setOrderDirty(false)

    if (
      optimized.paradas.length > 0 &&
      optimized.distanciaTotal === 0 &&
      optimized.tempoTotal === 0
    ) {
      toast(
        'Não foi possível calcular distâncias. Verifique endereço e bairro de cada parada.',
        'error',
      )
      return
    }

    try {
      await persistCalculatedRoute({ ...optimized, paradas: merged })
    } catch {
      toast(
        'Rota calculada, mas não foi possível registrar no monitoramento.',
        'error',
      )
      return
    }

    toast(
      optimized.aproximada
        ? 'Rota calculada e registrada (aproximada)'
        : 'Melhor rota calculada e registrada!',
      optimized.aproximada ? 'info' : 'success',
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

    const optimized = await optimizeMutation.mutateAsync({
      enderecoInicial,
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
    const updated = applyStatusUpdate(stop, status, observacao)
    const nextStops = displayStops.map((item) =>
      item.tempId === stop.tempId ? updated : item,
    )
    syncStops(nextStops)
    setProgressUpdatedAt(new Date().toISOString())
    setHistoricoExecucao((current) => [
      ...current,
      buildHistoricoEntry(updated),
    ])
    setSelectedTempId(updated.tempId)

    if (savedRotaId && stop.paradaId) {
      try {
        await routingService.updateExecucaoParada(savedRotaId, stop.paradaId, {
          status,
          observacao: observacao ?? null,
        })
      } catch {
        toast('Erro ao salvar status no servidor', 'error')
      }
    }

    if (status === 'ENTREGUE' && autoRecalc) {
      await recalcRemainingRoute(nextStops)
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

    const urls = buildGoogleMapsNavigationUrls(enderecoInicial, ordered)
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
    const loaded: PlannerStop[] = rota.paradas.map((parada) => ({
      tempId: parada.id,
      paradaId: parada.id,
      entregaId: parada.entregaId,
      cliente: parada.cliente,
      endereco: parada.endereco,
      bairro: parada.bairro,
      telefone: parada.telefone ?? null,
      observacao: parada.observacao,
      prioridade: parada.prioridade,
      ordemUrgencia: parada.ordemUrgencia ?? null,
      valorEntrega: parada.valorEntrega
        ? Number(parada.valorEntrega)
        : null,
      ordem: parada.ordem,
      distancia:
        parada.distancia != null ? Number(parada.distancia) : null,
      tempo: parada.tempo,
      latitude: parada.latitude,
      longitude: parada.longitude,
      statusExecucao: 'PENDENTE' as StatusExecucao,
    }))

    setSavedRotaId(rota.id)

    try {
      const execucoes = await routingService.getExecucao(rota.id)
      for (const execucao of execucoes) {
        const index = loaded.findIndex((stop) => stop.paradaId === execucao.paradaId)
        if (index === -1) continue
        loaded[index] = {
          ...loaded[index]!,
          statusExecucao: execucao.status as StatusExecucao,
          statusObservacao: execucao.observacao,
          statusAtualizadoEm: execucao.dataHoraStatus,
        }
      }
    } catch {
      toast('Não foi possível carregar o andamento salvo', 'info')
    }

    setStops(loaded)
    setResult({
      enderecoInicial: rota.enderecoInicial,
      origem: null,
      distanciaTotal: Number(rota.distanciaTotal),
      tempoTotal: rota.tempoTotal,
      totalEntregas: loaded.length,
      aproximada: rota.aproximada,
      polyline: null,
      sugestoes: [],
      paradas: loaded,
    })
    setReorderLocked(true)
    setOrderDirty(false)
    setHistoricoExecucao(
      loaded
        .filter((stop) => stop.statusAtualizadoEm)
        .map((stop) => buildHistoricoEntry(stop)),
    )
    const latestStatusUpdate = loaded
      .map((stop) => stop.statusAtualizadoEm)
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1)
    setProgressUpdatedAt(latestStatusUpdate ?? new Date().toISOString())
    setTab('planejar')
    toast('Rota carregada no planejador', 'success')
  }

  const selectedStop =
    displayStops.find((stop) => stop.tempId === selectedTempId) ?? null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Planejador de Rotas
          </h2>
          <p className="text-sm text-muted-foreground">
            Importe entregas, otimize a sequência e inicie a navegação.
          </p>
        </div>
        <div className="flex gap-2">
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
        </div>
      </div>

      {tab === 'historico' ? (
        <HistoricoRotas onLoadRoute={handleLoadRoute} />
      ) : (
        <>
          <ResumoRota
            totalEntregas={displayStops.length}
            distanciaTotal={routeMetrics.distanciaTotal}
            tempoTotal={routeMetrics.tempoTotal}
            enderecoInicial={enderecoInicial}
            aproximada={result?.aproximada}
          />

          {routePlanned ? (
            <BarraProgressoExecucao stops={displayStops} />
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <EnderecoInicial />

              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={() => {
                  setEditing(null)
                  setFormOpen(true)
                }}>
                  + Adicionar entrega
                </Button>
                <Button variant="secondary" onClick={() => setImportOpen(true)}>
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
                      optimizeMutation.isPending || saveMutation.isPending
                    }
                    onClick={handleRecalculateManualOrder}
                  >
                    Recalcular rota
                  </Button>
                ) : null}
                <Button
                  size="lg"
                  className="sm:ml-auto"
                  isLoading={optimizeMutation.isPending || saveMutation.isPending}
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
                stops={displayStops}
                optimized={routePlanned}
                showStatusControls={routePlanned}
                deliveryStarted={executionActive}
                reorderEnabled={reorderEnabled}
                orderDirty={orderDirty}
                nextStopTempId={nextStop?.tempId}
                onStatusChange={handleStatusChange}
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

            <div className="space-y-4">
              <MapaRota
                origem={result?.origem ?? null}
                paradas={displayStops}
                selectedTempId={selectedTempId}
                executionMode={routePlanned}
                onSelect={(stop) => setSelectedTempId(stop.tempId)}
              />

              {routePlanned ? (
                <ProximaParadaCard stop={nextStop} />
              ) : null}

              {selectedStop ? (
                <Card glass>
                  <CardHeader>
                    <CardTitle>Parada selecionada</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <p className="font-medium">
                      {selectedStop.cliente || 'Sem nome'}
                    </p>
                    <p className="text-muted-foreground">
                      {selectedStop.endereco}
                    </p>
                    {selectedStop.bairro ? (
                      <p>Bairro: {selectedStop.bairro}</p>
                    ) : null}
                    {selectedStop.valorEntrega != null ? (
                      <p>
                        Valor: R${' '}
                        {Number(selectedStop.valorEntrega).toFixed(2)}
                      </p>
                    ) : null}
                    {selectedStop.observacao ? (
                      <p>{selectedStop.observacao}</p>
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

              {routePlanned && !executionActive ? (
                <WhatsAppPreview
                  title="Rota planejada — WhatsApp"
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
    </div>
  )
}
