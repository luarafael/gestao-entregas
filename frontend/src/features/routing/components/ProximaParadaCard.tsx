import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  MetaChip,
} from '@/shared/components/ui'
import { IconRoute } from '@/shared/components/icons'
import { cn } from '@/shared/utils/cn'
import type { PlannerStop } from '../schemas/routing.schema'
import { formatDistance, formatDuration } from '../utils/googleMapsUrl'
import { STATUS_COLORS, getStopStatus } from '../utils/executionStatus'

interface ProximaParadaCardProps {
  stop: PlannerStop | null
}

export function ProximaParadaCard({ stop }: ProximaParadaCardProps) {
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
            Todas as entregas foram concluídas ou não há paradas pendentes.
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
