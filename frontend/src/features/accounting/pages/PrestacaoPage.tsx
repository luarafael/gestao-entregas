import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  StatCardSkeleton,
  Textarea,
} from '@/shared/components/ui'
import { IconReceipt, IconTrending } from '@/shared/components/icons'
import { formatCurrency } from '@/shared/utils/cn'
import { useDashboardStats } from '@/features/dashboard/hooks/useDashboard'
import {
  useCopyWhatsAppText,
  useGeneratePrestacao,
  usePrestacaoHistory,
} from '../hooks/usePrestacao'
import { prestacaoService } from '../services/prestacao.service'
import { PrestacaoResultCard } from '../components/PrestacaoResultCard'
import { WhatsAppPreview } from '../components/WhatsAppPreview'
import { PrestacaoHistory } from '../components/PrestacaoHistory'
import {
  defaultGenerateFormValues,
  generatePrestacaoFormSchema,
  type GeneratePrestacaoFormData,
} from '../schemas/prestacao.schema'
import type { GeneratePrestacaoResponse } from '../types'
import { toast } from '@/shared/stores/toast.store'

export function PrestacaoPage() {
  const [generatedResult, setGeneratedResult] =
    useState<GeneratePrestacaoResponse | null>(null)
  const [historyPage, setHistoryPage] = useState(1)
  const [copyingId, setCopyingId] = useState<string | null>(null)

  const statsQuery = useDashboardStats()
  const historyQuery = usePrestacaoHistory({ page: historyPage, limit: 10 })
  const generateMutation = useGeneratePrestacao()
  const copyMutation = useCopyWhatsAppText()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GeneratePrestacaoFormData>({
    resolver: zodResolver(generatePrestacaoFormSchema),
    defaultValues: defaultGenerateFormValues,
  })

  const stats = statsQuery.data
  const historyItems = historyQuery.data?.data ?? []
  const historyMeta = historyQuery.data?.meta

  const handleGenerate = handleSubmit(async (data) => {
    const result = await generateMutation.mutateAsync(data)
    setGeneratedResult(result)
  })

  const handleCopyCurrent = () => {
    if (!generatedResult?.whatsappText) return
    copyMutation.mutate(generatedResult.whatsappText)
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

      {statsQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <StatCardSkeleton key={index} />
          ))}
        </div>
      ) : statsQuery.isError ? (
        <EmptyState
          icon={<IconTrending className="size-6" />}
          title="Não foi possível carregar o resumo do dia"
          description="Verifique se a API está rodando para visualizar os totais."
        />
      ) : (
        <Card glass>
          <CardHeader>
            <CardTitle>Prévia do dia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <PreviewItem label="Entregas hoje" value={String(stats?.entregasHoje ?? 0)} />
              <PreviewItem
                label="Valor das entregas"
                value={formatCurrency(stats?.valorRecebidoHoje ?? 0)}
              />
              <PreviewItem label="Pendências" value={String(stats?.totalPendencias ?? 0)} />
              <PreviewItem
                label="Valor total estimado"
                value={formatCurrency(stats?.valorTotalDia ?? 0)}
                highlight
              />
            </div>
          </CardContent>
        </Card>
      )}

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
            >
              Gerar Prestação do Dia
            </Button>
          </form>
        </CardContent>
      </Card>

      {generatedResult ? (
        <div className="space-y-4">
          <PrestacaoResultCard result={generatedResult} />
          <WhatsAppPreview
            text={generatedResult.whatsappText}
            onCopy={handleCopyCurrent}
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
            copyingId={copyingId}
          />
        )}
      </section>
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
