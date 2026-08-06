import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  StatCardSkeleton,
} from '@/shared/components/ui'
import { IconClock, IconPackage, IconWallet } from '@/shared/components/icons'
import { formatCurrency } from '@/shared/utils/cn'
import { formatDateBR, formatTimeBR } from '@/shared/utils/format'
import { useMotoboyResumo } from '../hooks/useMotoboyResumo'

export function MeuDiaPage() {
  const resumoQuery = useMotoboyResumo()
  const resumo = resumoQuery.data

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Meu dia</h2>
        <p className="text-sm text-muted-foreground">
          Acompanhe suas entregas, ganhos e pendências de repasse com o
          administrador.
        </p>
      </div>

      {resumoQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <StatCardSkeleton key={index} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <SummaryCard
            title="Entregas hoje"
            value={String(resumo?.entregasHoje ?? 0)}
            description={resumo?.data ? formatDateBR(resumo.data) : 'Hoje'}
            icon={<IconPackage className="size-5" />}
          />
          <SummaryCard
            title="Valor a receber"
            value={formatCurrency(resumo?.valorRecebidoHoje ?? 0)}
            description="Corridas não pagas pelo cliente"
            icon={<IconWallet className="size-5" />}
            highlight
          />
          <SummaryCard
            title="Repasse pendente"
            value={formatCurrency(resumo?.valorPendenciasAbertas ?? 0)}
            description={`${resumo?.pendenciasAbertas ?? 0} pendência(s) com o admin`}
            icon={<IconClock className="size-5" />}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-3">
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Entregas de hoje</CardTitle>
        </CardHeader>
        <CardContent>
          {resumoQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-12 animate-pulse rounded-xl bg-surface/50"
                />
              ))}
            </div>
          ) : !resumo?.entregas.length ? (
            <EmptyState
              icon={<IconPackage className="size-6" />}
              title="Nenhuma entrega hoje"
              description="Cadastre sua primeira entrega do dia."
            />
          ) : (
            <div className="space-y-3">
              {resumo.entregas.map((entrega) => (
                <div
                  key={entrega.id}
                  className="flex flex-col gap-1 rounded-xl border border-border/60 bg-surface/30 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">
                      {entrega.nomeCliente || entrega.endereco}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {entrega.bairro} · {formatTimeBR(entrega.horario)}
                    </p>
                  </div>
                  <p className="font-semibold text-primary">
                    {formatCurrency(Number(entrega.valorEntrega))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryCard({
  title,
  value,
  description,
  icon,
  highlight = false,
}: {
  title: string
  value: string
  description: string
  icon: ReactNode
  highlight?: boolean
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p
              className={
                highlight
                  ? 'mt-2 text-2xl font-semibold text-primary'
                  : 'mt-2 text-2xl font-semibold'
              }
            >
              {value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-surface/40 p-2 text-muted-foreground">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
