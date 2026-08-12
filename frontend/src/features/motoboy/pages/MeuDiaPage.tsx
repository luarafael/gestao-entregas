import { Link } from 'react-router-dom'
import {
  Badge,
  Button,
  EmptyState,
  MetaChip,
  PAGE_CARD_ARTICLE,
  PagePanel,
  PageShell,
  StatCard,
  StatCardSkeleton,
  TableSkeleton,
} from '@/shared/components/ui'
import { IconClock, IconPackage, IconWallet } from '@/shared/components/icons'
import { cn, formatCurrency } from '@/shared/utils/cn'
import { formatDateBR, formatTimeBR } from '@/shared/utils/format'
import { DeliveryCardHeader } from '@/features/deliveries/components/DeliveryCardChips'
import { FormaPagamentoBadge } from '@/features/deliveries/components/FormaPagamentoBadge'
import { useMotoboyResumo } from '../hooks/useMotoboyResumo'

export function MeuDiaPage() {
  const resumoQuery = useMotoboyResumo()
  const resumo = resumoQuery.data

  return (
    <PageShell>
      <section className="min-w-0">
        <div className="mb-4 min-w-0">
          <h2 className="text-2xl font-semibold tracking-tight">Meu dia</h2>
          <p className="text-sm text-muted-foreground">
            Acompanhe suas entregas, ganhos e pendências de repasse com o
            administrador.
          </p>
        </div>

        {resumoQuery.isLoading ? (
          <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <StatCardSkeleton key={index} />
            ))}
          </div>
        ) : (
          <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              title="Entregas hoje"
              value={String(resumo?.entregasHoje ?? 0)}
              description={resumo?.data ? formatDateBR(resumo.data) : 'Hoje'}
              icon={<IconPackage className="size-5" />}
              accent="primary"
              delay={0}
            />
            <StatCard
              title="Valor a receber"
              value={formatCurrency(resumo?.valorRecebidoHoje ?? 0)}
              description="Corridas não pagas pelo cliente"
              icon={<IconWallet className="size-5" />}
              accent="success"
              delay={0.05}
            />
            <StatCard
              title="Pendências"
              value={formatCurrency(resumo?.valorPendenciasAbertas ?? 0)}
              description={`${resumo?.pendenciasAbertas ?? 0} pendência(s) com o admin`}
              icon={<IconClock className="size-5" />}
              accent="warning"
              delay={0.1}
            />
          </div>
        )}
      </section>

      <section className="flex min-w-0 flex-wrap gap-3">
        <Link to="/entregas">
          <Button>Ver entregas</Button>
        </Link>
        <Link to="/pendencias">
          <Button variant="secondary">Registrar repasse pendente</Button>
        </Link>
        <Link to="/minha-prestacao">
          <Button variant="secondary">Enviar prestação do dia</Button>
        </Link>
        <Link to="/planejador">
          <Button variant="secondary">Planejador de rotas</Button>
        </Link>
      </section>

      <PagePanel density="default" className="min-w-0">
        <div className="mb-1 min-w-0">
          <h3 className="text-lg font-semibold tracking-tight">
            Entregas de hoje
          </h3>
          <p className="text-sm text-muted-foreground">
            Resumo das corridas registradas no dia.
          </p>
        </div>

        {resumoQuery.isLoading ? (
          <TableSkeleton rows={3} />
        ) : !resumo?.entregas.length ? (
          <EmptyState
            icon={<IconPackage className="size-6" />}
            title="Nenhuma entrega hoje"
            description="Cadastre sua primeira entrega do dia."
          />
        ) : (
          <div className="min-w-0 space-y-3">
            {resumo.entregas.map((entrega) => {
              const endereco = [entrega.endereco, entrega.bairro, entrega.cidade]
                .filter(Boolean)
                .join(' — ')

              return (
                <article key={entrega.id} className={cn(PAGE_CARD_ARTICLE)}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <DeliveryCardHeader
                      horario={formatTimeBR(entrega.horario)}
                      nomeCliente={entrega.nomeCliente}
                      telefone={entrega.telefoneCliente}
                      endereco={endereco}
                    />

                    <div className="flex w-full shrink-0 flex-col items-stretch gap-2 sm:w-auto sm:items-end">
                      <MetaChip
                        tone="money"
                        className="justify-center tabular-nums"
                      >
                        {formatCurrency(Number(entrega.valorEntrega))}
                      </MetaChip>
                      {entrega.formaPagamento ? (
                        <FormaPagamentoBadge
                          value={entrega.formaPagamento}
                          className="w-full py-1 text-xs sm:w-auto"
                        />
                      ) : null}
                      {entrega.pagoPeloCliente ? (
                        <Badge variant="warning" className="text-[10px]">
                          Pago pelo cliente
                        </Badge>
                      ) : null}
                      {entrega.valorProduto ? (
                        <MetaChip
                          tone="product"
                          className="justify-center tabular-nums"
                        >
                          Produto:{' '}
                          {formatCurrency(Number(entrega.valorProduto))}
                        </MetaChip>
                      ) : null}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </PagePanel>
    </PageShell>
  )
}
