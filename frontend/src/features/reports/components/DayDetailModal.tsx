import {
  Button,
  EmptyState,
  MetaChip,
  MetaField,
  Modal,
  PAGE_CARD_ARTICLE,
  TableSkeleton,
} from '@/shared/components/ui'
import { IconPackage } from '@/shared/components/icons'
import { formatCurrency, cn } from '@/shared/utils/cn'
import { formatDateBR, formatTimeBR } from '@/shared/utils/format'
import type { DashboardScope } from '@/features/dashboard/types'
import {
  formatDistance,
  formatDuration,
} from '@/features/routing/utils/googleMapsUrl'
import type { ReportOrigemCadastro } from '../hooks/useReports'
import { useReportDayDetail } from '../hooks/useReports'
import type { ReportDayDetailEntrega } from '@/shared/types/api.types'

const FORMA_PAGAMENTO_LABEL: Record<string, string> = {
  DINHEIRO: 'Dinheiro',
  PIX: 'PIX',
  CARTAO: 'Cartão',
}

interface DayDetailModalProps {
  date: string | null
  scope?: DashboardScope
  motoboyId?: string
  origemCadastro?: ReportOrigemCadastro
  onClose: () => void
}

function formatEndereco(entrega: ReportDayDetailEntrega) {
  return [entrega.endereco, entrega.bairro, entrega.cidade]
    .filter(Boolean)
    .join(' — ')
}

export function DayDetailModal({
  date,
  scope = 'motoboy',
  motoboyId,
  origemCadastro,
  onClose,
}: DayDetailModalProps) {
  const detailQuery = useReportDayDetail(date, motoboyId, origemCadastro)
  const detail = detailQuery.data
  const emptyTitle =
    scope === 'cliente'
      ? 'Nenhum pedido neste dia'
      : 'Nenhuma entrega neste dia'

  return (
    <Modal
      open={Boolean(date)}
      onClose={onClose}
      title={date ? `Detalhe de ${formatDateBR(date)}` : 'Detalhe do dia'}
      description="Entregas, valores e quilometragem registrados neste dia."
      className="max-w-2xl"
    >
      {detailQuery.isLoading ? (
        <TableSkeleton rows={4} />
      ) : !detail || detail.entregas.length === 0 ? (
        <EmptyState
          icon={<IconPackage className="size-6" />}
          title={emptyTitle}
          description="Não há registros para o recorte selecionado neste dia."
        />
      ) : (
        <div className="space-y-4">
          <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetaField label="Entregas">
              <MetaChip tone="delivery" className="w-fit tabular-nums">
                {detail.totalEntregas}
              </MetaChip>
            </MetaField>
            <MetaField label="Valor final">
              <MetaChip tone="money" className="w-fit tabular-nums">
                {formatCurrency(detail.valorTotal)}
              </MetaChip>
            </MetaField>
            {detail.distanciaTotal != null ? (
              <MetaField label="Quilometragem">
                <MetaChip tone="time" className="w-fit tabular-nums">
                  {formatDistance(detail.distanciaTotal)}
                  {detail.tempoTotal != null
                    ? ` · ${formatDuration(detail.tempoTotal)}`
                    : ''}
                </MetaChip>
              </MetaField>
            ) : null}
            {detail.rotas.length > 0 ? (
              <MetaField label="Rotas">
                <MetaChip tone="delivery" className="w-fit tabular-nums">
                  {detail.rotas.length}
                </MetaChip>
              </MetaField>
            ) : null}
          </div>

          {detail.rotas.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Rotas do dia
              </p>
              {detail.rotas.map((rota) => (
                <article
                  key={rota.id}
                  className={cn(PAGE_CARD_ARTICLE, 'min-w-0 space-y-2')}
                >
                  <div className="flex flex-wrap gap-2">
                    <MetaChip tone="delivery" className="w-fit tabular-nums">
                      {rota.totalParadas} paradas
                    </MetaChip>
                    <MetaChip tone="time" className="w-fit tabular-nums">
                      {formatDistance(rota.distanciaTotal)} ·{' '}
                      {formatDuration(rota.tempoTotal)}
                      {rota.aproximada ? ' · aproximada' : ''}
                    </MetaChip>
                    {rota.motoboy ? (
                      <MetaChip tone="motoboy">{rota.motoboy.nome}</MetaChip>
                    ) : null}
                  </div>
                  <MetaChip
                    tone="address"
                    className="w-full items-start whitespace-normal"
                  >
                    <span className="text-left leading-relaxed">
                      Partida: {rota.enderecoInicial}
                    </span>
                  </MetaChip>
                </article>
              ))}
            </div>
          ) : null}

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Entregas
            </p>
            {detail.entregas.map((entrega) => (
              <article
                key={entrega.id}
                className={cn(PAGE_CARD_ARTICLE, 'min-w-0 space-y-3')}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <MetaChip tone="time" className="w-fit tabular-nums">
                    {formatTimeBR(entrega.horario)}
                  </MetaChip>
                  {entrega.motoboy ? (
                    <MetaChip tone="motoboy">{entrega.motoboy.nome}</MetaChip>
                  ) : null}
                  {scope === 'geral' ? (
                    <MetaChip tone="imported">
                      {entrega.origemCadastro === 'CLIENTE'
                        ? 'Cliente'
                        : 'Motoboy'}
                    </MetaChip>
                  ) : null}
                </div>

                <MetaChip
                  tone="client"
                  className="max-w-full text-sm font-semibold"
                  title={entrega.nomeCliente ?? undefined}
                >
                  {entrega.nomeCliente?.trim() || 'Sem nome de cliente'}
                </MetaChip>

                {entrega.telefoneCliente ? (
                  <MetaChip tone="phone" className="tabular-nums">
                    {entrega.telefoneCliente}
                  </MetaChip>
                ) : null}

                <MetaChip
                  tone="address"
                  className="w-full items-start whitespace-normal"
                >
                  <span className="text-left leading-relaxed">
                    {formatEndereco(entrega)}
                  </span>
                </MetaChip>

                <div className="grid min-w-0 gap-2 sm:grid-cols-2">
                  <MetaField label="Valor da entrega">
                    <MetaChip tone="motoboyFee" className="w-fit tabular-nums">
                      {formatCurrency(entrega.valorEntrega)}
                    </MetaChip>
                  </MetaField>
                  {entrega.valorProduto != null ? (
                    <MetaField label="Produto">
                      <MetaChip tone="product" className="w-fit tabular-nums">
                        {formatCurrency(entrega.valorProduto)}
                      </MetaChip>
                    </MetaField>
                  ) : null}
                  {entrega.valorEntregaMotoboy != null ? (
                    <MetaField label="Entrega motoboy">
                      <MetaChip tone="motoboyFee" className="w-fit tabular-nums">
                        {formatCurrency(entrega.valorEntregaMotoboy)}
                      </MetaChip>
                    </MetaField>
                  ) : null}
                  <MetaField label="Neste relatório">
                    <MetaChip tone="money" className="w-fit tabular-nums">
                      {formatCurrency(entrega.valorRelatorio)}
                    </MetaChip>
                  </MetaField>
                  {entrega.distancia != null ? (
                    <MetaField label="Distância">
                      <MetaChip tone="time" className="w-fit tabular-nums">
                        {formatDistance(entrega.distancia)}
                        {entrega.tempo != null
                          ? ` · ${formatDuration(entrega.tempo)}`
                          : ''}
                      </MetaChip>
                    </MetaField>
                  ) : null}
                  {entrega.formaPagamento ? (
                    <MetaField label="Pagamento">
                      <MetaChip tone="payment" className="w-fit">
                        {FORMA_PAGAMENTO_LABEL[entrega.formaPagamento] ??
                          entrega.formaPagamento}
                      </MetaChip>
                    </MetaField>
                  ) : null}
                </div>

                {entrega.observacao ? (
                  <p className="text-xs text-muted-foreground">
                    {entrega.observacao}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <Button variant="ghost" onClick={onClose}>
          Fechar
        </Button>
      </div>
    </Modal>
  )
}
