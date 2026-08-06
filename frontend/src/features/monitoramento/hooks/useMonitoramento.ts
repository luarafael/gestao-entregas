import { useQuery } from '@tanstack/react-query'
import { monitoramentoService } from '../services/monitoramento.service'

export const MONITORAMENTO_QUERY_KEY = 'monitoramento'

export function useMonitoramento(data?: string) {
  return useQuery({
    queryKey: [MONITORAMENTO_QUERY_KEY, data ?? 'hoje'],
    queryFn: () => monitoramentoService.get(data),
    refetchInterval: 12_000,
  })
}
