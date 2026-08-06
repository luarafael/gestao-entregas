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
import { IconEye, IconPackage } from '@/shared/components/icons'
import { formatCurrency } from '@/shared/utils/cn'
import { formatDateBR, formatTimeBR } from '@/shared/utils/format'
import { getTodayInputDate } from '@/features/accounting/schemas/prestacao.schema'
import { useMonitoramento } from '../hooks/useMonitoramento'

export function MonitoramentoPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayInputDate())
  const monitoramentoQuery = useMonitoramento(selectedDate)
  const monitoramento = monitoramentoQuery.data

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Monitoramento
          </h2>
          <p className="text-sm text-muted-foreground">
            Acompanhe as entregas dos motoboys em tempo quase real.
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
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="success">
              {monitoramento?.totalEntregas ?? 0} entregas hoje
            </Badge>
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

          {monitoramento?.grupos.length === 0 ? (
            <EmptyState
              icon={<IconPackage className="size-6" />}
              title="Nenhuma entrega registrada"
              description={
                monitoramento?.data
                  ? `Nenhuma entrega em ${formatDateBR(monitoramento.data)}.`
                  : 'Nenhuma entrega para a data selecionada.'
              }
            />
          ) : (
            <div className="space-y-4">
              {monitoramento?.grupos.map((grupo) => (
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
                            {formatTimeBR(entrega.horario)}
                            {entrega.pagoPeloCliente
                              ? ' · pago pelo cliente'
                              : ''}
                          </p>
                        </div>
                        <p className="font-medium">
                          {formatCurrency(Number(entrega.valorEntrega))}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
