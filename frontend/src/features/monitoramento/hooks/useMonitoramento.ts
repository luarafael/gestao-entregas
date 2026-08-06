import { useQuery } from '@tanstack/react-query'
import { monitoramentoService } from '../services/monitoramento.service'

export const MONITORAMENTO_QUERY_KEY = 'monitoramento'

export function useMonitoramento(data: string | undefined, motoboyId?: string) {
  return useQuery({
    queryKey: [MONITORAMENTO_QUERY_KEY, data ?? 'hoje', motoboyId ?? 'none'],
    queryFn: () => monitoramentoService.get(data, motoboyId!),
    enabled: Boolean(motoboyId),
    refetchInterval: 10_000,
  })
}
