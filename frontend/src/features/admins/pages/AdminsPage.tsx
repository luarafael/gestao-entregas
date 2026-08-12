import { useState } from 'react'
import {
  Badge,
  Button,
  EmptyState,
  MetaChip,
  MetaField,
  Modal,
  PageHeader,
  PageHeaderActions,
  PagePanel,
  PageShell,
  PAGE_CARD_ARTICLE,
  Pagination,
  TableSkeleton,
} from '@/shared/components/ui'
import { IconUser } from '@/shared/components/icons'
import { ProfileAvatar } from '@/features/auth/components/ProfileAvatar'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { useDebounce } from '@/shared/hooks'
import { cn } from '@/shared/utils/cn'
import { formatDateBR } from '@/shared/utils/format'
import {
  useAdminsList,
  useCreateAdmin,
  useDeleteAdmin,
  useSetAdminAtivo,
  useUpdateAdmin,
} from '../hooks/useAdmins'
import { AdminForm } from '../components/AdminForm'
import { AdminFiltersBar } from '../components/AdminFiltersBar'
import type {
  AdminAtivoFilter,
  AdminFilters,
  AdminFormData,
} from '../schemas/admin.schema'
import type { AdminUser } from '../types'

const initialFilters: AdminFilters = {
  page: 1,
  limit: 10,
  search: '',
  ativo: 'all',
}

export function AdminsPage() {
  const currentUserId = useAuthStore((state) => state.user?.id)
  const [filters, setFilters] = useState<AdminFilters>(initialFilters)
  const [formAdmin, setFormAdmin] = useState<AdminUser | null | 'new'>(null)
  const [togglingAdmin, setTogglingAdmin] = useState<AdminUser | null>(null)
  const [deletingAdmin, setDeletingAdmin] = useState<AdminUser | null>(null)

  const debouncedSearch = useDebounce(filters.search)

  const queryFilters: AdminFilters = {
    ...filters,
    search: debouncedSearch,
  }

  const { data, isLoading, isFetching, isError, refetch } =
    useAdminsList(queryFilters)
  const createMutation = useCreateAdmin()
  const updateMutation = useUpdateAdmin()
  const setAtivoMutation = useSetAdminAtivo()
  const deleteMutation = useDeleteAdmin()

  const items = (data?.data ?? []).filter((item) => item.id !== currentUserId)
  const meta = data?.meta
  const isFormOpen = formAdmin !== null
  const editingAdmin = formAdmin === 'new' ? null : formAdmin

  const updateFilters = (partial: Partial<AdminFilters>) => {
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

  const handleSubmit = async (formData: AdminFormData) => {
    if (editingAdmin) {
      await updateMutation.mutateAsync({ id: editingAdmin.id, data: formData })
    } else {
      await createMutation.mutateAsync(formData)
    }
    setFormAdmin(null)
  }

  const handleConfirmToggle = async () => {
    if (!togglingAdmin) return
    await setAtivoMutation.mutateAsync({
      id: togglingAdmin.id,
      ativo: !togglingAdmin.ativo,
    })
    if (formAdmin !== null && formAdmin !== 'new' && formAdmin.id === togglingAdmin.id && togglingAdmin.ativo) {
      setFormAdmin(null)
    }
    setTogglingAdmin(null)
  }

  const handleConfirmDelete = async () => {
    if (!deletingAdmin) return

    await deleteMutation.mutateAsync(deletingAdmin.id)

    if (formAdmin !== null && formAdmin !== 'new' && formAdmin.id === deletingAdmin.id) {
      setFormAdmin(null)
    }

    setDeletingAdmin(null)
  }

  return (
    <PageShell density="compact">
      <PageHeader
        title="Administradores"
        description="Gerencie logins adicionais com o mesmo acesso administrativo que o seu. O administrador principal (Railway) não aparece nesta lista."
      >
        <PageHeaderActions>
          <Button onClick={() => setFormAdmin('new')}>Novo administrador</Button>
        </PageHeaderActions>
      </PageHeader>

      <PagePanel density="compact">
        <AdminFiltersBar
          filters={filters}
          onSearchChange={(search) => updateFilters({ search, page: 1 })}
          onAtivoChange={(ativo: AdminAtivoFilter) =>
            updateFilters({ ativo, page: 1 })
          }
        />

        {isError ? (
          <EmptyState
            icon={<IconUser className="size-6" />}
            title="Erro ao carregar administradores"
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
        ) : isLoading ? (
          <TableSkeleton rows={4} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<IconUser className="size-6" />}
            title="Nenhum administrador encontrado"
            description="Adicione um administrador extra com o botão acima."
            action={
              <Button size="sm" onClick={() => setFormAdmin('new')}>
                Novo administrador
              </Button>
            }
          />
        ) : (
          <div
            className={cn(
              'min-w-0 space-y-3 transition-opacity',
              isFetching && 'opacity-60',
            )}
          >
            {items.map((item) => (
                <article key={item.id} className={cn(PAGE_CARD_ARTICLE, 'min-w-0')}>
                  <div className="grid min-w-0 grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto_minmax(0,0.9fr)]">
                    <MetaField label="Nome" className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <ProfileAvatar
                          userId={item.id}
                          nome={item.nome}
                          fotoUrl={item.fotoPerfil}
                          size="sm"
                        />
                        <MetaChip
                          tone="company"
                          className="min-w-0 max-w-full"
                          title={item.nome}
                        >
                          {item.nome}
                        </MetaChip>
                      </div>
                    </MetaField>

                    <MetaField label="E-mail" className="min-w-0">
                      <p
                        className="truncate text-sm font-medium text-foreground"
                        title={item.email}
                      >
                        {item.email}
                      </p>
                    </MetaField>

                    <MetaField label="Perfil" className="min-w-0">
                      <Badge variant="default" className="w-fit">
                        Administrador
                      </Badge>
                    </MetaField>

                    <MetaField label="Status" className="min-w-0">
                      <Badge variant={item.ativo ? 'success' : 'danger'} className="w-fit">
                        {item.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </MetaField>
                  </div>

                  <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2">
                    <MetaChip tone="time" className="w-fit max-w-full">
                      Criado em {formatDateBR(item.criadoEm)}
                    </MetaChip>
                  </div>

                  <div className="mt-3 flex w-full min-w-0 flex-wrap gap-2 border-t border-border/40 pt-3">
                    <Button variant="edit" size="sm" onClick={() => setFormAdmin(item)}>
                      Editar
                    </Button>
                    <Button
                      variant={item.ativo ? 'danger' : 'secondary'}
                      size="sm"
                      onClick={() => setTogglingAdmin(item)}
                    >
                      {item.ativo ? 'Desativar' : 'Reativar'}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setDeletingAdmin(item)}
                    >
                      Excluir
                    </Button>
                  </div>
                </article>
              ))}
          </div>
        )}

        {meta && meta.totalPages > 1 ? (
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            onPageChange={(page) => updateFilters({ page })}
          />
        ) : null}
      </PagePanel>

      <Modal
        open={isFormOpen}
        onClose={() => setFormAdmin(null)}
        title={editingAdmin ? 'Editar administrador' : 'Novo administrador'}
        description={
          editingAdmin
            ? 'Altere nome, e-mail ou defina uma nova senha temporária.'
            : 'O novo usuário terá o mesmo acesso administrativo completo que o seu.'
        }
      >
        <AdminForm
          editingAdmin={editingAdmin}
          onSubmit={handleSubmit}
          onCancel={() => setFormAdmin(null)}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>

      <Modal
        open={Boolean(togglingAdmin)}
        onClose={() => setTogglingAdmin(null)}
        title={
          togglingAdmin?.ativo ? 'Desativar administrador' : 'Reativar administrador'
        }
        description={
          togglingAdmin?.ativo
            ? `Desativar ${togglingAdmin.nome}? O usuário não poderá mais entrar no sistema.`
            : `Reativar ${togglingAdmin?.nome}? O usuário voltará a ter acesso administrativo completo.`
        }
        confirmLabel={togglingAdmin?.ativo ? 'Desativar' : 'Reativar'}
        variant={togglingAdmin?.ativo ? 'danger' : 'default'}
        isLoading={setAtivoMutation.isPending}
        onConfirm={handleConfirmToggle}
      />

      <Modal
        open={Boolean(deletingAdmin)}
        onClose={() => setDeletingAdmin(null)}
        title="Excluir administrador"
        description={
          deletingAdmin
            ? `Excluir ${deletingAdmin.nome} permanentemente? Esta ação não pode ser desfeita.`
            : undefined
        }
        confirmLabel="Excluir"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
      />
    </PageShell>
  )
}
