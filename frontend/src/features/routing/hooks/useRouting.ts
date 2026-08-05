import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/shared/stores/toast.store'
import { routingService } from '../services/routing.service'
import type { PlannerStop } from '../schemas/routing.schema'

export const ROTAS_QUERY_KEY = 'rotas'

export function useRouteHistory(page = 1) {
  return useQuery({
    queryKey: [ROTAS_QUERY_KEY, 'history', page],
    queryFn: () => routingService.list(page, 10),
  })
}

export function useOptimizeRoute() {
  return useMutation({
    mutationFn: ({
      enderecoInicial,
      paradas,
    }: {
      enderecoInicial: string
      paradas: PlannerStop[]
    }) => routingService.optimize(enderecoInicial, paradas),
    onError: () => {
      toast('Erro ao calcular a rota', 'error')
    },
  })
}

export function useSaveRoute() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: routingService.save,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ROTAS_QUERY_KEY] })
      toast('Rota salva no histórico!', 'success')
    },
    onError: () => {
      toast('Erro ao salvar rota', 'error')
    },
  })
}

export function useDeleteRoute() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => routingService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ROTAS_QUERY_KEY] })
      toast('Rota excluída', 'success')
    },
    onError: () => {
      toast('Erro ao excluir rota', 'error')
    },
  })
}

export function useDuplicateRoute() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => routingService.duplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ROTAS_QUERY_KEY] })
      toast('Rota duplicada', 'success')
    },
    onError: () => {
      toast('Erro ao duplicar rota', 'error')
    },
  })
}

export const ENDERECO_PARTIDA_QUERY_KEY = [ROTAS_QUERY_KEY, 'endereco-partida']

export function useEnderecoPartida() {
  return useQuery({
    queryKey: ENDERECO_PARTIDA_QUERY_KEY,
    queryFn: () => routingService.getEnderecoPartida(),
  })
}

export function useUpdateEnderecoPartida() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (enderecoPartidaPadrao: string) =>
      routingService.updateEnderecoPartida(enderecoPartidaPadrao),
    onSuccess: (data) => {
      queryClient.setQueryData(ENDERECO_PARTIDA_QUERY_KEY, {
        enderecoPartidaPadrao: data.enderecoPartidaPadrao,
      })
      toast('Endereço de partida salvo', 'success')
    },
    onError: () => {
      toast('Erro ao salvar endereço de partida', 'error')
    },
  })
}
