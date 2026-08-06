import { useState } from 'react'
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  StatCardSkeleton,
} from '@/shared/components/ui'
import { IconEye, IconRoute } from '@/shared/components/icons'
import { formatCurrency } from '@/shared/utils/cn'
import { formatDateBR, formatTimeBR } from '@/shared/utils/format'
import { getTodayInputDate } from '@/features/accounting/schemas/prestacao.schema'
import { useMonitoramento } from '../hooks/useMonitoramento'
import { MonitoramentoRotaCard } from '../components/MonitoramentoRotaCard'

export function MonitoramentoPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayInputDate())
  const monitoramentoQuery = useMonitoramento(selectedDate)
  const monitoramento = monitoramentoQuery.data

  const hasRotas = (monitoramento?.rotas.length ?? 0) > 0
  const hasAvulsas = (monitoramento?.entregasAvulsas.length ?? 0) > 0
  const isEmpty = monitoramento && !hasRotas && !hasAvulsas

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Monitoramento
          </h2>
          <p className="text-sm text-muted-foreground">
            Acompanhe em tempo real o status de cada parada conforme o motoboy
            executa a rota.
          </p>
        </div>

        <div className="w-full sm:w-56">
          <Input
            label="Data"
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
        </div>
      </div>

      {monitoramentoQuery.isLoading ? (
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
              {monitoramento?.resumo.totalRotas ?? 0} rota(s)
            </Badge>
            <Badge variant="default">
              {monitoramento?.resumo.totalParadas ?? 0} paradas
            </Badge>
            <Badge variant="default">
              {monitoramento?.resumo.entregues ?? 0} entregues
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
                  ? `Nenhuma rota planejada em ${formatDateBR(monitoramento.data)}.`
                  : 'Nenhuma rota para a data selecionada.'
              }
            />
          ) : (
            <div className="space-y-6">
              {hasRotas ? (
                <section className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Rotas em execução
                  </h3>
                  {monitoramento?.rotas.map((rota) => (
                    <MonitoramentoRotaCard key={rota.rotaId} rota={rota} />
                  ))}
                </section>
              ) : null}

              {hasAvulsas ? (
                <section className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Entregas fora de rota
                  </h3>
                  {monitoramento?.entregasAvulsas.map((grupo) => (
                    <Card key={grupo.motoboyId ?? 'sem-motoboy'}>
                      <CardHeader className="flex flex-row items-center justify-between gap-3">
                        <CardTitle className="text-base">
                          {grupo.motoboyNome}
                        </CardTitle>
                        <div className="text-right text-sm">
                          <p className="font-medium">
                            {grupo.totalEntregas} entrega(s)
                          </p>
                          <p className="text-muted-foreground">
                            {formatCurrency(grupo.valorTotal)}
                          </p>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {grupo.entregas.map((entrega) => (
                          <div
                            key={entrega.id}
                            className="flex flex-col gap-1 rounded-xl border border-border/60 bg-surface/30 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="font-medium">
                                {entrega.nomeCliente ?? 'Sem nome'} —{' '}
                                {entrega.bairro}
                              </p>
                              <p className="text-muted-foreground">
                                {entrega.endereco}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatTimeBR(entrega.horario)}
                                {entrega.pagoPeloCliente
                                  ? ' · pago pelo cliente'
                                  : ''}
                              </p>
                            </div>
                            <p className="font-medium">
                              {formatCurrency(entrega.valorEntrega)}
                            </p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </section>
              ) : null}
            </div>
          )}
        </>
      )}
    </div>
  )
}
