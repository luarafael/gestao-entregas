import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui'
import type { PlannerStop } from '../schemas/routing.schema'
import { formatDistance, formatDuration } from '../utils/googleMapsUrl'
import { STATUS_COLORS, getStopStatus } from '../utils/executionStatus'

interface ProximaParadaCardProps {
  stop: PlannerStop | null
}

export function ProximaParadaCard({ stop }: ProximaParadaCardProps) {
  if (!stop) {
    return (
      <Card glass>
        <CardHeader>
          <CardTitle>Próxima parada</CardTitle>
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

  return (
    <Card glass className={`border ${colors.row}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-blue-400">🔵</span>
          Próxima parada
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="text-lg font-semibold">
          {stop.cliente?.trim() || 'Sem nome'}
        </p>
        <p className="text-muted-foreground">{stop.endereco}</p>
        {stop.bairro ? <p>Bairro: {stop.bairro}</p> : null}
        {stop.telefone ? <p>Telefone: {stop.telefone}</p> : null}
        {stop.distancia != null || stop.tempo != null ? (
          <p className="font-medium text-foreground">
            {stop.distancia != null ? formatDistance(stop.distancia) : '—'} ·{' '}
            {stop.tempo != null ? formatDuration(stop.tempo) : '—'}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
