import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { aprovacoesService } from '../services/aprovacoes.service'
import { toast } from '@/shared/stores/toast.store'
import { ApiError } from '@/shared/services/api'

export const APROVACOES_QUERY_KEY = 'aprovacoes-motoboy'

export function usePendingPrestacoesMotoboy(motoboyId?: string) {
  const scope = motoboyId ?? 'all'

  return useQuery({
    queryKey: [APROVACOES_QUERY_KEY, 'pendentes', scope],
    queryFn: () => aprovacoesService.listPending(motoboyId),
    refetchInterval: 15_000,
  })
}

export function usePendingPrestacoesCount() {
  return useQuery({
    queryKey: [APROVACOES_QUERY_KEY, 'count'],
    queryFn: () => aprovacoesService.countPending(),
    refetchInterval: 15_000,
  })
}

export function useApprovePrestacaoMotoboy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => aprovacoesService.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [APROVACOES_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['prestacoes-motoboy'] })
      toast('Prestação aprovada!', 'success')
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast(error.message, 'error')
        return
      }
      toast('Erro ao aprovar', 'error')
    },
  })
}

export function useRejectPrestacaoMotoboy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) =>
      aprovacoesService.reject(id, motivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [APROVACOES_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['prestacoes-motoboy'] })
      toast('Prestação rejeitada', 'success')
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast(error.message, 'error')
        return
      }
      toast('Erro ao rejeitar', 'error')
    },
  })
}
