import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { invalidatePrestacaoRelated } from '@/shared/lib/invalidate-related'
import { prestacaoMotoboyService } from '../services/prestacaoMotoboy.service'
import type { SubmitPrestacaoMotoboyFormData } from '../schemas/prestacaoMotoboy.schema'
import { toast } from '@/shared/stores/toast.store'
import { ApiError } from '@/shared/services/api'

export const PRESTACAO_MOTOBOY_QUERY_KEY = 'prestacoes-motoboy'

export function usePrestacaoMotoboyPreview(
  date?: string,
  motoboyId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: [PRESTACAO_MOTOBOY_QUERY_KEY, 'preview', date, motoboyId ?? 'self'],
    queryFn: () => prestacaoMotoboyService.preview(date, motoboyId),
    enabled: enabled && Boolean(date?.match(/^\d{4}-\d{2}-\d{2}$/)),
    staleTime: 10_000,
  })
}

export function usePrestacaoMotoboyHistory(
  filters: {
    page: number
    limit: number
    motoboyId?: string
  },
  enabled = true,
) {
  return useQuery({
    queryKey: [PRESTACAO_MOTOBOY_QUERY_KEY, 'history', filters],
    queryFn: () => prestacaoMotoboyService.list(filters),
    enabled,
  })
}

export function useSubmitPrestacaoMotoboy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SubmitPrestacaoMotoboyFormData) =>
      prestacaoMotoboyService.submit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRESTACAO_MOTOBOY_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['motoboy', 'resumo'] })
      invalidatePrestacaoRelated(queryClient)
      toast('Prestação enviada para aprovação!', 'success')
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast(error.message, 'error')
        return
      }
      toast('Erro ao enviar prestação', 'error')
    },
  })
}

export function useCopyPrestacaoMotoboyWhatsApp() {
  return useMutation({
    mutationFn: async (text: string) => {
      await navigator.clipboard.writeText(text)
    },
    onSuccess: () => {
      toast('Texto copiado!', 'success')
    },
    onError: () => {
      toast('Não foi possível copiar', 'error')
    },
  })
}
