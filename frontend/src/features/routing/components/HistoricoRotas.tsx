import { useState } from 'react'
import { Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Pagination, TableSkeleton } from '@/shared/components/ui'
import { IconRoute, IconWhatsApp } from '@/shared/components/icons'
import { formatDateBR } from '@/shared/utils/format'
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
import {
  buildRouteWhatsAppPayload,
  formatRouteWhatsAppText,
} from '../utils/whatsappRouteMessage'
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
  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [sendPayload, setSendPayload] = useState<WhatsAppSendPayload | null>(null)
  const historyQuery = useRouteHistory(page)
  const deleteMutation = useDeleteRoute()
  const duplicateMutation = useDuplicateRoute()
  const canDelete = useIsAdmin()

  const items = historyQuery.data?.data ?? []
  const meta = historyQuery.data?.meta

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
      <Card glass>
        <CardHeader>
          <CardTitle>Histórico de rotas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
              {items.map((rota) => (
                <div
                  key={rota.id}
                  className="rounded-xl border border-border/50 bg-surface/20 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {formatDateBR(rota.data)} · {rota.paradas.length} paradas
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {rota.enderecoInicial}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDistance(Number(rota.distanciaTotal))} ·{' '}
                        {formatDuration(rota.tempoTotal)}
                        {rota.aproximada ? ' · aproximada' : ''}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={async () => {
                          const full = await routingService.getById(rota.id)
                          onLoadRoute(full)
                        }}
                      >
                        Visualizar / Planejar
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        isLoading={sendingId === rota.id}
                        onClick={() => handleSendWhatsApp(rota.id)}
                      >
                        <IconWhatsApp className="mr-1 size-4" />
                        WhatsApp
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
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
                  </div>
                </div>
              ))}
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
