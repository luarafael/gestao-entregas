import { useMemo, useState } from 'react'
import { Modal, Pagination, EmptyState, Button } from '@/shared/components/ui'
import { IconPackage, IconWhatsApp } from '@/shared/components/icons'
import { cn } from '@/shared/utils/cn'
import { useDebounce } from '@/shared/hooks'
import {
  useCreateClienteDelivery,
  useCreateMotoboyDelivery,
  useDeleteDelivery,
  useDeliveries,
  useImportClienteDeliveries,
  useUpdateClienteDelivery,
  useUpdateMotoboyDelivery,
} from '../hooks/useDeliveries'
import { DeliveryMotoboyForm } from '../components/DeliveryMotoboyForm'
import { DeliveryClienteForm } from '../components/DeliveryClienteForm'
import { DeliveryFiltersBar } from '../components/DeliveryFiltersBar'
import { DeliveryTable } from '../components/DeliveryTable'
import { routingService } from '@/features/routing/services/routing.service'
import {
  WhatsAppSendModal,
  type WhatsAppSendPayload,
} from '@/features/accounting/components/WhatsAppSendModal'
import { MotoboySelect } from '@/shared/components/MotoboySelect'
import { useIsAdmin } from '@/features/auth/hooks/useIsAdmin'
import { deliveryService } from '../services/delivery.service'
import { buildClienteEntregasMotoboyWhatsAppText } from '../utils/clienteEntregasWhatsApp'
import type {
  DeliveryClienteFormData,
  DeliveryFilters,
  DeliveryMotoboyFormData,
  DeliveryViewMode,
} from '../schemas/delivery.schema'
import type { Entrega } from '@/shared/types/api.types'

const initialFilters: DeliveryFilters = {
  page: 1,
  limit: 10,
  search: '',
  filter: 'today',
  sortBy: 'horario',
  sortOrder: 'desc',
}

const VIEW_MODE_OPTIONS: { value: DeliveryViewMode; label: string }[] = [
  { value: 'motoboy', label: 'Motoboy' },
  { value: 'cliente', label: 'Cliente' },
]

export function DeliveriesPage() {
  const isAdmin = useIsAdmin()
  const [viewMode, setViewMode] = useState<DeliveryViewMode>('motoboy')
  const [filters, setFilters] = useState<DeliveryFilters>(initialFilters)
  const [editingDelivery, setEditingDelivery] = useState<Entrega | null>(null)
  const [deletingDelivery, setDeletingDelivery] = useState<Entrega | null>(null)
  const [whatsAppPayload, setWhatsAppPayload] = useState<WhatsAppSendPayload | null>(null)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importMotoboyId, setImportMotoboyId] = useState('')
  const [importIds, setImportIds] = useState<string[]>([])
  const [isPreparingWhatsApp, setIsPreparingWhatsApp] = useState(false)
  const [isPreparingImport, setIsPreparingImport] = useState(false)

  const debouncedSearch = useDebounce(filters.search)

  const queryFilters: DeliveryFilters = {
    ...filters,
    search: debouncedSearch,
    origemCadastro: viewMode === 'cliente' ? 'CLIENTE' : 'MOTOBOY',
    motoboyId: viewMode === 'cliente' ? undefined : filters.motoboyId,
  }

  const { data, isLoading, isFetching, isError, refetch } = useDeliveries(queryFilters)
  const createMotoboyMutation = useCreateMotoboyDelivery()
  const updateMotoboyMutation = useUpdateMotoboyDelivery()
  const createClienteMutation = useCreateClienteDelivery()
  const updateClienteMutation = useUpdateClienteDelivery()
  const importMutation = useImportClienteDeliveries()
  const deleteMutation = useDeleteDelivery()

  const deliveries = data?.data ?? []
  const meta = data?.meta

  const importableCount = useMemo(
    () => deliveries.filter((d) => !d.entregaMotoboyId).length,
    [deliveries],
  )

  const fetchImportableIds = async () => {
    const result = await deliveryService.list({
      ...queryFilters,
      page: 1,
      limit: 100,
    })
    return result.data.filter((d) => !d.entregaMotoboyId).map((d) => d.id)
  }

  const updateFilters = (partial: Partial<DeliveryFilters>) => {
    setFilters((current) => ({
      ...current,
      ...partial,
      page:
        partial.page ??
        (partial.search !== undefined ||
        partial.filter !== undefined ||
        partial.motoboyId !== undefined
          ? 1
          : current.page),
    }))
  }

  const handleViewModeChange = (mode: DeliveryViewMode) => {
    setViewMode(mode)
    setEditingDelivery(null)
    setFilters((current) => ({
      ...current,
      page: 1,
      motoboyId: undefined,
    }))
  }

  const handleMotoboySubmit = async (formData: DeliveryMotoboyFormData) => {
    if (editingDelivery) {
      await updateMotoboyMutation.mutateAsync({ id: editingDelivery.id, data: formData })
      await syncPlannerIfNeeded(editingDelivery.id, formData)
      setEditingDelivery(null)
    } else {
      await createMotoboyMutation.mutateAsync(formData)
    }
  }

  const handleClienteSubmit = async (formData: DeliveryClienteFormData) => {
    if (editingDelivery) {
      await updateClienteMutation.mutateAsync({ id: editingDelivery.id, data: formData })
      setEditingDelivery(null)
    } else {
      await createClienteMutation.mutateAsync(formData)
    }
  }

  const syncPlannerIfNeeded = async (
    entregaId: string,
    formData: DeliveryMotoboyFormData,
  ) => {
    try {
      const linked = await routingService.findByEntrega(entregaId)
      if (linked.length === 0) return

      const shouldSync = window.confirm(
        'Esta entrega faz parte de uma rota planejada. Deseja atualizar também no Planejador?',
      )
      if (!shouldSync) return

      await routingService.syncEntrega({
        entregaId,
        cliente: formData.nomeCliente || null,
        endereco: [formData.endereco, formData.bairro, formData.cidade]
          .filter(Boolean)
          .join(' - '),
        bairro: formData.bairro,
        observacao: formData.observacao || null,
        valorEntrega: formData.valorEntrega,
      })
    } catch {
      // Sync is best-effort; delivery update already succeeded.
    }
  }

  const handleWhatsAppClick = async () => {
    setIsPreparingWhatsApp(true)
    try {
      const result = await deliveryService.list({
        ...queryFilters,
        page: 1,
        limit: 100,
      })
      setWhatsAppPayload({
        baseText: buildClienteEntregasMotoboyWhatsAppText(result.data),
      })
    } finally {
      setIsPreparingWhatsApp(false)
    }
  }

  const handleImportClick = async () => {
    setIsPreparingImport(true)
    try {
      const ids = await fetchImportableIds()
      if (ids.length === 0) return
      setImportIds(ids)
      if (isAdmin) {
        setImportModalOpen(true)
        return
      }
      await importMutation.mutateAsync({ ids })
    } finally {
      setIsPreparingImport(false)
    }
  }

  const handleConfirmImport = async () => {
    if (isAdmin && !importMotoboyId.trim()) return
    await importMutation.mutateAsync({
      ids: importIds,
      motoboyId: isAdmin ? importMotoboyId : undefined,
    })
    setImportModalOpen(false)
    setImportMotoboyId('')
    setImportIds([])
  }

  const handleConfirmDelete = async () => {
    if (!deletingDelivery) return
    await deleteMutation.mutateAsync(deletingDelivery.id)
    setDeletingDelivery(null)
    if (editingDelivery?.id === deletingDelivery.id) {
      setEditingDelivery(null)
    }
  }

  const isSubmitting =
    viewMode === 'motoboy'
      ? createMotoboyMutation.isPending || updateMotoboyMutation.isPending
      : createClienteMutation.isPending || updateClienteMutation.isPending

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Entregas</h2>
          <p className="text-sm text-muted-foreground">
            {viewMode === 'motoboy'
              ? 'Cadastre corridas do motoboy e filtre por motoboy.'
              : 'Cadastre pedidos de clientes, envie ao motoboy via WhatsApp e importe para rotas.'}
          </p>
        </div>

        <div className="flex rounded-xl border border-border/60 bg-surface/40 p-1">
          {VIEW_MODE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleViewModeChange(option.value)}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                viewMode === option.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        {viewMode === 'motoboy' ? (
          <DeliveryMotoboyForm
            editingDelivery={editingDelivery}
            onSubmit={handleMotoboySubmit}
            onCancelEdit={() => setEditingDelivery(null)}
            isSubmitting={isSubmitting}
          />
        ) : (
          <DeliveryClienteForm
            editingDelivery={editingDelivery}
            onSubmit={handleClienteSubmit}
            onCancelEdit={() => setEditingDelivery(null)}
            isSubmitting={isSubmitting}
          />
        )}

        <div className="space-y-4 rounded-2xl border border-border/60 bg-card/70 p-5 backdrop-blur-xl">
          <DeliveryFiltersBar
            viewMode={viewMode}
            filters={filters}
            onSearchChange={(search) => updateFilters({ search, page: 1 })}
            onFilterChange={(filter) => updateFilters({ filter, page: 1 })}
            onSortByChange={(sortBy) => updateFilters({ sortBy, page: 1 })}
            onSortOrderChange={(sortOrder) => updateFilters({ sortOrder, page: 1 })}
            onMotoboyChange={(motoboyId) => updateFilters({ motoboyId, page: 1 })}
          />

          {isError ? (
            <EmptyState
              icon={<IconPackage className="size-6" />}
              title="Erro ao carregar entregas"
              description="Não foi possível buscar a listagem. Verifique se a API está rodando."
              action={
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Tentar novamente
                </button>
              }
            />
          ) : (
            <DeliveryTable
              viewMode={viewMode}
              deliveries={deliveries}
              isLoading={isLoading}
              isFetching={isFetching}
              onEdit={setEditingDelivery}
              onDelete={setDeletingDelivery}
            />
          )}

          {viewMode === 'cliente' ? (
            <div className="flex flex-wrap gap-2 border-t border-border/50 pt-4">
              <Button
                variant="secondary"
                onClick={() => void handleWhatsAppClick()}
                isLoading={isPreparingWhatsApp}
                disabled={deliveries.length === 0}
              >
                <IconWhatsApp className="mr-2 size-4" />
                Enviar pedidos via WhatsApp
              </Button>
              <Button
                variant="secondary"
                onClick={() => void handleImportClick()}
                isLoading={importMutation.isPending || isPreparingImport}
                disabled={importableCount === 0 && !isPreparingImport}
              >
                Importar para Motoboy
              </Button>
            </div>
          ) : null}

          {meta ? (
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              onPageChange={(page) => updateFilters({ page })}
            />
          ) : null}
        </div>
      </div>

      <Modal
        open={Boolean(deletingDelivery)}
        onClose={() => setDeletingDelivery(null)}
        title="Excluir entrega"
        description={
          deletingDelivery
            ? `Tem certeza que deseja excluir a entrega de ${deletingDelivery.nomeCliente ?? deletingDelivery.bairro}?`
            : undefined
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
      />

      <Modal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Importar para Motoboy"
        description={`${importIds.length} pedido(s) serão copiados para a aba Motoboy e poderão ser usados no Planejador de rotas.`}
        confirmLabel="Importar"
        cancelLabel="Cancelar"
        isLoading={importMutation.isPending}
        onConfirm={handleConfirmImport}
      >
        <MotoboySelect
          id="import-cliente-motoboy"
          label="Motoboy"
          layout="stack"
          allowAll={false}
          value={importMotoboyId}
          onChange={setImportMotoboyId}
        />
      </Modal>

      <WhatsAppSendModal
        open={Boolean(whatsAppPayload)}
        onClose={() => setWhatsAppPayload(null)}
        payload={whatsAppPayload}
      />
    </div>
  )
}
