import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  MetaChip,
  MetaField,
  MetaSectionTitle,
  PAGE_CARD_SECTION,
  PagePanel,
  PageShell,
  StatCardSkeleton,
  Textarea,
} from '@/shared/components/ui'
import { IconReceipt } from '@/shared/components/icons'
import { formatCurrency } from '@/shared/utils/cn'
import { WhatsAppPreview } from '@/features/accounting/components/WhatsAppPreview'
import { PrestacaoMotoboyHistory } from '@/features/accounting/components/PrestacaoMotoboyHistory'
import {
  WhatsAppSendModal,
  type WhatsAppSendPayload,
} from '@/features/accounting/components/WhatsAppSendModal'
import { exportPrestacaoPdf } from '@/features/accounting/utils/exportPrestacaoPdf'
import { authService } from '@/features/auth/services/auth.service'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { prestacaoMotoboyService } from '../services/prestacaoMotoboy.service'
import { toast } from '@/shared/stores/toast.store'
import {
  useCopyPrestacaoMotoboyWhatsApp,
  usePrestacaoMotoboyHistory,
  usePrestacaoMotoboyPreview,
  useSubmitPrestacaoMotoboy,
} from '../hooks/usePrestacaoMotoboy'
import {
  defaultSubmitFormValues,
  formatPrestacaoMotoboyDate,
  getTodayInputDate,
  submitPrestacaoMotoboyFormSchema,
  type SubmitPrestacaoMotoboyFormData,
} from '../schemas/prestacaoMotoboy.schema'
import type { SubmitPrestacaoMotoboyResponse } from '../types/prestacaoMotoboy.types'
import type { PrestacaoMotoboy } from '../types/prestacaoMotoboy.types'

const statusLabels = {
  ENVIADA: { label: 'Aguardando aprovação', variant: 'warning' as const },
  APROVADA: { label: 'Aprovada', variant: 'success' as const },
  REJEITADA: { label: 'Rejeitada', variant: 'danger' as const },
}

export function MinhaPrestacaoPage() {
  const [generatedResult, setGeneratedResult] =
    useState<SubmitPrestacaoMotoboyResponse | null>(null)
  const [pix, setPix] = useState('')
  const [isSavingPix, setIsSavingPix] = useState(false)
  const [historyPage, setHistoryPage] = useState(1)
  const [copyingId, setCopyingId] = useState<string | null>(null)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [sendPayload, setSendPayload] = useState<WhatsAppSendPayload | null>(null)
  const [sendModalOpen, setSendModalOpen] = useState(false)
  const token = useAuthStore((state) => state.token)
  const setSession = useAuthStore((state) => state.setSession)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<SubmitPrestacaoMotoboyFormData>({
    resolver: zodResolver(submitPrestacaoMotoboyFormSchema),
    defaultValues: defaultSubmitFormValues,
  })

  const selectedDate = useWatch({ control, name: 'data' }) || getTodayInputDate()
  const previewQuery = usePrestacaoMotoboyPreview(selectedDate)
  const preview = previewQuery.data
  const historyQuery = usePrestacaoMotoboyHistory({
    page: historyPage,
    limit: 10,
  })
  const submitMutation = useSubmitPrestacaoMotoboy()
  const copyMutation = useCopyPrestacaoMotoboyWhatsApp()

  useEffect(() => {
    reset(defaultSubmitFormValues)
  }, [reset])

  useEffect(() => {
    authService
      .me()
      .then((user) => setPix(user.pix ?? ''))
      .catch(() => undefined)
  }, [])

  const canSubmit =
    preview?.statusExistente !== 'ENVIADA' &&
    preview?.statusExistente !== 'APROVADA'

  const handleSubmitPrestacao = handleSubmit(async (data) => {
    setIsSavingPix(true)
    try {
      const updatedUser = await authService.updatePix(pix.trim())
      if (token) {
        setSession(token, updatedUser)
      }
    } finally {
      setIsSavingPix(false)
    }

    const result = await submitMutation.mutateAsync(data)
    setGeneratedResult(result)
    setHistoryPage(1)
  })

  const handleCopyFromHistory = async (id: string) => {
    try {
      setCopyingId(id)
      const { text } = await prestacaoMotoboyService.getWhatsAppText(id)
      await copyMutation.mutateAsync(text)
    } catch {
      toast('Erro ao buscar texto da prestação', 'error')
    } finally {
      setCopyingId(null)
    }
  }

  const handleExportHistoryPdf = (item: PrestacaoMotoboy) => {
    exportPrestacaoPdf({
      date: item.data.slice(0, 10),
      totalEntregas: item.totalEntregas,
      valorTotal: Number(item.valorTotal),
      valorPendencias: Number(item.valorPendencias),
      valorFinal: Number(item.valorFinal),
      observacoes: item.observacoes,
    })
    toast('PDF exportado com sucesso', 'success')
  }

  const handleSendFromHistory = async (item: PrestacaoMotoboy) => {
    try {
      setSendingId(item.id)
      const { text } = await prestacaoMotoboyService.getWhatsAppText(item.id)
      setSendPayload({ baseText: text })
      setSendModalOpen(true)
    } catch {
      toast('Erro ao buscar texto da prestação', 'error')
    } finally {
      setSendingId(null)
    }
  }

  const historyItems = historyQuery.data?.data ?? []
  const historyMeta = historyQuery.data?.meta

  return (
    <PageShell>
      <section className="min-w-0">
        <h2 className="text-2xl font-semibold tracking-tight">Minha prestação</h2>
        <p className="text-sm text-muted-foreground">
          Feche o dia e envie para o administrador aprovar.
        </p>
      </section>

      <Card glass>
        <CardHeader>
          <CardTitle>Enviar prestação do dia</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitPrestacao} className="space-y-4">
            <Input
              label="Data"
              type="date"
              error={errors.data?.message}
              {...register('data')}
            />

            {preview?.statusExistente ? (
              <Badge variant={statusLabels[preview.statusExistente].variant}>
                {statusLabels[preview.statusExistente].label}
              </Badge>
            ) : null}

            {previewQuery.isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <StatCardSkeleton key={index} />
                ))}
              </div>
            ) : (
              <div className={PAGE_CARD_SECTION}>
                <MetaSectionTitle tone="time">
                  Prévia de {formatPrestacaoMotoboyDate(selectedDate)}
                </MetaSectionTitle>
                <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <PreviewItem
                    label="Entregas"
                    value={String(preview?.totalEntregas ?? 0)}
                    tone="delivery"
                  />
                  <PreviewItem
                    label="Valor das entregas"
                    value={formatCurrency(preview?.valorTotal ?? 0)}
                    tone="money"
                  />
                  <PreviewItem
                    label="Pendências"
                    value={formatCurrency(preview?.valorPendencias ?? 0)}
                    tone="pending"
                  />
                  <PreviewItem
                    label="Total a receber"
                    value={formatCurrency(preview?.valorFinal ?? 0)}
                    tone="money"
                    highlight
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Input
                label="PIX para recebimento"
                placeholder="CPF, e-mail, telefone ou chave aleatória"
                value={pix}
                onChange={(event) => setPix(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Incluído na mensagem do WhatsApp para o administrador pagar o
                repasse.
              </p>
            </div>

            <Textarea
              label="Observações (opcional)"
              placeholder="Informações para o administrador..."
              error={errors.observacoes?.message}
              {...register('observacoes')}
            />

            <Button
              type="submit"
              size="lg"
              disabled={!canSubmit}
              isLoading={submitMutation.isPending || isSavingPix}
            >
              {preview?.statusExistente === 'REJEITADA'
                ? 'Reenviar para aprovação'
                : 'Enviar para aprovação'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {generatedResult ? (
        <WhatsAppPreview
          text={generatedResult.whatsappText}
          title="Texto enviado ao administrador"
          onCopy={() => copyMutation.mutate(generatedResult.whatsappText)}
          onSend={() => copyMutation.mutate(generatedResult.whatsappText)}
          isCopying={copyMutation.isPending}
        />
      ) : null}

      <PagePanel density="default" className="min-w-0">
        <div className="mb-1 min-w-0">
          <h3 className="text-lg font-semibold tracking-tight">Histórico</h3>
          <p className="text-sm text-muted-foreground">
            Prestações enviadas, aprovadas ou rejeitadas.
          </p>
        </div>

        {historyQuery.isError ? (
          <EmptyState
            icon={<IconReceipt className="size-6" />}
            title="Erro ao carregar histórico"
            description="Não foi possível buscar suas prestações."
          />
        ) : (
          <PrestacaoMotoboyHistory
            items={historyItems}
            isLoading={historyQuery.isLoading || historyQuery.isFetching}
            page={historyMeta?.page ?? 1}
            totalPages={historyMeta?.totalPages ?? 1}
            onPageChange={setHistoryPage}
            onCopy={handleCopyFromHistory}
            onExportPdf={handleExportHistoryPdf}
            onSend={handleSendFromHistory}
            copyingId={copyingId}
            sendingId={sendingId}
          />
        )}
      </PagePanel>

      <WhatsAppSendModal
        open={sendModalOpen}
        onClose={() => setSendModalOpen(false)}
        payload={sendPayload}
      />
    </PageShell>
  )
}

function PreviewItem({
  label,
  value,
  tone,
  highlight = false,
}: {
  label: string
  value: string
  tone: 'delivery' | 'money' | 'pending'
  highlight?: boolean
}) {
  return (
    <MetaField label={label}>
      <MetaChip
        tone={tone}
        className={
          highlight
            ? 'w-fit text-base font-semibold tabular-nums'
            : 'w-fit tabular-nums'
        }
      >
        {value}
      </MetaChip>
    </MetaField>
  )
}
