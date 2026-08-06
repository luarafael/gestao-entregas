import { useState } from 'react'
import {
  Badge,
  EmptyState,
  Input,
  StatCardSkeleton,
} from '@/shared/components/ui'
import { IconEye, IconRoute } from '@/shared/components/icons'
import {
  MotoboySelect,
  type MotoboySelectValue,
} from '@/shared/components/MotoboySelect'
import { formatDateBR, formatTimeBR } from '@/shared/utils/format'
import { getTodayInputDate } from '@/features/accounting/schemas/prestacao.schema'
import { useMonitoramento } from '../hooks/useMonitoramento'
import { MonitoramentoRotaCard } from '../components/MonitoramentoRotaCard'
import { MonitoramentoHistoricoSection } from '../components/MonitoramentoHistoricoSection'

export function MonitoramentoPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayInputDate())
  const [motoboyFilter, setMotoboyFilter] = useState<MotoboySelectValue>('')
  const motoboyId = motoboyFilter || undefined

  const monitoramentoQuery = useMonitoramento(selectedDate, motoboyId)
  const monitoramento = monitoramentoQuery.data

  const hasRotasAtivas = (monitoramento?.rotas.length ?? 0) > 0
  const hasHistorico = (monitoramento?.historico.length ?? 0) > 0
  const isEmpty = monitoramento && !hasRotasAtivas && !hasHistorico

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Monitoramento
          </h2>
          <p className="text-sm text-muted-foreground">
            Selecione um motoboy para acompanhar a corrida em tempo real. Sem
            visão geral consolidada.
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
          description="O monitoramento é individual. Escolha o funcionário para ver a rota em andamento."
        />
      ) : monitoramentoQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <StatCardSkeleton key={index} />
          ))}
        </div>
      ) : monitoramentoQuery.isError ? (
        <EmptyState
          icon={<IconEye className="size-6" />}
          title="Erro ao carregar monitoramento"
          description="Verifique se a API está rodando e tente novamente."
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="success">
              {monitoramento?.resumo.totalRotas ?? 0} em andamento
            </Badge>
            {hasRotasAtivas ? (
              <>
                <Badge variant="default">
                  {monitoramento?.resumo.totalParadas ?? 0} paradas
                </Badge>
                {(monitoramento?.resumo.emRota ?? 0) > 0 ? (
                  <Badge className="border-blue-500/40 bg-blue-500/15 text-blue-300">
                    {monitoramento?.resumo.emRota} em rota
                  </Badge>
                ) : null}
                {(monitoramento?.resumo.problemas ?? 0) > 0 ? (
                  <Badge className="border-red-500/40 bg-red-500/15 text-red-300">
                    {monitoramento?.resumo.problemas} problema(s)
                  </Badge>
                ) : null}
              </>
            ) : null}
            {hasHistorico ? (
              <Badge variant="default">
                {monitoramento?.resumo.rotasConcluidas} concluída(s)
              </Badge>
            ) : null}
            {monitoramento?.atualizadoEm ? (
              <span className="text-xs text-muted-foreground">
                Atualizado às {formatTimeBR(monitoramento.atualizadoEm)}
              </span>
            ) : null}
            {monitoramentoQuery.isFetching ? (
              <span className="text-xs text-muted-foreground">
                Atualizando...
              </span>
            ) : null}
          </div>

          {isEmpty ? (
            <EmptyState
              icon={<IconRoute className="size-6" />}
              title="Nenhuma rota em execução"
              description={
                monitoramento?.data
                  ? `Nenhuma corrida ativa deste motoboy em ${formatDateBR(monitoramento.data)}.`
                  : 'Nenhuma corrida ativa para a data selecionada.'
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
                  description="Todas as rotas deste motoboy no dia já foram concluídas. Veja o histórico abaixo."
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
