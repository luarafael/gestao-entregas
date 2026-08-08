import { useState } from 'react'
import {
  Badge,
  Button,
  EmptyState,
  Input,
  MetaChip,
  MetaField,
  Modal,
  PageShell,
  PAGE_CARD_ARTICLE,
  TableSkeleton,
} from '@/shared/components/ui'
import { IconReceipt } from '@/shared/components/icons'
import {
  MotoboySelect,
  type MotoboySelectValue,
} from '@/shared/components/MotoboySelect'
import { cn, formatCurrency } from '@/shared/utils/cn'
import { formatPrestacaoMotoboyDate } from '@/features/motoboy/schemas/prestacaoMotoboy.schema'
import type { PrestacaoMotoboy } from '@/features/motoboy/types/prestacaoMotoboy.types'
import {
  useApprovePrestacaoMotoboy,
  usePendingPrestacoesCount,
  usePendingPrestacoesMotoboy,
  useRejectPrestacaoMotoboy,
} from '../hooks/useAprovacoes'
import { aprovacoesService } from '../services/aprovacoes.service'
import { AprovacoesHistoricoSection } from '../components/AprovacoesHistoricoSection'
import { toast } from '@/shared/stores/toast.store'

type AprovacoesTab = 'pendentes' | 'historico'

export function AprovacoesPage() {
  const [tab, setTab] = useState<AprovacoesTab>('pendentes')
  const [historyPage, setHistoryPage] = useState(1)
  const [motoboyFilter, setMotoboyFilter] =
    useState<MotoboySelectValue>('all')
  const motoboyId = motoboyFilter === 'all' ? undefined : motoboyFilter

  const [rejecting, setRejecting] = useState<PrestacaoMotoboy | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [previewText, setPreviewText] = useState<string | null>(null)

  const pendingQuery = usePendingPrestacoesMotoboy(motoboyId)
  const pendingCountQuery = usePendingPrestacoesCount()
  const approveMutation = useApprovePrestacaoMotoboy()
  const rejectMutation = useRejectPrestacaoMotoboy()

  const items = pendingQuery.data?.data ?? []
  const pendingTotal = pendingCountQuery.data?.total ?? 0

  const handlePreview = async (id: string) => {
    try {
      const { text } = await aprovacoesService.getWhatsAppText(id)
      setPreviewText(text)
    } catch {
      toast('Erro ao carregar texto', 'error')
    }
  }

  const handleReject = async () => {
    if (!rejecting || !rejectReason.trim()) return
    await rejectMutation.mutateAsync({
      id: rejecting.id,
      motivo: rejectReason.trim(),
    })
    setRejecting(null)
    setRejectReason('')
  }

  return (
    <PageShell>
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold tracking-tight">
            Aprovações de motoboy
          </h2>
          <p className="text-sm text-muted-foreground">
            Gerencie solicitações pendentes e consulte o histórico de decisões.
          </p>
        </div>
        <MotoboySelect
          id="filtro-motoboy-aprovacoes"
          value={motoboyFilter}
          onChange={(value) => {
            setMotoboyFilter(value)
            setHistoryPage(1)
          }}
          allowAll
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={tab === 'pendentes' ? 'primary' : 'secondary'}
          onClick={() => setTab('pendentes')}
        >
          Pendentes
          {pendingTotal > 0 ? (
            <span className="ml-2 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold">
              {pendingTotal}
            </span>
          ) : null}
        </Button>
        <Button
          variant={tab === 'historico' ? 'primary' : 'secondary'}
          onClick={() => setTab('historico')}
        >
          Histórico
        </Button>
      </div>

      {tab === 'pendentes' ? (
        pendingQuery.isLoading ? (
          <TableSkeleton rows={3} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<IconReceipt className="size-6" />}
            title="Nenhuma prestação pendente"
            description={
              motoboyId
                ? 'Este motoboy não tem prestações aguardando aprovação.'
                : 'Quando um motoboy enviar a prestação do dia, ela aparecerá aqui.'
            }
          />
        ) : (
          <div className="min-w-0 space-y-3">
            {items.map((item) => (
              <article
                key={item.id}
                className={cn(
                  PAGE_CARD_ARTICLE,
                  'min-w-0 border-amber-500/20 shadow-sm shadow-amber-500/5',
                )}
              >
                <div className="grid min-w-0 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                  <MetaField label="Motoboy" className="min-w-0">
                    <MetaChip
                      tone="motoboy"
                      className="w-full max-w-full"
                      title={item.motoboy?.nome ?? undefined}
                    >
                      {item.motoboy?.nome ?? 'Motoboy'}
                    </MetaChip>
                  </MetaField>

                  <MetaField label="Data">
                    <MetaChip tone="time" className="w-fit">
                      {formatPrestacaoMotoboyDate(item.data)}
                    </MetaChip>
                  </MetaField>

                  <MetaField label="Entregas">
                    <MetaChip tone="delivery" className="w-fit tabular-nums">
                      {item.totalEntregas}
                    </MetaChip>
                  </MetaField>

                  <MetaField label="Valor entregas">
                    <MetaChip tone="money" className="w-fit tabular-nums">
                      {formatCurrency(Number(item.valorTotal))}
                    </MetaChip>
                  </MetaField>

                  <MetaField label="Repasse pend.">
                    <MetaChip tone="pending" className="w-fit tabular-nums">
                      {formatCurrency(Number(item.valorPendencias))}
                    </MetaChip>
                  </MetaField>

                  <MetaField label="Total a receber">
                    <MetaChip tone="motoboyFee" className="w-fit tabular-nums">
                      {formatCurrency(Number(item.valorFinal))}
                    </MetaChip>
                  </MetaField>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge variant="warning">Aguardando</Badge>
                  {item.observacoes ? (
                    <p className="min-w-0 text-sm text-muted-foreground">
                      Obs: {item.observacoes}
                    </p>
                  ) : null}
                </div>

                <div className="mt-3 flex w-full min-w-0 flex-wrap gap-2 border-t border-border/40 pt-3">
                  <Button variant="copy" size="sm" onClick={() => handlePreview(item.id)}>
                    Ver texto
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => approveMutation.mutate(item.id)}
                    isLoading={approveMutation.isPending}
                  >
                    Aprovar
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => setRejecting(item)}>
                    Rejeitar
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )
      ) : (
        <AprovacoesHistoricoSection
          motoboyId={motoboyId}
          page={historyPage}
          onPageChange={setHistoryPage}
        />
      )}

      <Modal
        open={Boolean(previewText)}
        onClose={() => setPreviewText(null)}
        title="Texto da prestação"
        description="Resumo enviado pelo motoboy"
        confirmLabel="Fechar"
        onConfirm={() => setPreviewText(null)}
      >
        <textarea
          readOnly
          value={previewText ?? ''}
          className="min-h-60 w-full rounded-xl border border-border/70 bg-surface/40 px-4 py-3 text-sm"
        />
      </Modal>

      <Modal
        open={Boolean(rejecting)}
        onClose={() => setRejecting(null)}
        title="Rejeitar prestação"
        description={
          rejecting
            ? `Motoboy: ${rejecting.motoboy?.nome} — ${formatPrestacaoMotoboyDate(rejecting.data)}`
            : undefined
        }
        confirmLabel="Rejeitar"
        variant="danger"
        isLoading={rejectMutation.isPending}
        onConfirm={handleReject}
      >
        <Input
          label="Motivo da rejeição"
          value={rejectReason}
          onChange={(event) => setRejectReason(event.target.value)}
          placeholder="Explique o que precisa ser corrigido..."
        />
      </Modal>
    </PageShell>
  )
}
