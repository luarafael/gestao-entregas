import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

export function useGeneratePrestacao() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: GeneratePrestacaoFormData) => prestacaoService.generate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRESTACAO_QUERY_KEY] })
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
