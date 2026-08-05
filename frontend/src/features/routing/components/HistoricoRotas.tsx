import { Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Pagination, TableSkeleton } from '@/shared/components/ui'
import { IconRoute } from '@/shared/components/icons'
import { formatDateBR } from '@/shared/utils/format'
import {
  useDeleteRoute,
  useDuplicateRoute,
  useRouteHistory,
} from '../hooks/useRouting'
import { formatDistance, formatDuration } from '../utils/googleMapsUrl'
import type { RotaPlanejada } from '../schemas/routing.schema'
import { useState } from 'react'

interface HistoricoRotasProps {
  onLoadRoute: (rota: RotaPlanejada) => void
}

export function HistoricoRotas({ onLoadRoute }: HistoricoRotasProps) {
  const [page, setPage] = useState(1)
  const historyQuery = useRouteHistory(page)
  const deleteMutation = useDeleteRoute()
  const duplicateMutation = useDuplicateRoute()

  const items = historyQuery.data?.data ?? []
  const meta = historyQuery.data?.meta

  return (
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
            description="Calcule e salve uma rota para ver o histórico aqui."
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
                        const full = await import('../services/routing.service').then(
                          (module) => module.routingService.getById(rota.id),
                        )
                        onLoadRoute(full)
                      }}
                    >
                      Visualizar / Planejar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      isLoading={duplicateMutation.isPending}
                      onClick={() => duplicateMutation.mutate(rota.id)}
                    >
                      Duplicar
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      isLoading={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(rota.id)}
                    >
                      Excluir
                    </Button>
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
  )
}
