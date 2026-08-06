import {
  STATUS_COLORS,
  STATUS_LABELS,
  type StatusExecucao,
} from '@/features/routing/utils/executionStatus'
import {
  formatDistance,
  formatDuration,
} from '@/features/routing/utils/googleMapsUrl'
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui'
import { formatTimeBR } from '@/shared/utils/format'
import type { MonitoramentoParada, MonitoramentoRota } from '../types'

function StatusBadge({ status }: { status: StatusExecucao }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status].badge}`}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}

function MetricPill({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-surface/40 px-3 py-2 text-center">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  )
}

function ParadaRow({ parada }: { parada: MonitoramentoParada }) {
  const isEmRota = parada.status === 'EM_ROTA'
  const isEntregue = parada.status === 'ENTREGUE'

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm transition-colors ${STATUS_COLORS[parada.status].row} ${
        isEmRota ? 'bg-blue-500/5' : 'bg-surface/20'
      }`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              #{parada.ordem}
            </span>
            <StatusBadge status={parada.status} />
            {parada.dataHoraStatus ? (
              <span className="text-xs text-muted-foreground">
                {formatTimeBR(parada.dataHoraStatus)}
              </span>
            ) : null}
          </div>
          <p className="font-medium">
            {parada.cliente ?? 'Sem nome'}
            {parada.bairro ? ` — ${parada.bairro}` : ''}
          </p>
          <p className="text-muted-foreground">{parada.endereco}</p>
          {parada.statusObservacao ? (
            <p className="text-xs text-amber-300/90">
              Obs: {parada.statusObservacao}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 gap-2 text-right text-xs sm:flex-col sm:items-end">
          {parada.distancia != null ? (
            <span className="text-muted-foreground">
              {formatDistance(parada.distancia)}
            </span>
          ) : null}
          {parada.tempo != null ? (
            <span className="font-medium">
              {formatDuration(parada.tempo)}
            </span>
          ) : null}
          {isEntregue && parada.distancia == null && parada.tempo == null ? (
            <span className="text-emerald-400">Concluída</span>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function MonitoramentoRotaCard({ rota }: { rota: MonitoramentoRota }) {
  const proxima = rota.proximaParada

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base">{rota.motoboyNome}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Partida: {rota.enderecoInicial}
            </p>
          </div>
          <Badge variant="default">
            {rota.stats.entregues}/{rota.totalParadas} entregues
          </Badge>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progresso da rota</span>
            <span>{rota.stats.percentual}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface/60">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${rota.stats.percentual}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <MetricPill label="Restante" value={formatDistance(rota.distanciaRestante)} />
          <MetricPill label="Tempo est." value={formatDuration(rota.tempoRestante)} />
          <MetricPill label="Em rota" value={String(rota.stats.emRota)} />
          <MetricPill label="Pendentes" value={String(rota.stats.pendentes)} />
        </div>

        {proxima ? (
          <div className="rounded-xl border border-blue-500/40 bg-blue-500/10 px-4 py-3 text-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-blue-300">
              {proxima.status === 'EM_ROTA' ? 'Parada em andamento' : 'Próxima parada'}
            </p>
            <p className="mt-1 font-medium">
              #{proxima.ordem} — {proxima.cliente ?? 'Sem nome'}
            </p>
            <p className="text-muted-foreground">{proxima.endereco}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs">
              {proxima.distancia != null ? (
                <span>{formatDistance(proxima.distancia)} até a parada</span>
              ) : null}
              {proxima.tempo != null ? (
                <span className="font-medium">
                  {formatDuration(proxima.tempo)} estimado
                </span>
              ) : null}
            </div>
          </div>
        ) : rota.stats.entregues === rota.totalParadas && rota.totalParadas > 0 ? (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
            Rota concluída
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-2">
        {rota.paradas.map((parada) => (
          <ParadaRow key={parada.paradaId} parada={parada} />
        ))}
      </CardContent>
    </Card>
  )
}
