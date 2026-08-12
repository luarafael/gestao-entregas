import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from '@/shared/stores/toast.store'
import { adminService } from '../services/admin.service'
import type { AdminFilters, AdminFormData } from '../schemas/admin.schema'

export const ADMINS_QUERY_KEY = 'admins'

export function useAdminsList(filters: AdminFilters) {
  return useQuery({
    queryKey: [ADMINS_QUERY_KEY, filters],
    queryFn: () => adminService.list(filters),
    placeholderData: keepPreviousData,
  })
}

export function useCreateAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: AdminFormData) => adminService.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [ADMINS_QUERY_KEY] })
      toast('Administrador criado com sucesso!', 'success')
    },
    onError: (error: Error) => {
      toast(error.message || 'Erro ao criar administrador', 'error')
    },
  })
}

export function useUpdateAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminFormData }) =>
      adminService.update(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [ADMINS_QUERY_KEY] })
      toast('Administrador atualizado com sucesso!', 'success')
    },
    onError: (error: Error) => {
      toast(error.message || 'Erro ao atualizar administrador', 'error')
    },
  })
}

export function useSetAdminAtivo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      adminService.setAtivo(id, ativo),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: [ADMINS_QUERY_KEY] })
      toast(
        variables.ativo
          ? 'Administrador reativado com sucesso!'
          : 'Administrador desativado com sucesso!',
        'success',
      )
    },
    onError: (error: Error) => {
      toast(error.message || 'Erro ao alterar status do administrador', 'error')
    },
  })
}

export function useDeleteAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => adminService.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [ADMINS_QUERY_KEY] })
      toast('Administrador excluído com sucesso!', 'success')
    },
    onError: (error: Error) => {
      toast(error.message || 'Erro ao excluir administrador', 'error')
    },
  })
}
