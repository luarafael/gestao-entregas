import { useState } from 'react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Input,
  Modal,
} from '@/shared/components/ui'
import { IconReceipt } from '@/shared/components/icons'
import { formatCurrency } from '@/shared/utils/cn'
import { formatPrestacaoMotoboyDate } from '@/features/motoboy/schemas/prestacaoMotoboy.schema'
import type { PrestacaoMotoboy } from '@/features/motoboy/types/prestacaoMotoboy.types'
import {
  useApprovePrestacaoMotoboy,
  usePendingPrestacoesMotoboy,
  useRejectPrestacaoMotoboy,
} from '../hooks/useAprovacoes'
import { aprovacoesService } from '../services/aprovacoes.service'
import { toast } from '@/shared/stores/toast.store'

export function AprovacoesPage() {
  const [rejecting, setRejecting] = useState<PrestacaoMotoboy | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [previewText, setPreviewText] = useState<string | null>(null)

  const pendingQuery = usePendingPrestacoesMotoboy()
  const approveMutation = useApprovePrestacaoMotoboy()
  const rejectMutation = useRejectPrestacaoMotoboy()

  const items = pendingQuery.data?.data ?? []

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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Aprovações de motoboy
        </h2>
        <p className="text-sm text-muted-foreground">
          Revise e aprove as prestações enviadas pelos motoboys.
        </p>
      </div>

      {pendingQuery.isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="h-24 animate-pulse rounded-xl bg-surface/50" />
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<IconReceipt className="size-6" />}
          title="Nenhuma prestação pendente"
          description="Quando um motoboy enviar a prestação do dia, ela aparecerá aqui."
        />
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold">
                      {item.motoboy?.nome ?? 'Motoboy'}
                    </p>
                    <Badge variant="warning">Aguardando</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatPrestacaoMotoboyDate(item.data)} · {item.totalEntregas}{' '}
                    entregas
                  </p>
                  <p className="mt-2 text-sm">
                    Entregas: {formatCurrency(Number(item.valorTotal))} · Repasse:{' '}
                    {formatCurrency(Number(item.valorPendencias))} ·{' '}
                    <span className="font-semibold text-primary">
                      Total: {formatCurrency(Number(item.valorFinal))}
                    </span>
                  </p>
                  {item.observacoes ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Obs: {item.observacoes}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => handlePreview(item.id)}>
                    Ver texto
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => approveMutation.mutate(item.id)}
                    isLoading={approveMutation.isPending}
                  >
                    Aprovar
                  </Button>
                  <Button variant="danger" onClick={() => setRejecting(item)}>
                    Rejeitar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
    </div>
  )
}
