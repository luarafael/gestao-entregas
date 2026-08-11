import { useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  MetaChip,
  MetaField,
  PAGE_CARD_ARTICLE,
  Pagination,
  TableSkeleton,
} from '@/shared/components/ui'
import { IconRoute, IconWhatsApp } from '@/shared/components/icons'
import { cn } from '@/shared/utils/cn'
import { formatDateBR, formatTimeBR } from '@/shared/utils/format'
import { toast } from '@/shared/stores/toast.store'
import {
  WhatsAppSendModal,
  type WhatsAppSendPayload,
} from '@/features/accounting/components/WhatsAppSendModal'
import {
  useDeleteRoute,
  useDuplicateRoute,
  useRouteHistory,
} from '../hooks/useRouting'
import { routingService } from '../services/routing.service'
import { deliveryService } from '@/features/deliveries/services/delivery.service'
import { formatDistance, formatDuration } from '../utils/googleMapsUrl'
import { useCopyWhatsAppText } from '@/features/accounting/hooks/usePrestacao'
import {
  buildRouteWhatsAppPayload,
  formatRouteWhatsAppText,
} from '../utils/whatsappRouteMessage'
import { buildRouteProgressMessageFromRota } from '../utils/whatsappRouteProgressMessage'
import { mergeStopsWithLiveEntregas } from '../utils/routeStopPayment'
import type { RotaPlanejada } from '../schemas/routing.schema'
import { useIsAdmin } from '@/features/auth/hooks/useIsAdmin'

interface HistoricoRotasProps {
  onLoadRoute: (rota: RotaPlanejada) => void
}

function mapRotaToWhatsAppPayload(rota: RotaPlanejada) {
  return buildRouteWhatsAppPayload({
    enderecoInicial: rota.enderecoInicial,
    distanciaTotal: Number(rota.distanciaTotal),
    tempoTotal: rota.tempoTotal,
    aproximada: rota.aproximada,
    sugestoes: [],
    paradas: rota.paradas.map((parada) => ({
      tempId: parada.id,
      entregaId: parada.entregaId,
      cliente: parada.cliente,
      endereco: parada.endereco,
      bairro: parada.bairro,
      observacao: parada.observacao,
      prioridade: parada.prioridade,
      ordemUrgencia: parada.ordemUrgencia ?? null,
      valorEntrega: parada.valorEntrega ? Number(parada.valorEntrega) : null,
      ordem: parada.ordem,
      distancia: parada.distancia ? Number(parada.distancia) : null,
      tempo: parada.tempo,
      latitude: parada.latitude,
      longitude: parada.longitude,
    })),
  })
}

export function HistoricoRotas({ onLoadRoute }: HistoricoRotasProps) {
  const [page, setPage] = useState(1)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [copyingId, setCopyingId] = useState<string | null>(null)
  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [sendPayload, setSendPayload] = useState<WhatsAppSendPayload | null>(null)
  const historyQuery = useRouteHistory(page)
  const deleteMutation = useDeleteRoute()
  const duplicateMutation = useDuplicateRoute()
  const copyMutation = useCopyWhatsAppText()
  const canDelete = useIsAdmin()

  const items = historyQuery.data?.data ?? []
  const meta = historyQuery.data?.meta

  const handleCopyCompletedMessage = async (rotaId: string) => {
    try {
      setCopyingId(rotaId)
      const rota = await routingService.getById(rotaId)
      let execucoes: Awaited<ReturnType<typeof routingService.getExecucao>> = []

      if (rota.concluidaEm) {
        try {
          execucoes = await routingService.getExecucao(rotaId)
        } catch {
          execucoes = []
        }
      }

      const text = buildRouteProgressMessageFromRota(rota, execucoes)
      await copyMutation.mutateAsync(text)
    } catch {
      toast('Erro ao copiar mensagem da rota', 'error')
    } finally {
      setCopyingId(null)
    }
  }

  const handleSendWhatsApp = async (rotaId: string) => {
    try {
      setSendingId(rotaId)
      const rota = await routingService.getById(rotaId)
      const payload = mapRotaToWhatsAppPayload(rota)
      const entregaIds = payload.paradas
        .map((parada) => parada.entregaId)
        .filter((id): id is string => Boolean(id))

      let paradas = payload.paradas
      if (entregaIds.length > 0) {
        const live = await deliveryService.listByIds(entregaIds)
        paradas = mergeStopsWithLiveEntregas(paradas, live.data)
      }

      const text = formatRouteWhatsAppText({ ...payload, paradas })
      setSendPayload({ baseText: text })
      setSendModalOpen(true)
    } catch {
      toast('Erro ao preparar rota para o WhatsApp', 'error')
    } finally {
      setSendingId(null)
    }
  }

  return (
    <>
      <Card glass className="min-w-0 overflow-hidden">
        <CardHeader>
          <CardTitle>Histórico de rotas</CardTitle>
        </CardHeader>
        <CardContent className="min-w-0 space-y-4">
          {historyQuery.isLoading ? (
            <TableSkeleton rows={4} />
          ) : items.length === 0 ? (
            <EmptyState
              icon={<IconRoute className="size-6" />}
              title="Nenhuma rota salva"
              description="Calcule uma rota no planejador para registrá-la automaticamente aqui."
            />
          ) : (
            <div className="space-y-3">
              {items.map((rota) => {
                const isConcluida = Boolean(rota.concluidaEm)

                return (
                <article
                  key={rota.id}
                  className={cn(PAGE_CARD_ARTICLE)}
                >
                  <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <MetaField label="Data">
                      <MetaChip tone="time" className="w-fit">
                        {formatDateBR(rota.data)}
                      </MetaChip>
                    </MetaField>

                    {isConcluida && rota.concluidaEm ? (
                      <MetaField label="Concluída">
                        <MetaChip tone="delivery" className="w-fit">
                          {formatDateBR(rota.concluidaEm)} ·{' '}
                          {formatTimeBR(rota.concluidaEm)}
                        </MetaChip>
                      </MetaField>
                    ) : null}

                    <MetaField label="Paradas">
                      <MetaChip tone="delivery" className="w-fit tabular-nums">
                        {rota.paradas.length}
                      </MetaChip>
                    </MetaField>

                    <MetaField label="Trajeto" className="sm:col-span-2">
                      <MetaChip
                        tone="time"
                        className="w-fit"
                        title={
                          rota.aproximada ? 'Rota aproximada' : undefined
                        }
                      >
                        {formatDistance(Number(rota.distanciaTotal))} ·{' '}
                        {formatDuration(rota.tempoTotal)}
                        {rota.aproximada ? ' · aproximada' : ''}
                      </MetaChip>
                    </MetaField>

                    <MetaField label="Partida" className="sm:col-span-2 lg:col-span-4">
                      <MetaChip
                        tone="address"
                        className="w-full max-w-full items-start whitespace-normal"
                        title={rota.enderecoInicial}
                      >
                        <span className="line-clamp-2 text-left leading-relaxed">
                          {rota.enderecoInicial}
                        </span>
                      </MetaChip>
                    </MetaField>
                  </div>

                  <div className="mt-3 flex w-full min-w-0 flex-wrap gap-2 border-t border-border/40 pt-3">
                    {isConcluida ? (
                      <>
                        <p className="w-full text-xs text-muted-foreground">
                          Rota concluída — use Duplicar para montar uma nova com
                          as mesmas paradas.
                        </p>
                        <Button
                          size="sm"
                          variant="copy"
                          isLoading={copyingId === rota.id}
                          onClick={() => handleCopyCompletedMessage(rota.id)}
                        >
                          Copiar mensagem
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={async () => {
                          const full = await routingService.getById(rota.id)
                          if (full.concluidaEm) {
                            toast(
                              'Esta rota já foi concluída. Use Duplicar para planejar outra.',
                              'info',
                            )
                            return
                          }
                          onLoadRoute(full)
                        }}
                      >
                        Abrir no planejador
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="whatsapp"
                      isLoading={sendingId === rota.id}
                      onClick={() => handleSendWhatsApp(rota.id)}
                    >
                      <IconWhatsApp className="size-3.5" />
                      WhatsApp
                    </Button>
                    <Button
                      size="sm"
                      variant="copy"
                      isLoading={duplicateMutation.isPending}
                      onClick={() => duplicateMutation.mutate(rota.id)}
                    >
                      Duplicar
                    </Button>
                    {canDelete ? (
                      <Button
                        size="sm"
                        variant="danger"
                        isLoading={deleteMutation.isPending}
                        onClick={() => deleteMutation.mutate(rota.id)}
                      >
                        Excluir
                      </Button>
                    ) : null}
                  </div>
                </article>
              )})}
            </div>
          )}

          {meta && meta.totalPages > 1 ? (
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              onPageChange={setPage}
            />
          ) : null}
        </CardContent>
      </Card>

      <WhatsAppSendModal
        open={sendModalOpen}
        onClose={() => {
          setSendModalOpen(false)
          setSendPayload(null)
        }}
        payload={sendPayload}
      />
    </>
  )
}
