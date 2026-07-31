import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { pendingService } from '../services/pending.service'
import type { PendingFilters, PendingFormData } from '../schemas/pending.schema'
import { toast } from '@/shared/stores/toast.store'

export const PENDING_QUERY_KEY = 'pendencias'

export function usePendingList(filters: PendingFilters) {
  return useQuery({
    queryKey: [PENDING_QUERY_KEY, filters],
    queryFn: () => pendingService.list(filters),
  })
}

export function useCreatePending() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: PendingFormData) => pendingService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PENDING_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast('Pendência salva com sucesso!', 'success')
    },
    onError: () => {
      toast('Erro ao salvar pendência', 'error')
    },
  })
}

export function useUpdatePending() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PendingFormData }) =>
      pendingService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PENDING_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast('Pendência atualizada com sucesso!', 'success')
    },
    onError: () => {
      toast('Erro ao atualizar pendência', 'error')
    },
  })
}

export function useDeletePending() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => pendingService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PENDING_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast('Pendência excluída com sucesso!', 'success')
    },
    onError: () => {
      toast('Erro ao excluir pendência', 'error')
    },
  })
}
