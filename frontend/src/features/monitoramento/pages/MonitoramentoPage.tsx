import { useState } from 'react'
import {
  EmptyState,
  Input,
  Skeleton,
} from '@/shared/components/ui'
import { IconEye, IconRoute } from '@/shared/components/icons'
import {
  MotoboySelect,
  type MotoboySelectValue,
} from '@/shared/components/MotoboySelect'
import { formatDateBR, formatTimeBR } from '@/shared/utils/format'
import { getTodayInputDate } from '@/features/accounting/schemas/prestacao.schema'
import { useMonitoramento } from '../hooks/useMonitoramento'
import { useMonitoramentoDeliveryAlerts } from '../hooks/useMonitoramentoDeliveryAlerts'
import { MonitoramentoRotaCard } from '../components/MonitoramentoRotaCard'
import { MonitoramentoHistoricoSection } from '../components/MonitoramentoHistoricoSection'
import { MonitoramentoResumoBar } from '../components/MonitoramentoResumoBar'

function MonitoramentoCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/80">
      <div className="space-y-4 border-b border-border/60 bg-surface/25 px-6 py-5">
        <div className="flex gap-3">
          <Skeleton className="size-11 rounded-2xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
        </div>
        <Skeleton className="h-2.5 w-full rounded-full" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="space-y-4 px-6 py-5">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    </div>
  )
}

export function MonitoramentoPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayInputDate())
  const [motoboyFilter, setMotoboyFilter] = useState<MotoboySelectValue>('')
  const motoboyId = motoboyFilter || undefined

  const monitoramentoQuery = useMonitoramento(selectedDate, motoboyId)
  const monitoramento = monitoramentoQuery.data

  useMonitoramentoDeliveryAlerts(monitoramento, motoboyId)

  const hasRotasAtivas = (monitoramento?.rotas.length ?? 0) > 0
  const hasHistorico = (monitoramento?.historico.length ?? 0) > 0
  const isEmpty = monitoramento && !hasRotasAtivas && !hasHistorico

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Monitoramento
          </h2>
          <p className="text-sm text-muted-foreground">
            Acompanhe em tempo real a rota do motoboy selecionado.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-end">
          <MotoboySelect
            id="monitoramento-motoboy"
            value={motoboyFilter}
            onChange={setMotoboyFilter}
            allowAll={false}
            label="Motoboy"
          />
          <div className="w-full sm:w-56">
            <Input
              label="Data"
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </div>
        </div>
      </div>

      {!motoboyId ? (
        <EmptyState
          icon={<IconEye className="size-6" />}
          title="Selecione um motoboy"
          description="Escolha o funcionário para ver o andamento da rota de hoje."
        />
      ) : monitoramentoQuery.isLoading ? (
        <MonitoramentoCardSkeleton />
      ) : monitoramentoQuery.isError ? (
        <EmptyState
          icon={<IconEye className="size-6" />}
          title="Erro ao carregar monitoramento"
          description="Verifique se a API está rodando e tente novamente."
        />
      ) : (
        <>
          {monitoramento && (hasRotasAtivas || hasHistorico) ? (
            <MonitoramentoResumoBar
              resumo={monitoramento.resumo}
              atualizadoEm={monitoramento.atualizadoEm}
              isFetching={monitoramentoQuery.isFetching}
              formatTime={formatTimeBR}
            />
          ) : null}

          {isEmpty ? (
            <EmptyState
              icon={<IconRoute className="size-6" />}
              title="Nenhuma rota hoje"
              description={
                monitoramento?.data
                  ? `${formatDateBR(monitoramento.data)} — este motoboy ainda não registrou rota calculada.`
                  : 'Nenhuma rota para a data selecionada.'
              }
            />
          ) : (
            <div className="space-y-6">
              {hasRotasAtivas ? (
                <section className="space-y-4">
                  {monitoramento?.rotas.map((rota) => (
                    <MonitoramentoRotaCard key={rota.rotaId} rota={rota} />
                  ))}
                </section>
              ) : (
                <EmptyState
                  icon={<IconRoute className="size-6" />}
                  title="Nenhuma corrida ativa agora"
                  description="As rotas de hoje já foram concluídas. Confira o histórico abaixo."
                />
              )}

              {hasHistorico ? (
                <MonitoramentoHistoricoSection
                  rotas={monitoramento?.historico ?? []}
                />
              ) : null}
            </div>
          )}
        </>
      )}
    </div>
  )
}
