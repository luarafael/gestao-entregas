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
import { MapaRota } from '../components/MapaRota'
import { HistoricoRotas } from '../components/HistoricoRotas'
import {
  useEnderecoPartida,
  useOptimizeRoute,
  useSaveRoute,
} from '../hooks/useRouting'
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
} from '../schemas/routing.schema'
import {
  buildRouteWhatsAppPayload,
  formatRouteWhatsAppText,
} from '../utils/whatsappRouteMessage'
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

  const optimizeMutation = useOptimizeRoute()
  const saveMutation = useSaveRoute()
  const copyMutation = useCopyWhatsAppText()

  const whatsappText = useMemo(() => {
    if (!result) return ''
    return formatRouteWhatsAppText(buildRouteWhatsAppPayload(result))
  }, [result])

  const existingEntregaIds = useMemo(
    () =>
      new Set(
        stops
          .map((stop) => stop.entregaId)
          .filter((id): id is string => Boolean(id)),
      ),
    [stops],
  )

  const displayStops = result?.paradas ?? stops

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
          observacao: normalized.observacao,
          prioridade: normalized.prioridade,
          ordemUrgencia: normalized.ordemUrgencia ?? null,
        }),
      ])
    }
    setResult(null)
  }

  const handleReorder = (fromIndex: number, toIndex: number) => {
    setStops((current) => {
      const source = result?.paradas ?? current
      const next = [...source]
      const [moved] = next.splice(fromIndex, 1)
      if (!moved) return current
      next.splice(toIndex, 0, moved)
      return next.map((stop, index) => ({ ...stop, ordem: index + 1 }))
    })
    setResult(null)
    toast('Ordem alterada. Recalcule a rota para atualizar distâncias.', 'info')
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
    setResult(optimized)
    setStops(optimized.paradas)
    toast(
      optimized.aproximada
        ? 'Rota calculada (aproximada)'
        : 'Melhor rota calculada!',
      optimized.aproximada ? 'info' : 'success',
    )
  }

  const handleSave = async () => {
    if (!result) {
      toast('Calcule a rota antes de salvar', 'error')
      return
    }

    await saveMutation.mutateAsync({
      enderecoInicial: result.enderecoInicial,
      distanciaTotal: result.distanciaTotal,
      tempoTotal: result.tempoTotal,
      aproximada: result.aproximada,
      paradas: result.paradas,
    })
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

  const handleNavigate = () => {
    const ordered = result?.paradas ?? stops
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

  const handleLoadRoute = (rota: RotaPlanejada) => {
    const loaded = rota.paradas.map((parada) => ({
      tempId: parada.id,
      entregaId: parada.entregaId,
      cliente: parada.cliente,
      endereco: parada.endereco,
      bairro: parada.bairro,
      observacao: parada.observacao,
      prioridade: parada.prioridade,
      ordemUrgencia: parada.ordemUrgencia ?? null,
      valorEntrega: parada.valorEntrega
        ? Number(parada.valorEntrega)
        : null,
      ordem: parada.ordem,
      distancia: parada.distancia ? Number(parada.distancia) : null,
      tempo: parada.tempo,
      latitude: parada.latitude,
      longitude: parada.longitude,
    }))

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
            distanciaTotal={result?.distanciaTotal ?? 0}
            tempoTotal={result?.tempoTotal ?? 0}
            enderecoInicial={enderecoInicial}
            aproximada={result?.aproximada}
          />

          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <EnderecoInicial />

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => {
                  setEditing(null)
                  setFormOpen(true)
                }}>
                  + Adicionar entrega
                </Button>
                <Button variant="secondary" onClick={() => setImportOpen(true)}>
                  Importar entregas
                </Button>
                <Button
                  size="lg"
                  className="sm:ml-auto"
                  isLoading={optimizeMutation.isPending}
                  onClick={handleOptimize}
                >
                  <span className="inline-flex items-center gap-2">
                    <IconRoute className="size-4" />
                    Calcular melhor rota
                  </span>
                </Button>
              </div>

              <ListaEntregas
                stops={displayStops}
                optimized={Boolean(result)}
                onEdit={(stop) => {
                  setEditing(stop)
                  setFormOpen(true)
                }}
                onRemove={(tempId) => {
                  setStops((current) =>
                    current.filter((stop) => stop.tempId !== tempId),
                  )
                  setResult(null)
                }}
                onReorder={handleReorder}
              />

              <ImportadorEnderecos
                onImport={(imported) => {
                  setStops((current) => [...current, ...imported])
                  setResult(null)
                }}
              />
            </div>

            <div className="space-y-4">
              <MapaRota
                origem={result?.origem ?? null}
                paradas={displayStops}
                selectedTempId={selectedTempId}
                onSelect={(stop) => setSelectedTempId(stop.tempId)}
              />

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

              {result ? (
                <WhatsAppPreview
                  text={whatsappText}
                  onCopy={handleCopyWhatsApp}
                  onSend={handleSendWhatsApp}
                  isCopying={copyMutation.isPending}
                />
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={handleSave}
                  isLoading={saveMutation.isPending}
                  disabled={!result}
                >
                  Salvar no histórico
                </Button>
                <Button onClick={handleNavigate} disabled={displayStops.length === 0}>
                  Iniciar navegação
                </Button>
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
          setResult(null)
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
    </div>
  )
}
