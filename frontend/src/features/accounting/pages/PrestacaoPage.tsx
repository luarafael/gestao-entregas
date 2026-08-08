import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
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
  Modal,
  StatCardSkeleton,
  Textarea,
} from '@/shared/components/ui'
import { IconReceipt, IconTrending } from '@/shared/components/icons'
import { MotoboySelect, type MotoboySelectValue } from '@/shared/components/MotoboySelect'
import { ClienteSelect } from '@/shared/components/ClienteSelect'
import { formatCurrency } from '@/shared/utils/cn'
import {
  useCopyWhatsAppText,
  useDeletePrestacao,
  useGeneratePrestacao,
  usePrestacaoPreview,
  useUpdatePrestacao,
} from '../hooks/usePrestacao'
import {
  useCopyPrestacaoClienteWhatsApp,
  useDeletePrestacaoCliente,
  usePrestacaoClientePreview,
  usePrestacaoHistorico,
  useSubmitPrestacaoCliente,
} from '../hooks/usePrestacaoCliente'
import {
  useCopyPrestacaoMotoboyWhatsApp,
  usePrestacaoMotoboyPreview,
  useSubmitPrestacaoMotoboy,
} from '@/features/motoboy/hooks/usePrestacaoMotoboy'
import { prestacaoService } from '../services/prestacao.service'
import { prestacaoMotoboyService } from '@/features/motoboy/services/prestacaoMotoboy.service'
import { prestacaoClienteService } from '../services/prestacaoCliente.service'
import { PrestacaoResultCard } from '../components/PrestacaoResultCard'
import { PrestacaoMotoboyConsolidacao } from '../components/PrestacaoMotoboyConsolidacao'
import {
  PrestacaoHistoricoFilterSelect,
  PrestacaoScopeSelect,
} from '../components/PrestacaoScopeSelect'
import { PrestacaoUnifiedHistory } from '../components/PrestacaoUnifiedHistory'
import { WhatsAppPreview } from '../components/WhatsAppPreview'
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
import {
  defaultSubmitClienteFormValues,
  formatPrestacaoClienteDate,
  submitPrestacaoClienteFormSchema,
  type SubmitPrestacaoClienteFormData,
} from '../schemas/prestacaoCliente.schema'
import { formatPrestacaoMotoboyDate } from '@/features/motoboy/schemas/prestacaoMotoboy.schema'
import { exportPrestacaoPdf } from '../utils/exportPrestacaoPdf'
import type { GeneratePrestacaoResponse, PrestacaoContas } from '../types'
import type { SubmitPrestacaoMotoboyResponse } from '@/features/motoboy/types/prestacaoMotoboy.types'
import type {
  PrestacaoHistoricoFilter,
  PrestacaoHistoricoItem,
  PrestacaoScope,
  SubmitPrestacaoClienteResponse,
} from '../types/prestacaoCliente.types'
import { toast } from '@/shared/stores/toast.store'

const motoboyStatusLabels = {
  ENVIADA: { label: 'Aguardando aprovação', variant: 'warning' as const },
  APROVADA: { label: 'Aprovada', variant: 'success' as const },
  REJEITADA: { label: 'Rejeitada', variant: 'danger' as const },
}

export function PrestacaoPage() {
  const [prestacaoScope, setPrestacaoScope] = useState<PrestacaoScope>('empresa')
  const [motoboyId, setMotoboyId] = useState('')
  const [nomeCliente, setNomeCliente] = useState('')
  const [historyFilter, setHistoryFilter] = useState<PrestacaoHistoricoFilter>('all')
  const [historyPage, setHistoryPage] = useState(1)
  const [whatsappEntregasScope, setWhatsappEntregasScope] =
    useState<MotoboySelectValue>('all')

  const [generatedResult, setGeneratedResult] =
    useState<GeneratePrestacaoResponse | null>(null)
  const [motoboyGenerated, setMotoboyGenerated] =
    useState<SubmitPrestacaoMotoboyResponse | null>(null)
  const [clienteGenerated, setClienteGenerated] =
    useState<SubmitPrestacaoClienteResponse | null>(null)
  const [copyingId, setCopyingId] = useState<string | null>(null)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [sendPayload, setSendPayload] = useState<WhatsAppSendPayload | null>(null)
  const [editingPrestacao, setEditingPrestacao] = useState<PrestacaoContas | null>(
    null,
  )
  const [editObservacoes, setEditObservacoes] = useState('')
  const [editRecalcular, setEditRecalcular] = useState(false)
  const [deletingItem, setDeletingItem] = useState<PrestacaoHistoricoItem | null>(
    null,
  )

  const generateMutation = useGeneratePrestacao()
  const submitMotoboyMutation = useSubmitPrestacaoMotoboy()
  const submitClienteMutation = useSubmitPrestacaoCliente()
  const copyMutation = useCopyWhatsAppText()
  const copyMotoboyMutation = useCopyPrestacaoMotoboyWhatsApp()
  const copyClienteMutation = useCopyPrestacaoClienteWhatsApp()
  const updateMutation = useUpdatePrestacao()
  const deleteMutation = useDeletePrestacao()
  const deleteClienteMutation = useDeletePrestacaoCliente()

  const empresaForm = useForm<GeneratePrestacaoFormData>({
    resolver: zodResolver(generatePrestacaoFormSchema),
    defaultValues: {
      data: getTodayInputDate(),
      observacoes: '',
    },
  })

  const clienteForm = useForm<SubmitPrestacaoClienteFormData>({
    resolver: zodResolver(submitPrestacaoClienteFormSchema),
    defaultValues: defaultSubmitClienteFormValues,
  })

  const empresaDate =
    useWatch({ control: empresaForm.control, name: 'data' }) || getTodayInputDate()
  const clienteDate =
    useWatch({ control: clienteForm.control, name: 'data' }) || getTodayInputDate()
  const empresaObservacoes =
    useWatch({ control: empresaForm.control, name: 'observacoes' }) ?? ''
  const clienteObservacoes =
    useWatch({ control: clienteForm.control, name: 'observacoes' }) ?? ''

  const selectedDate =
    prestacaoScope === 'cliente' ? clienteDate : empresaDate
  const observacoes =
    prestacaoScope === 'cliente' ? clienteObservacoes : empresaObservacoes

  const previewQuery = usePrestacaoPreview(
    prestacaoScope === 'empresa' ? selectedDate : undefined,
  )
  const motoboyPreviewQuery = usePrestacaoMotoboyPreview(
    selectedDate,
    motoboyId || undefined,
    prestacaoScope === 'motoboy' && Boolean(motoboyId),
  )
  const clientePreviewQuery = usePrestacaoClientePreview(
    selectedDate,
    nomeCliente,
    prestacaoScope === 'cliente',
  )

  const historicoQuery = usePrestacaoHistorico({
    page: historyPage,
    limit: 10,
    tipo: historyFilter,
  })

  const preview = previewQuery.data
  const motoboyPreview = motoboyPreviewQuery.data
  const clientePreview = clientePreviewQuery.data

  useEffect(() => {
    empresaForm.reset({
      data: getTodayInputDate(),
      observacoes: '',
    })
    clienteForm.reset(defaultSubmitClienteFormValues)
  }, [empresaForm, clienteForm])

  useEffect(() => {
    clienteForm.setValue('data', selectedDate)
  }, [selectedDate, clienteForm])

  const empresaWhatsappQuery = useQuery({
    queryKey: [
      'prestacoes',
      'whatsapp',
      generatedResult?.prestacao.id,
      whatsappEntregasScope,
    ],
    queryFn: () =>
      prestacaoService.getWhatsAppText(
        generatedResult!.prestacao.id,
        whatsappEntregasScope === 'all' ? undefined : whatsappEntregasScope,
      ),
    enabled:
      prestacaoScope === 'empresa' && Boolean(generatedResult?.prestacao.id),
  })

  const empresaWhatsappText =
    empresaWhatsappQuery.data?.text ?? generatedResult?.whatsappText ?? ''

  const handleScopeChange = (scope: PrestacaoScope) => {
    const currentDate = empresaDate
    setPrestacaoScope(scope)
    setHistoryPage(1)
    setGeneratedResult(null)
    setMotoboyGenerated(null)
    setClienteGenerated(null)
    setWhatsappEntregasScope('all')
    if (scope !== 'motoboy') setMotoboyId('')
    if (scope !== 'cliente') setNomeCliente('')
    if (scope === 'cliente') {
      clienteForm.setValue('data', currentDate)
    }
  }

  const hasNoDeliveries =
    prestacaoScope === 'motoboy'
      ? motoboyPreview && motoboyPreview.totalEntregas === 0
      : prestacaoScope === 'cliente'
        ? clientePreview && clientePreview.totalEntregas === 0
        : preview && preview.totalEntregas === 0

  const hasPendingMotoboyApprovals =
    prestacaoScope === 'empresa' && (preview?.pendentesAprovacaoMotoboy ?? 0) > 0

  const canSubmitMotoboy =
    motoboyPreview?.statusExistente !== 'ENVIADA' &&
    motoboyPreview?.statusExistente !== 'APROVADA'

  const canSubmitCliente = !clientePreview?.prestacaoId

  const handleGenerateEmpresa = empresaForm.handleSubmit(async (data) => {
    const result = await generateMutation.mutateAsync(data)
    setGeneratedResult(result)
    setMotoboyGenerated(null)
    setClienteGenerated(null)
    setWhatsappEntregasScope('all')
    setHistoryPage(1)
  })

  const handleSubmitMotoboy = empresaForm.handleSubmit(async (data) => {
    if (!motoboyId) return
    const result = await submitMotoboyMutation.mutateAsync({
      ...data,
      motoboyId,
    })
    setMotoboyGenerated(result)
    setGeneratedResult(null)
    setClienteGenerated(null)
    setHistoryPage(1)
  })

  const handleSubmitCliente = clienteForm.handleSubmit(async (data) => {
    const result = await submitClienteMutation.mutateAsync({
      ...data,
      nomeCliente,
      data: selectedDate,
    })
    setClienteGenerated(result)
    setGeneratedResult(null)
    setMotoboyGenerated(null)
    setHistoryPage(1)
  })

  const resolveEmpresaMotoboyFilter = () =>
    whatsappEntregasScope === 'all' ? undefined : whatsappEntregasScope

  const fetchHistoricoText = async (item: PrestacaoHistoricoItem) => {
    if (item.tipo === 'empresa') {
      const { text } = await prestacaoService.getWhatsAppText(
        item.id,
        resolveEmpresaMotoboyFilter(),
      )
      return text
    }

    if (item.tipo === 'motoboy') {
      const { text } = await prestacaoMotoboyService.getWhatsAppText(item.id)
      return text
    }

    const { text } = await prestacaoClienteService.getWhatsAppText(item.id)
    return text
  }

  const handleCopyFromHistory = async (item: PrestacaoHistoricoItem) => {
    try {
      setCopyingId(item.id)
      const text = await fetchHistoricoText(item)
      if (item.tipo === 'motoboy') {
        await copyMotoboyMutation.mutateAsync(text)
      } else if (item.tipo === 'cliente') {
        await copyClienteMutation.mutateAsync(text)
      } else {
        await copyMutation.mutateAsync(text)
      }
    } catch {
      toast('Erro ao buscar texto da prestação', 'error')
    } finally {
      setCopyingId(null)
    }
  }

  const handleSendFromHistory = async (item: PrestacaoHistoricoItem) => {
    try {
      setSendingId(item.id)
      const text = await fetchHistoricoText(item)
      setSendPayload({ baseText: text })
      setSendModalOpen(true)
    } catch {
      toast('Erro ao buscar texto da prestação', 'error')
    } finally {
      setSendingId(null)
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

  const handleExportHistoryPdf = async (item: PrestacaoHistoricoItem) => {
    if (item.tipo === 'empresa') {
      try {
        const prestacao = await prestacaoService.getById(item.id)
        exportPrestacaoPdf(buildDailyReportFromPrestacao(prestacao))
      } catch {
        toast('Erro ao exportar PDF', 'error')
        return
      }
    } else {
      exportPrestacaoPdf({
        date: item.data,
        totalEntregas: item.totalEntregas,
        valorTotal: item.valorFinal,
        valorFinal: item.valorFinal,
        observacoes: null,
      })
    }
    toast('PDF exportado com sucesso', 'success')
  }

  const handleOpenEdit = async (item: PrestacaoHistoricoItem) => {
    if (item.tipo !== 'empresa') return

    try {
      const prestacao = await prestacaoService.getById(item.id)
      setEditingPrestacao(prestacao)
      setEditObservacoes(prestacao.observacoes ?? '')
      setEditRecalcular(false)
    } catch {
      toast('Erro ao carregar prestação para edição', 'error')
    }
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
    if (!deletingItem) return

    if (deletingItem.tipo === 'empresa') {
      await deleteMutation.mutateAsync(deletingItem.id)
      if (generatedResult?.prestacao.id === deletingItem.id) {
        setGeneratedResult(null)
      }
    } else if (deletingItem.tipo === 'cliente') {
      await deleteClienteMutation.mutateAsync(deletingItem.id)
      if (clienteGenerated?.prestacao.id === deletingItem.id) {
        setClienteGenerated(null)
      }
    }

    setDeletingItem(null)
  }

  const handleExportPreviewPdf = () => {
    if (prestacaoScope === 'motoboy') {
      if (!motoboyPreview || motoboyPreview.totalEntregas === 0) return
      exportPrestacaoPdf({
        date: motoboyPreview.data,
        totalEntregas: motoboyPreview.totalEntregas,
        valorTotal: motoboyPreview.valorTotal,
        entregasPagasPeloCliente: motoboyPreview.entregasPagasPeloCliente,
        valorPagasPeloCliente: motoboyPreview.valorPagasPeloCliente,
        valorPendencias: motoboyPreview.valorPendencias,
        valorFinal: motoboyPreview.valorFinal,
        totalPendencias: motoboyPreview.totalPendencias,
        observacoes: observacoes.trim() || null,
      })
    } else if (prestacaoScope === 'cliente') {
      if (!clientePreview || clientePreview.totalEntregas === 0) return
      exportPrestacaoPdf({
        date: clientePreview.data,
        totalEntregas: clientePreview.totalEntregas,
        valorTotal: clientePreview.valorTotal,
        valorFinal: clientePreview.valorFinal,
        observacoes: observacoes.trim() || null,
      })
    } else if (preview && preview.totalEntregas > 0) {
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
    } else {
      return
    }

    toast('PDF exportado com sucesso', 'success')
  }

  const activePreviewLoading =
    prestacaoScope === 'motoboy'
      ? motoboyPreviewQuery.isLoading
      : prestacaoScope === 'cliente'
        ? clientePreviewQuery.isLoading
        : previewQuery.isLoading

  const activePreviewError =
    prestacaoScope === 'motoboy'
      ? motoboyPreviewQuery.isError
      : prestacaoScope === 'cliente'
        ? clientePreviewQuery.isError
        : previewQuery.isError

  const scopeDescription = {
    empresa: 'Feche o dia da empresa com todos os motoboys agrupados na mensagem.',
    motoboy: 'Gere a prestação de um motoboy específico.',
    cliente: 'Gere a prestação de entregas para um cliente específico.',
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Prestação de Contas
          </h2>
          <p className="text-sm text-muted-foreground">
            {scopeDescription[prestacaoScope]}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <PrestacaoScopeSelect value={prestacaoScope} onChange={handleScopeChange} />
          {prestacaoScope === 'motoboy' ? (
            <MotoboySelect
              id="prestacao-motoboy"
              value={motoboyId}
              onChange={setMotoboyId}
              allowAll={false}
              label="Motoboy"
            />
          ) : null}
          {prestacaoScope === 'cliente' ? (
            <ClienteSelect
              data={selectedDate}
              value={nomeCliente}
              onChange={setNomeCliente}
              label="Cliente"
            />
          ) : null}
        </div>
      </div>

      <Card glass>
        <CardHeader>
          <CardTitle>
            {prestacaoScope === 'empresa'
              ? 'Gerar prestação do dia (empresa)'
              : prestacaoScope === 'motoboy'
                ? 'Gerar prestação do motoboy'
                : 'Gerar prestação do cliente'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={
              prestacaoScope === 'cliente'
                ? handleSubmitCliente
                : prestacaoScope === 'motoboy'
                  ? handleSubmitMotoboy
                  : handleGenerateEmpresa
            }
            className="space-y-4"
          >
            <Input
              label="Data da prestação"
              type="date"
              error={
                prestacaoScope === 'cliente'
                  ? clienteForm.formState.errors.data?.message
                  : empresaForm.formState.errors.data?.message
              }
              {...(prestacaoScope === 'cliente'
                ? clienteForm.register('data')
                : empresaForm.register('data'))}
            />

            {prestacaoScope === 'cliente' ? (
              <ClienteSelect
                data={selectedDate}
                value={nomeCliente}
                onChange={(value) => {
                  setNomeCliente(value)
                  clienteForm.setValue('nomeCliente', value, {
                    shouldValidate: true,
                  })
                }}
                layout="stack"
                error={clienteForm.formState.errors.nomeCliente?.message}
              />
            ) : null}

            {prestacaoScope === 'motoboy' && motoboyPreview?.statusExistente ? (
              <Badge
                variant={
                  motoboyStatusLabels[motoboyPreview.statusExistente].variant
                }
              >
                {motoboyStatusLabels[motoboyPreview.statusExistente].label}
              </Badge>
            ) : null}

            {prestacaoScope === 'cliente' && clientePreview?.prestacaoId ? (
              <Badge variant="warning">Já gerada para este cliente</Badge>
            ) : null}

            {activePreviewLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <StatCardSkeleton key={index} />
                ))}
              </div>
            ) : activePreviewError ? (
              <EmptyState
                icon={<IconTrending className="size-6" />}
                title="Não foi possível carregar a prévia"
                description="Verifique se a API está rodando para visualizar os totais."
              />
            ) : prestacaoScope === 'motoboy' ? (
              <MotoboyPreviewSection
                selectedDate={selectedDate}
                preview={motoboyPreview}
                hasNoDeliveries={Boolean(hasNoDeliveries)}
                onExportPdf={handleExportPreviewPdf}
              />
            ) : prestacaoScope === 'cliente' ? (
              <ClientePreviewSection
                selectedDate={selectedDate}
                preview={clientePreview}
                nomeCliente={nomeCliente}
                hasNoDeliveries={Boolean(hasNoDeliveries)}
                onExportPdf={handleExportPreviewPdf}
              />
            ) : (
              <EmpresaPreviewSection
                selectedDate={selectedDate}
                preview={preview}
                hasNoDeliveries={Boolean(hasNoDeliveries)}
                onExportPdf={handleExportPreviewPdf}
              />
            )}

            <Textarea
              label="Observações (opcional)"
              placeholder="Informações adicionais para o relatório..."
              error={
                prestacaoScope === 'cliente'
                  ? clienteForm.formState.errors.observacoes?.message
                  : empresaForm.formState.errors.observacoes?.message
              }
              {...(prestacaoScope === 'cliente'
                ? clienteForm.register('observacoes')
                : empresaForm.register('observacoes'))}
            />

            {prestacaoScope === 'empresa' ? (
              <MotoboySelect
                id="whatsapp-entregas-scope"
                value={whatsappEntregasScope}
                onChange={setWhatsappEntregasScope}
                label="Entregas na mensagem"
                allowAll
              />
            ) : null}

            <Button
              type="submit"
              size="lg"
              className="w-full sm:w-auto"
              isLoading={
                prestacaoScope === 'cliente'
                  ? submitClienteMutation.isPending
                  : prestacaoScope === 'motoboy'
                    ? submitMotoboyMutation.isPending
                    : generateMutation.isPending
              }
              disabled={
                prestacaoScope === 'cliente'
                  ? !canSubmitCliente || !nomeCliente
                  : prestacaoScope === 'motoboy'
                    ? !canSubmitMotoboy || !motoboyId
                    : hasPendingMotoboyApprovals
              }
            >
              {prestacaoScope === 'cliente'
                ? 'Gerar prestação do cliente'
                : prestacaoScope === 'motoboy'
                  ? motoboyPreview?.statusExistente === 'REJEITADA'
                    ? 'Reenviar para aprovação'
                    : 'Enviar prestação do motoboy'
                  : 'Gerar prestação do dia'}
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

      {generatedResult && prestacaoScope === 'empresa' ? (
        <div className="space-y-4">
          <PrestacaoResultCard result={generatedResult} />
          <MotoboySelect
            id="generated-whatsapp-scope"
            value={whatsappEntregasScope}
            onChange={setWhatsappEntregasScope}
            label="Entregas na mensagem"
            allowAll
          />
          <WhatsAppPreview
            text={empresaWhatsappText}
            onCopy={() => copyMutation.mutate(empresaWhatsappText)}
            onSend={() => {
              setSendPayload({
                baseText: empresaWhatsappText,
              })
              setSendModalOpen(true)
            }}
            onExportPdf={() => {
              const { prestacao } = generatedResult
              exportPrestacaoPdf({
                date: prestacao.data.slice(0, 10),
                totalEntregas: prestacao.totalEntregas,
                valorTotal: Number(prestacao.valorTotal),
                valorPendencias: Number(prestacao.valorPendencias),
                valorFinal: Number(prestacao.valorFinal),
                valorRepasseMotoboys: Number(prestacao.valorRepasseMotoboys),
                valorLiquido: Number(prestacao.valorLiquido),
                observacoes: prestacao.observacoes,
              })
              toast('PDF exportado com sucesso', 'success')
            }}
            isCopying={copyMutation.isPending}
          />
        </div>
      ) : null}

      {motoboyGenerated && prestacaoScope === 'motoboy' ? (
        <WhatsAppPreview
          text={motoboyGenerated.whatsappText}
          title="Texto da prestação do motoboy"
          onCopy={() => copyMotoboyMutation.mutate(motoboyGenerated.whatsappText)}
          onSend={() => {
            setSendPayload({ baseText: motoboyGenerated.whatsappText })
            setSendModalOpen(true)
          }}
          isCopying={copyMotoboyMutation.isPending}
        />
      ) : null}

      {clienteGenerated && prestacaoScope === 'cliente' ? (
        <WhatsAppPreview
          text={clienteGenerated.whatsappText}
          title="Texto da prestação do cliente"
          onCopy={() => copyClienteMutation.mutate(clienteGenerated.whatsappText)}
          onSend={() => {
            setSendPayload({ baseText: clienteGenerated.whatsappText })
            setSendModalOpen(true)
          }}
          isCopying={copyClienteMutation.isPending}
        />
      ) : null}

      <section className="rounded-2xl border border-border/60 bg-card/70 p-5 backdrop-blur-xl">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">Histórico</h3>
            <p className="text-sm text-muted-foreground">
              Prestações de empresa, motoboys e clientes.
            </p>
          </div>
          <PrestacaoHistoricoFilterSelect
            value={historyFilter}
            onChange={(value) => {
              setHistoryFilter(value)
              setHistoryPage(1)
            }}
          />
        </div>

        {prestacaoScope === 'empresa' ? (
          <div className="mb-4">
            <MotoboySelect
              id="historico-whatsapp-scope"
              value={whatsappEntregasScope}
              onChange={setWhatsappEntregasScope}
              label="Entregas na mensagem (empresa)"
              allowAll
            />
          </div>
        ) : null}

        {historicoQuery.isError ? (
          <EmptyState
            icon={<IconReceipt className="size-6" />}
            title="Erro ao carregar histórico"
            description="Não foi possível buscar as prestações."
          />
        ) : (
          <PrestacaoUnifiedHistory
            items={historicoQuery.data?.data ?? []}
            isLoading={historicoQuery.isLoading || historicoQuery.isFetching}
            page={historicoQuery.data?.meta.page ?? 1}
            totalPages={historicoQuery.data?.meta.totalPages ?? 1}
            onPageChange={setHistoryPage}
            onCopy={handleCopyFromHistory}
            onSend={handleSendFromHistory}
            onExportPdf={handleExportHistoryPdf}
            onEdit={handleOpenEdit}
            onDelete={setDeletingItem}
            copyingId={copyingId}
            sendingId={sendingId}
            deletingId={
              deleteMutation.isPending || deleteClienteMutation.isPending
                ? deletingItem?.id ?? null
                : null
            }
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
        open={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        title="Excluir prestação"
        description={
          deletingItem
            ? `Deseja excluir a prestação de ${formatPrestacaoDate(deletingItem.data)} (${deletingItem.titulo})?`
            : undefined
        }
        confirmLabel="Excluir"
        variant="danger"
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending || deleteClienteMutation.isPending}
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

function MotoboyPreviewSection({
  selectedDate,
  preview,
  hasNoDeliveries,
  onExportPdf,
}: {
  selectedDate: string
  preview: ReturnType<typeof usePrestacaoMotoboyPreview>['data']
  hasNoDeliveries: boolean
  onExportPdf: () => void
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border/60 bg-surface/20 p-4">
      <p className="text-sm font-medium">
        Prévia de {formatPrestacaoMotoboyDate(selectedDate)}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PreviewItem label="Entregas" value={String(preview?.totalEntregas ?? 0)} />
        <PreviewItem
          label="Valor das entregas"
          value={formatCurrency(preview?.valorTotal ?? 0)}
        />
        <PreviewItem
          label="Repasse pendente"
          value={formatCurrency(preview?.valorPendencias ?? 0)}
        />
        <PreviewItem
          label="Total a receber"
          value={formatCurrency(preview?.valorFinal ?? 0)}
          highlight
        />
      </div>
      {hasNoDeliveries ? (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          Nenhuma entrega deste motoboy em{' '}
          {formatPrestacaoMotoboyDate(selectedDate)}.
        </p>
      ) : (
        <div className="flex justify-end">
          <Button type="button" variant="secondary" onClick={onExportPdf}>
            Exportar PDF
          </Button>
        </div>
      )}
    </div>
  )
}

function ClientePreviewSection({
  selectedDate,
  preview,
  nomeCliente,
  hasNoDeliveries,
  onExportPdf,
}: {
  selectedDate: string
  preview: ReturnType<typeof usePrestacaoClientePreview>['data']
  nomeCliente: string
  hasNoDeliveries: boolean
  onExportPdf: () => void
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border/60 bg-surface/20 p-4">
      <p className="text-sm font-medium">
        Prévia de {formatPrestacaoClienteDate(selectedDate)}
        {nomeCliente ? ` — ${nomeCliente}` : ''}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <PreviewItem label="Entregas" value={String(preview?.totalEntregas ?? 0)} />
        <PreviewItem
          label="Valor das entregas"
          value={formatCurrency(preview?.valorTotal ?? 0)}
        />
        <PreviewItem
          label="Total"
          value={formatCurrency(preview?.valorFinal ?? 0)}
          highlight
        />
      </div>
      {hasNoDeliveries && nomeCliente ? (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          Nenhuma entrega para {nomeCliente} em{' '}
          {formatPrestacaoClienteDate(selectedDate)}.
        </p>
      ) : nomeCliente ? (
        <div className="flex justify-end">
          <Button type="button" variant="secondary" onClick={onExportPdf}>
            Exportar PDF
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Selecione um cliente.</p>
      )}
    </div>
  )
}

function EmpresaPreviewSection({
  selectedDate,
  preview,
  hasNoDeliveries,
  onExportPdf,
}: {
  selectedDate: string
  preview: ReturnType<typeof usePrestacaoPreview>['data']
  hasNoDeliveries: boolean
  onExportPdf: () => void
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border/60 bg-surface/20 p-4">
      <p className="text-sm font-medium">
        Prévia de {formatPrestacaoDate(selectedDate)}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <PreviewItem label="Entregas" value={String(preview?.totalEntregas ?? 0)} />
        <PreviewItem
          label="Valor das entregas"
          value={formatCurrency(preview?.valorTotal ?? 0)}
        />
        <PreviewItem
          label="Pendências em aberto"
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
      {hasNoDeliveries ? (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          Nenhuma entrega registrada para {formatPrestacaoDate(selectedDate)}.
        </p>
      ) : (
        <div className="flex justify-end">
          <Button type="button" variant="secondary" onClick={onExportPdf}>
            Exportar PDF
          </Button>
        </div>
      )}
    </div>
  )
}
