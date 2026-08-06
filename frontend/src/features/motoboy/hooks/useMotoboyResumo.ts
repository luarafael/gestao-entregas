import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/shared/services/api'
import type { MotoboyResumo } from '@/shared/types/api.types'

export function useMotoboyResumo() {
  return useQuery({
    queryKey: ['motoboy', 'resumo'],
    queryFn: () => apiFetch<MotoboyResumo>('/api/entregas/meu-resumo'),
    refetchInterval: 30_000,
  })
}
