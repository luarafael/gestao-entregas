import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  MetaChip,
  MetaField,
  MetaSectionTitle,
  PAGE_CARD_SECTION,
} from '@/shared/components/ui'
import { IconRoute, IconTrending } from '@/shared/components/icons'
import { cn, formatCurrency } from '@/shared/utils/cn'
import type { PlannerStop } from '../schemas/routing.schema'
import { formatDistance, formatDuration } from '../utils/googleMapsUrl'
import { STATUS_COLORS, getStopStatus } from '../utils/executionStatus'

export interface RouteCompletedSummary {
  totalEntregas: number
  entregues: number
  distanciaTotal: number
  tempoTotal: number
  valorTotal: number
  enderecoPartida: string
  aproximada?: boolean
}

interface ProximaParadaCardProps {
  stop: PlannerStop | null
  completedSummary?: RouteCompletedSummary | null
  onCopyMessage?: () => void
  isCopying?: boolean
}

export function ProximaParadaCard({
  stop,
  completedSummary,
  onCopyMessage,
  isCopying = false,
}: ProximaParadaCardProps) {
  if (completedSummary) {
    return (
      <Card glass className="min-w-0 overflow-hidden border border-emerald-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-300">
            <IconTrending className="size-4" aria-hidden />
            Rota concluída
          </CardTitle>
        </CardHeader>
        <CardContent className="min-w-0 space-y-3">
          <p className="text-sm text-muted-foreground">
            Todas as entregas foram realizadas. Resumo final da rota:
          </p>

          <div className={cn(PAGE_CARD_SECTION, 'grid min-w-0 gap-3 sm:grid-cols-2')}>
            <MetaField label="Entregas">
              <MetaChip tone="delivery" className="w-fit tabular-nums">
                {completedSummary.entregues}/{completedSummary.totalEntregas}
              </MetaChip>
            </MetaField>
            <MetaField label="Distância total">
              <MetaChip tone="time" className="w-fit">
                {formatDistance(completedSummary.distanciaTotal)}
                {completedSummary.aproximada ? ' (aprox.)' : ''}
              </MetaChip>
            </MetaField>
            <MetaField label="Tempo total">
              <MetaChip tone="time" className="w-fit">
                {formatDuration(completedSummary.tempoTotal)}
              </MetaChip>
            </MetaField>
            {completedSummary.valorTotal > 0 ? (
              <MetaField label="Valor das entregas">
                <MetaChip tone="money" className="w-fit tabular-nums">
                  {formatCurrency(completedSummary.valorTotal)}
                </MetaChip>
              </MetaField>
            ) : null}
          </div>

          {completedSummary.enderecoPartida.trim() ? (
            <div className="min-w-0 space-y-1">
              <MetaSectionTitle tone="address">Partida inicial</MetaSectionTitle>
              <MetaChip tone="address" className="w-full items-start whitespace-normal">
                <span className="line-clamp-2 text-left leading-relaxed">
                  {completedSummary.enderecoPartida}
                </span>
              </MetaChip>
            </div>
          ) : null}

          {onCopyMessage ? (
            <Button
              variant="copy"
              size="sm"
              className="w-full sm:w-auto"
              onClick={onCopyMessage}
              isLoading={isCopying}
            >
              Copiar mensagem
            </Button>
          ) : null}
        </CardContent>
      </Card>
    )
  }

  if (!stop) {
    return (
      <Card glass className="min-w-0 overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconRoute className="size-4 text-blue-500" aria-hidden />
            Próxima parada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Não há paradas pendentes no momento.
          </p>
        </CardContent>
      </Card>
    )
  }

  const status = getStopStatus(stop)
  const colors = STATUS_COLORS[status]
  const enderecoLabel = [stop.endereco, stop.bairro].filter(Boolean).join(' — ')

  return (
    <Card glass className={cn('min-w-0 overflow-hidden border', colors.row)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconRoute className="size-4 text-blue-500" aria-hidden />
          Próxima parada
        </CardTitle>
      </CardHeader>
      <CardContent className="min-w-0 space-y-2">
        <MetaChip
          tone="client"
          className="max-w-full text-sm font-semibold"
          title={stop.cliente ?? undefined}
        >
          {stop.cliente?.trim() || 'Sem nome'}
        </MetaChip>

        <MetaChip
          tone="address"
          className="w-full items-start whitespace-normal"
        >
          <span className="line-clamp-2 text-left leading-relaxed">
            {enderecoLabel}
          </span>
        </MetaChip>

        {stop.telefone ? (
          <MetaChip tone="phone" className="tabular-nums">
            {stop.telefone}
          </MetaChip>
        ) : null}

        {stop.distancia != null || stop.tempo != null ? (
          <MetaChip tone="time" className="w-fit font-medium">
            {stop.distancia != null ? formatDistance(stop.distancia) : '—'} ·{' '}
            {stop.tempo != null ? formatDuration(stop.tempo) : '—'}
          </MetaChip>
        ) : null}
      </CardContent>
    </Card>
  )
}
