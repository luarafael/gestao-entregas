import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { invalidatePendingRelated } from '@/shared/lib/invalidate-related'
import { pendingService } from '../services/pending.service'
import type { PendingFilters, PendingFormData } from '../schemas/pending.schema'
import { toast } from '@/shared/stores/toast.store'

export const PENDING_QUERY_KEY = 'pendencias'

export function usePendingList(filters: PendingFilters) {
  return useQuery({
    queryKey: [PENDING_QUERY_KEY, filters],
    queryFn: () => pendingService.list(filters),
    placeholderData: keepPreviousData,
  })
}

export function useCreatePending() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: PendingFormData) => pendingService.create(data),
    onSuccess: () => {
      invalidatePendingRelated(queryClient)
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
      invalidatePendingRelated(queryClient)
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
      invalidatePendingRelated(queryClient)
      toast('Pendência excluída com sucesso!', 'success')
    },
    onError: () => {
      toast('Erro ao excluir pendência', 'error')
    },
  })
}
