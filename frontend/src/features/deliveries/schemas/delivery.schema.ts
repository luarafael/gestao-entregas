import { z } from 'zod'

export type FormaPagamentoEntrega = 'DINHEIRO' | 'PIX' | 'CARTAO'

export const FORMA_PAGAMENTO_OPTIONS: {
  value: FormaPagamentoEntrega
  label: string
}[] = [
  { value: 'DINHEIRO', label: 'Dinheiro' },
  { value: 'PIX', label: 'PIX' },
  { value: 'CARTAO', label: 'Cartão' },
]

export const deliveryFormSchema = z
  .object({
    nomeCliente: z.string().trim().optional(),
    endereco: z.string().trim().min(1, 'Endereço é obrigatório'),
    bairro: z.string().trim().min(1, 'Bairro é obrigatório'),
    cidade: z.string().trim().optional(),
    valorProduto: z.number().min(0, 'Valor do produto inválido').optional(),
    formaPagamento: z.enum(['DINHEIRO', 'PIX', 'CARTAO']).optional(),
    valorEntrega: z
      .number({ message: 'Valor é obrigatório' })
      .positive('Taxa de entrega deve ser maior que zero'),
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
  nomeCliente?: string
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
