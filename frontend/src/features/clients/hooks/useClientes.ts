import { useQuery } from '@tanstack/react-query'
import { clienteService } from '../services/cliente.service'

export function useClientes(search: string, page = 1, enabled = true) {
  return useQuery({
    queryKey: ['clientes', search, page],
    queryFn: () => clienteService.list(search, page),
    enabled,
  })
}
