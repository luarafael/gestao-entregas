import { useState } from 'react'
import {
  STATUS_COLORS,
  STATUS_LABELS,
  type StatusExecucao,
} from '@/features/routing/utils/executionStatus'
import {
  formatDistance,
  formatDuration,
} from '@/features/routing/utils/googleMapsUrl'
import { IconMapPin } from '@/shared/components/icons'
import { Badge, Card, MetaChip } from '@/shared/components/ui'
import { ProfileAvatar } from '@/features/auth/components/ProfileAvatar'
import { cn } from '@/shared/utils/cn'
import { formatTimeBR } from '@/shared/utils/format'
import type { MonitoramentoParada, MonitoramentoRota } from '../types'

function StatusBadge({ status }: { status: StatusExecucao }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        STATUS_COLORS[status].badge,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}

function StatBlock({
  label,
  value,
  tone,
}: {
  label: string
  value: string | number
  tone: 'slate' | 'blue' | 'emerald' | 'amber'
}) {
  const tones = {
    slate: 'bg-slate-500/10',
    blue: 'bg-blue-500/10',
    emerald: 'bg-emerald-500/10',
    amber: 'bg-amber-500/10',
  }

  return (
    <div className={cn('rounded-xl px-3 py-2.5', tones[tone])}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  )
}

function ProximaParadaHighlight({
  proxima,
  isPlanejada,
}: {
  proxima: NonNullable<MonitoramentoRota['proximaParada']>
  isPlanejada: boolean
}) {
  const isEmRota = proxima.status === 'EM_ROTA'

  return (
    <div className="rounded-2xl bg-linear-to-br from-blue-500/15 to-blue-500/5 p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-300">
        <IconMapPin className="size-3.5" />
        {isPlanejada
          ? 'Primeira parada'
          : isEmRota
            ? 'Entrega em andamento'
            : 'Próxima entrega'}
      </div>

      <div className="space-y-2">
        <MetaChip
          tone="client"
          className="max-w-full text-sm font-semibold"
          title={proxima.cliente ?? undefined}
        >
          {proxima.cliente?.trim() || 'Sem nome'}
        </MetaChip>

        <MetaChip tone="address" className="w-full items-start whitespace-normal">
          <span className="line-clamp-2 text-left leading-relaxed">
            {[proxima.endereco, proxima.bairro].filter(Boolean).join(' — ')}
          </span>
        </MetaChip>

        {(proxima.distancia != null || proxima.tempo != null) && (
          <MetaChip tone="time" className="w-fit">
            {proxima.distancia != null ? formatDistance(proxima.distancia) : '—'} ·{' '}
            {proxima.tempo != null ? formatDuration(proxima.tempo) : '—'}
          </MetaChip>
        )}
      </div>
    </div>
  )
}

function ParadaTimelineItem({
  parada,
  isLast,
}: {
  parada: MonitoramentoParada
  isLast: boolean
}) {
  const isActive = parada.status === 'EM_ROTA'
  const markerColor = STATUS_COLORS[parada.status].marker

  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center pt-1">
        <div
          className={cn(
            'z-10 size-3.5 shrink-0 rounded-full ring-4 ring-card/80',
            isActive && 'size-4 animate-pulse',
          )}
          style={{ backgroundColor: markerColor }}
        />
        {!isLast ? (
          <div className="mt-1 w-px flex-1 bg-border/70" aria-hidden />
        ) : null}
      </div>

      <div
        className={cn(
          'mb-4 min-w-0 flex-1 rounded-xl border p-3.5',
          STATUS_COLORS[parada.status].row,
          isActive ? 'bg-blue-500/5 shadow-sm shadow-blue-500/10' : 'bg-surface/20',
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="default" className="tabular-nums">
            #{parada.ordem}
          </Badge>
          <StatusBadge status={parada.status} />
          {parada.dataHoraStatus ? (
            <MetaChip tone="time" className="w-fit">
              {formatTimeBR(parada.dataHoraStatus)}
            </MetaChip>
          ) : null}
        </div>

        <div className="mt-2 space-y-2">
          <MetaChip
            tone="client"
            className="max-w-full font-medium"
            title={parada.cliente ?? undefined}
          >
            {parada.cliente?.trim() || 'Sem nome'}
          </MetaChip>

          <MetaChip tone="address" className="w-full items-start whitespace-normal">
            <span className="line-clamp-2 text-left leading-relaxed">
              {[parada.endereco, parada.bairro].filter(Boolean).join(' — ')}
            </span>
          </MetaChip>

          {parada.telefone ? (
            <MetaChip tone="phone" className="tabular-nums">
              {parada.telefone}
            </MetaChip>
          ) : null}

          {parada.statusObservacao ? (
            <p className="rounded-lg bg-amber-500/10 px-2 py-1 text-xs text-amber-200">
              {parada.statusObservacao}
            </p>
          ) : null}

          {(parada.distancia != null || parada.tempo != null) && (
            <MetaChip tone="time" className="w-fit">
              {parada.distancia != null ? formatDistance(parada.distancia) : '—'} ·{' '}
              {parada.tempo != null ? formatDuration(parada.tempo) : '—'}
            </MetaChip>
          )}
        </div>
      </div>
    </div>
  )
}

export function MonitoramentoRotaCard({ rota }: { rota: MonitoramentoRota }) {
  const [showAllStops, setShowAllStops] = useState(false)
  const proxima = rota.proximaParada
  const isRotaPlanejada =
    rota.stats.pendentes === rota.totalParadas && rota.totalParadas > 0
  const isConcluida =
    rota.stats.entregues === rota.totalParadas && rota.totalParadas > 0

  const visibleParadas = showAllStops ? rota.paradas : rota.paradas.slice(0, 4)
  const hiddenCount = rota.paradas.length - visibleParadas.length

  return (
    <Card glass={false} className="overflow-hidden border-border/60 bg-card/80 p-0">
      <div className="border-b border-border/60 bg-surface/25 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            {rota.motoboyId ? (
              <ProfileAvatar
                userId={rota.motoboyId}
                nome={rota.motoboyNome}
                fotoUrl={rota.motoboyFotoPerfil}
                size="md"
              />
            ) : (
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-sm font-semibold text-primary">
                ?
              </div>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold tracking-tight">
                  {rota.motoboyNome}
                </h3>
                {isRotaPlanejada ? (
                  <Badge variant="warning">Planejada</Badge>
                ) : isConcluida ? (
                  <Badge variant="success">Concluída</Badge>
                ) : (
                  <Badge variant="success">Em execução</Badge>
                )}
              </div>
              <div className="mt-1">
                <MetaChip
                  tone="address"
                  className="max-w-full items-start whitespace-normal"
                  title={rota.enderecoInicial}
                >
                  <span className="line-clamp-2 text-left leading-relaxed">
                    {rota.enderecoInicial}
                  </span>
                </MetaChip>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-3xl font-semibold tabular-nums text-emerald-400">
              {rota.stats.percentual}%
            </p>
            <p className="text-xs text-muted-foreground">
              {rota.stats.entregues} de {rota.totalParadas} entregas
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="h-2.5 overflow-hidden rounded-full bg-surface/60">
            <div
              className="h-full rounded-full bg-linear-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
              style={{ width: `${Math.max(rota.stats.percentual, 4)}%` }}
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatBlock
            label="Restante"
            value={formatDistance(rota.distanciaRestante)}
            tone="slate"
          />
          <StatBlock
            label="Tempo est."
            value={formatDuration(rota.tempoRestante)}
            tone="blue"
          />
          <StatBlock
            label="Em rota"
            value={rota.stats.emRota}
            tone="blue"
          />
          <StatBlock
            label="Pendentes"
            value={rota.stats.pendentes}
            tone="amber"
          />
        </div>
      </div>

      <div className="space-y-5 px-5 py-5 sm:px-6">
        {proxima ? (
          <ProximaParadaHighlight proxima={proxima} isPlanejada={isRotaPlanejada} />
        ) : isConcluida ? (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-center text-sm font-medium text-emerald-300">
            Todas as entregas desta rota foram concluídas
          </div>
        ) : null}

        <div>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Paradas da rota
            </h4>
            <span className="text-xs text-muted-foreground">
              {rota.totalParadas} no total
            </span>
          </div>

          <div>
            {visibleParadas.map((parada, index) => (
              <ParadaTimelineItem
                key={parada.paradaId}
                parada={parada}
                isLast={index === visibleParadas.length - 1 && hiddenCount === 0}
              />
            ))}
          </div>

          {hiddenCount > 0 ? (
            <button
              type="button"
              onClick={() => setShowAllStops(true)}
              className="w-full rounded-xl border border-border/60 bg-surface/20 px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface/40 hover:text-foreground"
            >
              Ver mais {hiddenCount} parada(s)
            </button>
          ) : showAllStops && rota.paradas.length > 4 ? (
            <button
              type="button"
              onClick={() => setShowAllStops(false)}
              className="w-full rounded-xl border border-border/60 bg-surface/20 px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface/40 hover:text-foreground"
            >
              Mostrar menos
            </button>
          ) : null}
        </div>
      </div>
    </Card>
  )
}
