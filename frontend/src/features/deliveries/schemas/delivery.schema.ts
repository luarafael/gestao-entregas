import { z } from 'zod'

export const deliveryFormSchema = z
  .object({
    nomeCliente: z.string().trim().optional(),
    endereco: z.string().trim().min(1, 'Endereço é obrigatório'),
    bairro: z.string().trim().min(1, 'Bairro é obrigatório'),
    cidade: z.string().trim().optional(),
    valorEntrega: z
      .number({ message: 'Valor é obrigatório' })
      .positive('Valor deve ser maior que zero'),
    observacao: z.string().trim().optional(),
    pagoPeloCliente: z.boolean().optional(),
    motoboyId: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.pagoPeloCliente && !data.nomeCliente?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'Informe o nome do cliente quando a corrida foi paga por ele',
        path: ['nomeCliente'],
      })
    }
  })

export type DeliveryFormData = z.infer<typeof deliveryFormSchema>

export type DateFilter = 'today' | 'yesterday' | 'week' | 'month'

export type SortField = 'horario' | 'nomeCliente' | 'bairro' | 'valorEntrega'

export type SortOrder = 'asc' | 'desc'

export interface DeliveryFilters {
  page: number
  limit: number
  search: string
  filter: DateFilter
  sortBy: SortField
  sortOrder: SortOrder
  motoboyId?: string
}

export const DATE_FILTER_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: 'week', label: 'Esta Semana' },
  { value: 'month', label: 'Este Mês' },
]

export const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'horario', label: 'Horário' },
  { value: 'nomeCliente', label: 'Cliente' },
  { value: 'bairro', label: 'Bairro' },
  { value: 'valorEntrega', label: 'Valor' },
]
