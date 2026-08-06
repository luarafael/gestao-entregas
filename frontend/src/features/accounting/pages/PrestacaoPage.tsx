import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Modal,
  StatCardSkeleton,
  Textarea,
} from '@/shared/components/ui'
import { IconReceipt, IconTrending } from '@/shared/components/icons'
import { formatCurrency } from '@/shared/utils/cn'
import {
  useCopyWhatsAppText,
  useDeletePrestacao,
  useGeneratePrestacao,
  usePrestacaoHistory,
  usePrestacaoPreview,
  useUpdatePrestacao,
} from '../hooks/usePrestacao'
import { prestacaoService } from '../services/prestacao.service'
import { PrestacaoResultCard } from '../components/PrestacaoResultCard'
import { PrestacaoMotoboyConsolidacao } from '../components/PrestacaoMotoboyConsolidacao'
import { WhatsAppPreview } from '../components/WhatsAppPreview'
import { PrestacaoHistory } from '../components/PrestacaoHistory'
import { PrestacaoEditModal } from '../components/PrestacaoEditModal'
import {
  WhatsAppSendModal,
  type WhatsAppSendPayload,
} from '../components/WhatsAppSendModal'
import {
  formatPrestacaoDate,
  generatePrestacaoFormSchema,
  getTodayInputDate,
  type GeneratePrestacaoFormData,
} from '../schemas/prestacao.schema'
import { exportPrestacaoPdf } from '../utils/exportPrestacaoPdf'
import type { GeneratePrestacaoResponse, PrestacaoContas } from '../types'
import { toast } from '@/shared/stores/toast.store'

export function PrestacaoPage() {
  const [generatedResult, setGeneratedResult] =
    useState<GeneratePrestacaoResponse | null>(null)
  const [historyPage, setHistoryPage] = useState(1)
  const [copyingId, setCopyingId] = useState<string | null>(null)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [sendPayload, setSendPayload] = useState<WhatsAppSendPayload | null>(null)
  const [editingPrestacao, setEditingPrestacao] = useState<PrestacaoContas | null>(
    null,
  )
  const [editObservacoes, setEditObservacoes] = useState('')
  const [editRecalcular, setEditRecalcular] = useState(false)
  const [deletingPrestacao, setDeletingPrestacao] =
    useState<PrestacaoContas | null>(null)

  const historyQuery = usePrestacaoHistory({ page: historyPage, limit: 10 })
  const generateMutation = useGeneratePrestacao()
  const copyMutation = useCopyWhatsAppText()
  const updateMutation = useUpdatePrestacao()
  const deleteMutation = useDeletePrestacao()

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<GeneratePrestacaoFormData>({
    resolver: zodResolver(generatePrestacaoFormSchema),
    defaultValues: {
      data: getTodayInputDate(),
      observacoes: '',
    },
  })

  const selectedDate = useWatch({ control, name: 'data' }) || getTodayInputDate()
  const observacoes = useWatch({ control, name: 'observacoes' }) ?? ''
  const previewQuery = usePrestacaoPreview(selectedDate)
  const preview = previewQuery.data

  useEffect(() => {
    reset({
      data: getTodayInputDate(),
      observacoes: '',
    })
  }, [reset])

  const historyItems = historyQuery.data?.data ?? []
  const historyMeta = historyQuery.data?.meta
  const hasNoDeliveries = preview && preview.totalEntregas === 0
  const hasPendingMotoboyApprovals =
    (preview?.pendentesAprovacaoMotoboy ?? 0) > 0

  const handleGenerate = handleSubmit(async (data) => {
    const result = await generateMutation.mutateAsync(data)
    setGeneratedResult(result)
  })

  const handleCopyCurrent = () => {
    if (!generatedResult?.whatsappText) return
    copyMutation.mutate(generatedResult.whatsappText)
  }

  const buildDailyReportFromPreview = () => {
    if (!preview) return undefined

    return {
      date: preview.data,
      totalEntregas: preview.totalEntregas,
      valorTotal: preview.valorTotal,
      entregasPagasPeloCliente: preview.entregasPagasPeloCliente,
      valorPagasPeloCliente: preview.valorPagasPeloCliente,
      valorPendencias: preview.valorPendencias,
      valorFinal: preview.valorFinal,
      valorRepasseMotoboys: preview.valorRepasseMotoboys,
      valorLiquido: preview.valorLiquido,
      totalPendencias: preview.totalPendencias,
    }
  }

  const buildDailyReportFromPrestacao = (item: PrestacaoContas) => ({
    date: item.data.slice(0, 10),
    totalEntregas: item.totalEntregas,
    valorTotal: Number(item.valorTotal),
    valorPendencias: Number(item.valorPendencias),
    valorFinal: Number(item.valorFinal),
    valorRepasseMotoboys: Number(item.valorRepasseMotoboys),
    valorLiquido: Number(item.valorLiquido),
    observacoes: item.observacoes,
  })

  const handleExportPreviewPdf = () => {
    if (!preview || preview.totalEntregas === 0) return

    exportPrestacaoPdf({
      date: preview.data,
      totalEntregas: preview.totalEntregas,
      valorTotal: preview.valorTotal,
      entregasPagasPeloCliente: preview.entregasPagasPeloCliente,
      valorPagasPeloCliente: preview.valorPagasPeloCliente,
      valorPendencias: preview.valorPendencias,
      valorFinal: preview.valorFinal,
      valorRepasseMotoboys: preview.valorRepasseMotoboys,
      valorLiquido: preview.valorLiquido,
      totalPendencias: preview.totalPendencias,
      observacoes: observacoes.trim() || null,
    })
    toast('PDF exportado com sucesso', 'success')
  }

  const handleExportGeneratedPdf = () => {
    if (!generatedResult) return

    const { prestacao } = generatedResult
    exportPrestacaoPdf({
      date: prestacao.data.slice(0, 10),
      totalEntregas: prestacao.totalEntregas,
      valorTotal: Number(prestacao.valorTotal),
      entregasPagasPeloCliente: preview?.entregasPagasPeloCliente,
      valorPagasPeloCliente: preview?.valorPagasPeloCliente,
      valorPendencias: Number(prestacao.valorPendencias),
      valorFinal: Number(prestacao.valorFinal),
      valorRepasseMotoboys: Number(prestacao.valorRepasseMotoboys),
      valorLiquido: Number(prestacao.valorLiquido),
      totalPendencias: preview?.totalPendencias,
      observacoes: prestacao.observacoes,
    })
    toast('PDF exportado com sucesso', 'success')
  }

  const handleExportHistoryPdf = (item: PrestacaoContas) => {
    exportPrestacaoPdf(buildDailyReportFromPrestacao(item))
    toast('PDF exportado com sucesso', 'success')
  }

  const handleSendCurrent = () => {
    if (!generatedResult?.whatsappText) return

    setSendPayload({
      baseText: generatedResult.whatsappText,
      dailyReport: buildDailyReportFromPreview(),
    })
    setSendModalOpen(true)
  }

  const handleSendFromHistory = async (item: PrestacaoContas) => {
    try {
      setSendingId(item.id)
      const { text } = await prestacaoService.getWhatsAppText(item.id)
      setSendPayload({
        baseText: text,
        dailyReport: buildDailyReportFromPrestacao(item),
      })
      setSendModalOpen(true)
    } catch {
      toast('Erro ao buscar texto da prestação', 'error')
    } finally {
      setSendingId(null)
    }
  }

  const handleCopyFromHistory = async (id: string) => {
    try {
      setCopyingId(id)
      const { text } = await prestacaoService.getWhatsAppText(id)
      await copyMutation.mutateAsync(text)
    } catch {
      toast('Erro ao buscar texto da prestação', 'error')
    } finally {
      setCopyingId(null)
    }
  }

  const handleOpenEdit = (item: PrestacaoContas) => {
    setEditingPrestacao(item)
    setEditObservacoes(item.observacoes ?? '')
    setEditRecalcular(false)
  }

  const handleSaveEdit = async () => {
    if (!editingPrestacao) return

    await updateMutation.mutateAsync({
      id: editingPrestacao.id,
      data: {
        observacoes: editObservacoes.trim() || null,
        recalcular: editRecalcular,
      },
    })

    setEditingPrestacao(null)
  }

  const handleConfirmDelete = async () => {
    if (!deletingPrestacao) return

    const deletedDate = deletingPrestacao.data.slice(0, 10)

    await deleteMutation.mutateAsync(deletingPrestacao.id)

    if (
      generatedResult?.prestacao.id === deletingPrestacao.id ||
      generatedResult?.prestacao.data.slice(0, 10) === deletedDate
    ) {
      setGeneratedResult(null)
    }

    setDeletingPrestacao(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Prestação de Contas
        </h2>
        <p className="text-sm text-muted-foreground">
          Feche o dia, salve o histórico e copie o relatório para o WhatsApp.
        </p>
      </div>

      <Card glass>
        <CardHeader>
          <CardTitle>Gerar prestação do dia</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-4">
            <Input
              label="Data da prestação"
              type="date"
              error={errors.data?.message}
              {...register('data')}
            />

            {previewQuery.isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <StatCardSkeleton key={index} />
                ))}
              </div>
            ) : previewQuery.isError ? (
              <EmptyState
                icon={<IconTrending className="size-6" />}
                title="Não foi possível carregar a prévia"
                description="Verifique se a API está rodando para visualizar os totais."
              />
            ) : (
              <div className="space-y-3 rounded-xl border border-border/60 bg-surface/20 p-4">
                <p className="text-sm font-medium">
                  Prévia de {formatPrestacaoDate(selectedDate)}
                </p>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <PreviewItem
                    label="Entregas"
                    value={String(preview?.totalEntregas ?? 0)}
                  />
                  <PreviewItem
                    label="Valor das entregas"
                    value={formatCurrency(preview?.valorTotal ?? 0)}
                  />
                  <PreviewItem
                    label="Pendências do dia"
                    value={String(preview?.totalPendencias ?? 0)}
                  />
                  <PreviewItem
                    label="Valor final (bruto)"
                    value={formatCurrency(preview?.valorFinal ?? 0)}
                  />
                  <PreviewItem
                    label="Repasse motoboys"
                    value={formatCurrency(preview?.valorRepasseMotoboys ?? 0)}
                  />
                  <PreviewItem
                    label="Valor líquido"
                    value={formatCurrency(preview?.valorLiquido ?? 0)}
                    highlight
                  />
                </div>
                {preview ? (
                  <PrestacaoMotoboyConsolidacao
                    prestacoes={preview.prestacoesMotoboy}
                    valorRepasseMotoboys={preview.valorRepasseMotoboys}
                    valorLiquido={preview.valorLiquido}
                    pendentesAprovacao={preview.pendentesAprovacaoMotoboy}
                  />
                ) : null}
                {preview?.entregasPagasPeloCliente ? (
                  <p className="text-sm text-muted-foreground">
                    {preview.entregasPagasPeloCliente} corrida(s) paga(s) pelo
                    cliente ({formatCurrency(preview.valorPagasPeloCliente)}) —
                    fora do total da prestação.
                  </p>
                ) : null}
                {hasNoDeliveries ? (
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Nenhuma entrega registrada para{' '}
                    {formatPrestacaoDate(selectedDate)}. Verifique se a data
                    corresponde ao dia em que as entregas foram cadastradas.
                  </p>
                ) : (
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleExportPreviewPdf}
                    >
                      Exportar PDF
                    </Button>
                  </div>
                )}
              </div>
            )}

            <Textarea
              label="Observações (opcional)"
              placeholder="Informações adicionais para o relatório..."
              error={errors.observacoes?.message}
              {...register('observacoes')}
            />

            <Button
              type="submit"
              size="lg"
              className="w-full sm:w-auto"
              isLoading={generateMutation.isPending}
              disabled={hasPendingMotoboyApprovals}
            >
              Gerar Prestação do Dia
            </Button>
            {hasPendingMotoboyApprovals ? (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Existem prestações de motoboy aguardando aprovação. Aprove-as
                antes de fechar o dia.
              </p>
            ) : null}
          </form>
        </CardContent>
      </Card>

      {generatedResult ? (
        <div className="space-y-4">
          <PrestacaoResultCard result={generatedResult} />
          <WhatsAppPreview
            text={generatedResult.whatsappText}
            onCopy={handleCopyCurrent}
            onSend={handleSendCurrent}
            onExportPdf={handleExportGeneratedPdf}
            isCopying={copyMutation.isPending}
          />
        </div>
      ) : null}

      <section className="rounded-2xl border border-border/60 bg-card/70 p-5 backdrop-blur-xl">
        <div className="mb-4">
          <h3 className="text-lg font-semibold tracking-tight">Histórico</h3>
          <p className="text-sm text-muted-foreground">
            Prestações de contas geradas anteriormente
          </p>
        </div>

        {historyQuery.isError ? (
          <EmptyState
            icon={<IconReceipt className="size-6" />}
            title="Erro ao carregar histórico"
            description="Não foi possível buscar as prestações salvas."
          />
        ) : (
          <PrestacaoHistory
            items={historyItems}
            isLoading={historyQuery.isLoading || historyQuery.isFetching}
            page={historyMeta?.page ?? 1}
            totalPages={historyMeta?.totalPages ?? 1}
            onPageChange={setHistoryPage}
            onCopy={handleCopyFromHistory}
            onSend={handleSendFromHistory}
            onExportPdf={handleExportHistoryPdf}
            onEdit={handleOpenEdit}
            onDelete={setDeletingPrestacao}
            copyingId={copyingId}
            sendingId={sendingId}
            deletingId={deleteMutation.isPending ? deletingPrestacao?.id : null}
          />
        )}
      </section>

      <PrestacaoEditModal
        prestacao={editingPrestacao}
        isOpen={Boolean(editingPrestacao)}
        isSaving={updateMutation.isPending}
        observacoes={editObservacoes}
        recalcular={editRecalcular}
        onObservacoesChange={setEditObservacoes}
        onRecalcularChange={setEditRecalcular}
        onClose={() => setEditingPrestacao(null)}
        onSave={handleSaveEdit}
      />

      <WhatsAppSendModal
        open={sendModalOpen}
        onClose={() => setSendModalOpen(false)}
        payload={sendPayload}
      />

      <Modal
        open={Boolean(deletingPrestacao)}
        onClose={() => setDeletingPrestacao(null)}
        title="Excluir prestação"
        description={
          deletingPrestacao
            ? `Deseja excluir a prestação de ${formatPrestacaoDate(deletingPrestacao.data)}?`
            : undefined
        }
        confirmLabel="Excluir"
        variant="danger"
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}

function PreviewItem({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-surface/30 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={
          highlight
            ? 'mt-1 text-xl font-semibold text-primary'
            : 'mt-1 text-lg font-semibold'
        }
      >
        {value}
      </p>
    </div>
  )
}
