import { useState } from 'react'
import { Modal, Pagination, EmptyState } from '@/shared/components/ui'
import { IconClock } from '@/shared/components/icons'
import { useDebounce } from '@/shared/hooks'
import { useIsAdmin } from '@/features/auth/hooks/useIsAdmin'
import {
  useCreatePending,
  useDeletePending,
  usePendingList,
  useUpdatePending,
} from '../hooks/usePending'
import { PendingForm } from '../components/PendingForm'
import { PendingFiltersBar } from '../components/PendingFiltersBar'
import { PendingTable } from '../components/PendingTable'
import type { PendingFilters, PendingFormData } from '../schemas/pending.schema'
import type { Pendencia } from '@/shared/types/api.types'

const initialFilters: PendingFilters = {
  page: 1,
  limit: 10,
  search: '',
}

export function PendingPage() {
  const isAdmin = useIsAdmin()
  const [filters, setFilters] = useState<PendingFilters>(initialFilters)
  const [editingPending, setEditingPending] = useState<Pendencia | null>(null)
  const [deletingPending, setDeletingPending] = useState<Pendencia | null>(null)

  const debouncedSearch = useDebounce(filters.search)

  const queryFilters: PendingFilters = {
    ...filters,
    search: debouncedSearch,
  }

  const { data, isLoading, isFetching, isError, refetch } = usePendingList(queryFilters)
  const createMutation = useCreatePending()
  const updateMutation = useUpdatePending()
  const deleteMutation = useDeletePending()

  const items = data?.data ?? []
  const meta = data?.meta

  const updateFilters = (partial: Partial<PendingFilters>) => {
    setFilters((current) => ({
      ...current,
      ...partial,
      page:
        partial.page ??
        (partial.search !== undefined ||
        partial.status !== undefined ||
        partial.motoboyId !== undefined
          ? 1
          : current.page),
    }))
  }

  const handleSubmit = async (formData: PendingFormData) => {
    if (editingPending) {
      await updateMutation.mutateAsync({ id: editingPending.id, data: formData })
      setEditingPending(null)
    } else {
      await createMutation.mutateAsync(formData)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingPending) return
    await deleteMutation.mutateAsync(deletingPending.id)
    setDeletingPending(null)
    if (editingPending?.id === deletingPending.id) {
      setEditingPending(null)
    }
  }

  return (
    <div className="space-y-6 min-w-0 max-w-full">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Pendências</h2>
        <p className="text-sm text-muted-foreground">
          {isAdmin
            ? 'Cadastre pendências delegando ao motoboy e filtre o histórico por funcionário.'
            : 'Registre quando o administrador ainda não repassou o valor das suas entregas.'}
        </p>
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <PendingForm
          editingPending={editingPending}
          onSubmit={handleSubmit}
          onCancelEdit={() => setEditingPending(null)}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />

        <div className="min-w-0 space-y-4 overflow-hidden rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur-xl sm:p-5">
          <PendingFiltersBar
            filters={filters}
            onSearchChange={(search) => updateFilters({ search, page: 1 })}
            onStatusChange={(status) => updateFilters({ status, page: 1 })}
            onMotoboyChange={(motoboyId) => updateFilters({ motoboyId, page: 1 })}
          />

          {isError ? (
            <EmptyState
              icon={<IconClock className="size-6" />}
              title="Erro ao carregar pendências"
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
            <PendingTable
              items={items}
              isLoading={isLoading}
              isFetching={isFetching}
              onEdit={setEditingPending}
              onDelete={setDeletingPending}
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
        open={Boolean(deletingPending)}
        onClose={() => setDeletingPending(null)}
        title="Excluir pendência"
        description={
          deletingPending
            ? `Tem certeza que deseja excluir "${deletingPending.descricao}"?`
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
