import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from '@/shared/stores/toast.store'
import { motoboyService } from '../services/motoboy.service'
import type { MotoboyFilters, MotoboyFormData } from '../schemas/motoboy.schema'

export const MOTOBOYS_QUERY_KEY = 'motoboys'

export function useMotoboysList(filters: MotoboyFilters) {
  return useQuery({
    queryKey: [MOTOBOYS_QUERY_KEY, filters],
    queryFn: () => motoboyService.list(filters),
    placeholderData: keepPreviousData,
  })
}

export function useCreateMotoboy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: MotoboyFormData) => motoboyService.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [MOTOBOYS_QUERY_KEY] })
      toast('Motoboy criado com sucesso!', 'success')
    },
    onError: (error: Error) => {
      toast(error.message || 'Erro ao criar motoboy', 'error')
    },
  })
}

export function useUpdateMotoboy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MotoboyFormData }) =>
      motoboyService.update(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [MOTOBOYS_QUERY_KEY] })
      toast('Motoboy atualizado com sucesso!', 'success')
    },
    onError: (error: Error) => {
      toast(error.message || 'Erro ao atualizar motoboy', 'error')
    },
  })
}

export function useSetMotoboyAtivo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      motoboyService.setAtivo(id, ativo),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: [MOTOBOYS_QUERY_KEY] })
      toast(
        variables.ativo
          ? 'Motoboy reativado com sucesso!'
          : 'Motoboy desativado com sucesso!',
        'success',
      )
    },
    onError: (error: Error) => {
      toast(error.message || 'Erro ao alterar status do motoboy', 'error')
    },
  })
}

export function useDeleteMotoboy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => motoboyService.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [MOTOBOYS_QUERY_KEY] })
      toast('Motoboy excluído com sucesso!', 'success')
    },
    onError: (error: Error) => {
      toast(error.message || 'Erro ao excluir motoboy', 'error')
    },
  })
}
