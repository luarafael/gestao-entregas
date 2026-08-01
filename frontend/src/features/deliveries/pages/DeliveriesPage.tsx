import { useState } from 'react'
import { Modal, Pagination, EmptyState } from '@/shared/components/ui'
import { IconPackage } from '@/shared/components/icons'
import { useDebounce } from '@/shared/hooks'
import {
  useCreateDelivery,
  useDeleteDelivery,
  useDeliveries,
  useUpdateDelivery,
} from '../hooks/useDeliveries'
import { DeliveryForm } from '../components/DeliveryForm'
import { DeliveryFiltersBar } from '../components/DeliveryFiltersBar'
import { DeliveryTable } from '../components/DeliveryTable'
import type { DeliveryFilters, DeliveryFormData } from '../schemas/delivery.schema'
import type { Entrega } from '@/shared/types/api.types'

const initialFilters: DeliveryFilters = {
  page: 1,
  limit: 10,
  search: '',
  filter: 'today',
  sortBy: 'horario',
  sortOrder: 'desc',
}

export function DeliveriesPage() {
  const [filters, setFilters] = useState<DeliveryFilters>(initialFilters)
  const [editingDelivery, setEditingDelivery] = useState<Entrega | null>(null)
  const [deletingDelivery, setDeletingDelivery] = useState<Entrega | null>(null)

  const debouncedSearch = useDebounce(filters.search)

  const queryFilters: DeliveryFilters = {
    ...filters,
    search: debouncedSearch,
  }

  const { data, isLoading, isFetching, isError, refetch } = useDeliveries(queryFilters)
  const createMutation = useCreateDelivery()
  const updateMutation = useUpdateDelivery()
  const deleteMutation = useDeleteDelivery()

  const deliveries = data?.data ?? []
  const meta = data?.meta

  const updateFilters = (partial: Partial<DeliveryFilters>) => {
    setFilters((current) => ({
      ...current,
      ...partial,
      page: partial.page ?? (partial.search !== undefined || partial.filter ? 1 : current.page),
    }))
  }

  const handleSubmit = async (formData: DeliveryFormData) => {
    if (editingDelivery) {
      await updateMutation.mutateAsync({ id: editingDelivery.id, data: formData })
      setEditingDelivery(null)
    } else {
      await createMutation.mutateAsync(formData)
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
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Entregas</h2>
        <p className="text-sm text-muted-foreground">
          Cadastre, edite e acompanhe todas as entregas do dia.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <DeliveryForm
          editingDelivery={editingDelivery}
          onSubmit={handleSubmit}
          onCancelEdit={() => setEditingDelivery(null)}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />

        <div className="space-y-4 rounded-2xl border border-border/60 bg-card/70 p-5 backdrop-blur-xl">
          <DeliveryFiltersBar
            filters={filters}
            onSearchChange={(search) => updateFilters({ search, page: 1 })}
            onFilterChange={(filter) => updateFilters({ filter, page: 1 })}
            onSortByChange={(sortBy) => updateFilters({ sortBy, page: 1 })}
            onSortOrderChange={(sortOrder) => updateFilters({ sortOrder, page: 1 })}
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
