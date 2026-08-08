import { useState } from 'react'
import { Modal, Pagination, EmptyState } from '@/shared/components/ui'
import { IconUsers } from '@/shared/components/icons'
import { useDebounce } from '@/shared/hooks'
import {
  useCreateMotoboy,
  useDeleteMotoboy,
  useMotoboysList,
  useSetMotoboyAtivo,
  useUpdateMotoboy,
} from '../hooks/useMotoboys'
import { MotoboyForm } from '../components/MotoboyForm'
import { MotoboyFiltersBar } from '../components/MotoboyFiltersBar'
import { MotoboyTable } from '../components/MotoboyTable'
import type {
  MotoboyAtivoFilter,
  MotoboyFilters,
  MotoboyFormData,
} from '../schemas/motoboy.schema'
import type { Motoboy } from '../types'

const initialFilters: MotoboyFilters = {
  page: 1,
  limit: 10,
  search: '',
  ativo: 'all',
}

export function MotoboysPage() {
  const [filters, setFilters] = useState<MotoboyFilters>(initialFilters)
  const [editingMotoboy, setEditingMotoboy] = useState<Motoboy | null>(null)
  const [togglingMotoboy, setTogglingMotoboy] = useState<Motoboy | null>(null)
  const [deletingMotoboy, setDeletingMotoboy] = useState<Motoboy | null>(null)

  const debouncedSearch = useDebounce(filters.search)

  const queryFilters: MotoboyFilters = {
    ...filters,
    search: debouncedSearch,
  }

  const { data, isLoading, isFetching, isError, refetch } =
    useMotoboysList(queryFilters)
  const createMutation = useCreateMotoboy()
  const updateMutation = useUpdateMotoboy()
  const setAtivoMutation = useSetMotoboyAtivo()
  const deleteMutation = useDeleteMotoboy()

  const items = data?.data ?? []
  const meta = data?.meta

  const updateFilters = (partial: Partial<MotoboyFilters>) => {
    setFilters((current) => ({
      ...current,
      ...partial,
      page:
        partial.page ??
        (partial.search !== undefined || partial.ativo !== undefined
          ? 1
          : current.page),
    }))
  }

  const handleSubmit = async (formData: MotoboyFormData) => {
    if (editingMotoboy) {
      await updateMutation.mutateAsync({ id: editingMotoboy.id, data: formData })
      setEditingMotoboy(null)
    } else {
      await createMutation.mutateAsync(formData)
    }
  }

  const handleConfirmToggle = async () => {
    if (!togglingMotoboy) return
    await setAtivoMutation.mutateAsync({
      id: togglingMotoboy.id,
      ativo: !togglingMotoboy.ativo,
    })
    if (editingMotoboy?.id === togglingMotoboy.id && togglingMotoboy.ativo) {
      setEditingMotoboy(null)
    }
    setTogglingMotoboy(null)
  }

  const handleConfirmDelete = async () => {
    if (!deletingMotoboy) return

    await deleteMutation.mutateAsync(deletingMotoboy.id)

    if (editingMotoboy?.id === deletingMotoboy.id) {
      setEditingMotoboy(null)
    }

    setDeletingMotoboy(null)
  }

  return (
    <div className="space-y-6 min-w-0 max-w-full">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Motoboys</h2>
        <p className="text-sm text-muted-foreground">
          Gerencie os funcionários da empresa: crie, edite, desative, reative ou
          exclua usuários motoboy.
        </p>
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <MotoboyForm
          editingMotoboy={editingMotoboy}
          onSubmit={handleSubmit}
          onCancelEdit={() => setEditingMotoboy(null)}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />

        <div className="min-w-0 space-y-4 overflow-hidden rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur-xl sm:p-5">
          <MotoboyFiltersBar
            filters={filters}
            onSearchChange={(search) => updateFilters({ search, page: 1 })}
            onAtivoChange={(ativo: MotoboyAtivoFilter) =>
              updateFilters({ ativo, page: 1 })
            }
          />

          {isError ? (
            <EmptyState
              icon={<IconUsers className="size-6" />}
              title="Erro ao carregar motoboys"
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
            <MotoboyTable
              items={items}
              isLoading={isLoading}
              isFetching={isFetching}
              onEdit={setEditingMotoboy}
              onToggleAtivo={setTogglingMotoboy}
              onDelete={setDeletingMotoboy}
            />
          )}

          {meta && meta.totalPages > 1 ? (
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              onPageChange={(page) => updateFilters({ page })}
            />
          ) : null}
        </div>
      </div>

      <Modal
        open={Boolean(togglingMotoboy)}
        onClose={() => setTogglingMotoboy(null)}
        title={
          togglingMotoboy?.ativo ? 'Desativar motoboy' : 'Reativar motoboy'
        }
        description={
          togglingMotoboy?.ativo
            ? `Desativar ${togglingMotoboy.nome}? O usuário não poderá mais entrar no sistema.`
            : `Reativar ${togglingMotoboy?.nome}? O usuário voltará a poder entrar no sistema.`
        }
        confirmLabel={togglingMotoboy?.ativo ? 'Desativar' : 'Reativar'}
        variant={togglingMotoboy?.ativo ? 'danger' : 'default'}
        isLoading={setAtivoMutation.isPending}
        onConfirm={handleConfirmToggle}
      />

      <Modal
        open={Boolean(deletingMotoboy)}
        onClose={() => setDeletingMotoboy(null)}
        title="Excluir motoboy"
        description={
          deletingMotoboy
            ? `Excluir ${deletingMotoboy.nome} permanentemente? Entregas e rotas antigas permanecem no sistema, mas sem vínculo com este usuário.`
            : undefined
        }
        confirmLabel="Excluir"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
