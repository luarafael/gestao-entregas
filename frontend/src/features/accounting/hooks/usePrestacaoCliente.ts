import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { invalidatePrestacaoRelated } from '@/shared/lib/invalidate-related'
import { prestacaoClienteService } from '../services/prestacaoCliente.service'
import type { PrestacaoHistoricoFilters } from '../types/prestacaoCliente.types'
import type { SubmitPrestacaoClienteFormData } from '../schemas/prestacaoCliente.schema'
import { toast } from '@/shared/stores/toast.store'
import { ApiError } from '@/shared/services/api'

export const PRESTACAO_CLIENTE_QUERY_KEY = 'prestacoes-cliente'
export const PRESTACAO_HISTORICO_QUERY_KEY = 'prestacoes-historico'

export function useClientesByDate(data?: string) {
  return useQuery({
    queryKey: [PRESTACAO_CLIENTE_QUERY_KEY, 'clientes', data],
    queryFn: () => prestacaoClienteService.listClientesByDate(data!),
    enabled: Boolean(data?.match(/^\d{4}-\d{2}-\d{2}$/)),
    staleTime: 10_000,
  })
}

export function usePrestacaoClientePreview(
  data: string | undefined,
  nomeCliente: string | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: [PRESTACAO_CLIENTE_QUERY_KEY, 'preview', data, nomeCliente],
    queryFn: () => prestacaoClienteService.preview(data!, nomeCliente!),
    enabled:
      enabled &&
      Boolean(data?.match(/^\d{4}-\d{2}-\d{2}$/)) &&
      Boolean(nomeCliente?.trim()),
    staleTime: 10_000,
  })
}

export function useSubmitPrestacaoCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SubmitPrestacaoClienteFormData) =>
      prestacaoClienteService.submit(data),
    onSuccess: () => {
      invalidatePrestacaoRelated(queryClient)
      queryClient.invalidateQueries({ queryKey: [PRESTACAO_CLIENTE_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [PRESTACAO_HISTORICO_QUERY_KEY] })
      toast('Prestação do cliente gerada com sucesso!', 'success')
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast(error.message, 'error')
        return
      }

      toast('Erro ao gerar prestação do cliente', 'error')
    },
  })
}

export function usePrestacaoHistorico(filters: PrestacaoHistoricoFilters) {
  return useQuery({
    queryKey: [PRESTACAO_HISTORICO_QUERY_KEY, filters],
    queryFn: () => prestacaoClienteService.listHistorico(filters),
  })
}

export function useDeletePrestacaoCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => prestacaoClienteService.delete(id),
    onSuccess: () => {
      invalidatePrestacaoRelated(queryClient)
      queryClient.invalidateQueries({ queryKey: [PRESTACAO_CLIENTE_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [PRESTACAO_HISTORICO_QUERY_KEY] })
      toast('Prestação do cliente excluída com sucesso!', 'success')
    },
    onError: () => {
      toast('Erro ao excluir prestação do cliente', 'error')
    },
  })
}

export function useUpdatePrestacaoCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: { observacoes?: string | null; recalcular?: boolean }
    }) => prestacaoClienteService.update(id, data),
    onSuccess: () => {
      invalidatePrestacaoRelated(queryClient)
      queryClient.invalidateQueries({ queryKey: [PRESTACAO_CLIENTE_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [PRESTACAO_HISTORICO_QUERY_KEY] })
      toast('Prestação do cliente atualizada!', 'success')
    },
    onError: () => {
      toast('Erro ao atualizar prestação do cliente', 'error')
    },
  })
}

export function useCopyPrestacaoClienteWhatsApp() {
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
