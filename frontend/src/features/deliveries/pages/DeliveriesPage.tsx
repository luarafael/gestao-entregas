import { useState } from 'react'
import { Modal, Pagination, EmptyState } from '@/shared/components/ui'
import { IconPackage } from '@/shared/components/icons'
import { cn } from '@/shared/utils/cn'
import { useDebounce } from '@/shared/hooks'
import {
  useCreateDelivery,
  useDeleteDelivery,
  useDeliveries,
  useUpdateDelivery,
} from '../hooks/useDeliveries'
import { DeliveryMotoboyForm } from '../components/DeliveryMotoboyForm'
import { DeliveryClienteForm } from '../components/DeliveryClienteForm'
import { DeliveryFiltersBar } from '../components/DeliveryFiltersBar'
import { DeliveryTable } from '../components/DeliveryTable'
import { routingService } from '@/features/routing/services/routing.service'
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
  const [viewMode, setViewMode] = useState<DeliveryViewMode>('motoboy')
  const [filters, setFilters] = useState<DeliveryFilters>(initialFilters)
  const [editingDelivery, setEditingDelivery] = useState<Entrega | null>(null)
  const [deletingDelivery, setDeletingDelivery] = useState<Entrega | null>(null)

  const debouncedSearch = useDebounce(filters.search)

  const queryFilters: DeliveryFilters = {
    ...filters,
    search: debouncedSearch,
    ...(viewMode === 'cliente'
      ? { apenasComCliente: true, motoboyId: undefined }
      : { nomeCliente: undefined, apenasComCliente: undefined }),
  }

  const { data, isLoading, isFetching, isError, refetch } = useDeliveries(queryFilters)
  const createMutation = useCreateDelivery(viewMode)
  const updateMutation = useUpdateDelivery(viewMode)
  const deleteMutation = useDeleteDelivery()

  const deliveries = data?.data ?? []
  const meta = data?.meta

  const updateFilters = (partial: Partial<DeliveryFilters>) => {
    setFilters((current) => ({
      ...current,
      ...partial,
      page:
        partial.page ??
        (partial.search !== undefined ||
        partial.filter !== undefined ||
        partial.motoboyId !== undefined ||
        partial.nomeCliente !== undefined
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
      nomeCliente: undefined,
    }))
  }

  const handleMotoboySubmit = async (formData: DeliveryMotoboyFormData) => {
    if (editingDelivery) {
      await updateMutation.mutateAsync({ id: editingDelivery.id, data: formData })
      await syncPlannerIfNeeded(editingDelivery.id, formData)
      setEditingDelivery(null)
    } else {
      await createMutation.mutateAsync(formData)
    }
  }

  const handleClienteSubmit = async (formData: DeliveryClienteFormData) => {
    if (editingDelivery) {
      await updateMutation.mutateAsync({ id: editingDelivery.id, data: formData })
      await syncPlannerIfNeeded(editingDelivery.id, formData)
      setEditingDelivery(null)
    } else {
      await createMutation.mutateAsync(formData)
    }
  }

  const syncPlannerIfNeeded = async (
    entregaId: string,
    formData: DeliveryMotoboyFormData | DeliveryClienteFormData,
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

  const handleConfirmDelete = async () => {
    if (!deletingDelivery) return
    await deleteMutation.mutateAsync(deletingDelivery.id)
    setDeletingDelivery(null)
    if (editingDelivery?.id === deletingDelivery.id) {
      setEditingDelivery(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Entregas</h2>
          <p className="text-sm text-muted-foreground">
            {viewMode === 'motoboy'
              ? 'Cadastre corridas do motoboy e filtre por motoboy.'
              : 'Cadastre entregas para clientes e acompanhe o histórico por cliente.'}
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
            isSubmitting={createMutation.isPending || updateMutation.isPending}
          />
        ) : (
          <DeliveryClienteForm
            editingDelivery={editingDelivery}
            onSubmit={handleClienteSubmit}
            onCancelEdit={() => setEditingDelivery(null)}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
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
            onClienteChange={(nomeCliente) =>
              updateFilters({ nomeCliente, page: 1 })
            }
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
    </div>
  )
}
