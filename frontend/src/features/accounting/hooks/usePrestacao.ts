import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { invalidatePrestacaoRelated } from '@/shared/lib/invalidate-related'
import { prestacaoService } from '../services/prestacao.service'
import type { PrestacaoFilters } from '../types'
import type { GeneratePrestacaoFormData } from '../schemas/prestacao.schema'
import { toast } from '@/shared/stores/toast.store'
import { ApiError } from '@/shared/services/api'

export const PRESTACAO_QUERY_KEY = 'prestacoes'

export function usePrestacaoHistory(filters: PrestacaoFilters) {
  return useQuery({
    queryKey: [PRESTACAO_QUERY_KEY, filters],
    queryFn: () => prestacaoService.list(filters),
  })
}

export function usePrestacaoPreview(date?: string) {
  return useQuery({
    queryKey: [PRESTACAO_QUERY_KEY, 'preview', date],
    queryFn: () => prestacaoService.preview(date),
    enabled: Boolean(date?.match(/^\d{4}-\d{2}-\d{2}$/)),
    staleTime: 10_000,
  })
}

export function useGeneratePrestacao() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: GeneratePrestacaoFormData) => prestacaoService.generate(data),
    onSuccess: () => {
      invalidatePrestacaoRelated(queryClient)
      toast('Prestação de contas gerada com sucesso!', 'success')
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast(error.message, 'error')
        return
      }

      toast('Erro ao gerar prestação de contas', 'error')
    },
  })
}

export function useCopyWhatsAppText() {
  return useMutation({
    mutationFn: async (text: string) => {
      await navigator.clipboard.writeText(text)
    },
    onSuccess: () => {
      toast('Texto copiado para a área de transferência!', 'success')
    },
    onError: () => {
      toast('Não foi possível copiar o texto', 'error')
    },
  })
}

export function useUpdatePrestacao() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: { observacoes?: string | null; recalcular?: boolean }
    }) => prestacaoService.update(id, data),
    onSuccess: () => {
      invalidatePrestacaoRelated(queryClient)
      toast('Prestação atualizada com sucesso!', 'success')
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast(error.message, 'error')
        return
      }

      toast('Erro ao atualizar prestação', 'error')
    },
  })
}

export function useDeletePrestacao() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => prestacaoService.delete(id),
    onSuccess: () => {
      invalidatePrestacaoRelated(queryClient)
      toast('Prestação excluída com sucesso!', 'success')
    },
    onError: () => {
      toast('Erro ao excluir prestação', 'error')
    },
  })
}
