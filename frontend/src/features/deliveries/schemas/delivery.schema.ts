import { z } from 'zod'

export type FormaPagamentoEntrega = 'DINHEIRO' | 'PIX' | 'CARTAO'

export type StatusPagamentoCliente = 'PAGO' | 'NAO_PAGO'

export type DeliveryViewMode = 'motoboy' | 'cliente'

export type OrigemCadastroEntrega = 'MOTOBOY' | 'CLIENTE'

export const FORMA_PAGAMENTO_OPTIONS: {
  value: FormaPagamentoEntrega
  label: string
}[] = [
  { value: 'DINHEIRO', label: 'Dinheiro' },
  { value: 'PIX', label: 'PIX' },
  { value: 'CARTAO', label: 'Cartão' },
]

export const STATUS_PAGAMENTO_OPTIONS: {
  value: StatusPagamentoCliente
  label: string
}[] = [
  { value: 'PAGO', label: 'Pago' },
  { value: 'NAO_PAGO', label: 'Não pago' },
]

export const deliveryMotoboyFormSchema = z
  .object({
    nomeCliente: z.string().trim().optional(),
    telefoneCliente: z.string().trim().optional(),
    endereco: z.string().trim().min(1, 'Endereço é obrigatório'),
    bairro: z.string().trim().min(1, 'Bairro é obrigatório'),
    cidade: z.string().trim().optional(),
    valorEntrega: z
      .number({ message: 'Valor é obrigatório' })
      .positive('Valor da entrega deve ser maior que zero'),
    valorPagoCliente: z
      .number()
      .positive('Valor pago pelo cliente deve ser maior que zero')
      .optional(),
    observacao: z.string().trim().optional(),
    pagoPeloCliente: z.boolean().optional(),
    motoboyId: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.pagoPeloCliente) return

    if (!data.nomeCliente?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'Informe o nome do cliente quando a corrida foi paga por ele',
        path: ['nomeCliente'],
      })
    }

    if (!data.telefoneCliente?.trim() || data.telefoneCliente.trim().length < 8) {
      ctx.addIssue({
        code: 'custom',
        message: 'Informe o telefone do cliente',
        path: ['telefoneCliente'],
      })
    }

    if (data.valorPagoCliente == null) {
      ctx.addIssue({
        code: 'custom',
        message: 'Informe o valor pago pelo cliente',
        path: ['valorPagoCliente'],
      })
      return
    }

    if (data.valorPagoCliente > data.valorEntrega) {
      ctx.addIssue({
        code: 'custom',
        message: 'Valor pago pelo cliente não pode ser maior que o valor da entrega',
        path: ['valorPagoCliente'],
      })
    }
  })

export const deliveryClienteFormSchema = z.object({
  nomeCliente: z.string().trim().min(1, 'Nome do cliente é obrigatório'),
  telefoneCliente: z.string().trim().min(8, 'Telefone do cliente é obrigatório'),
  endereco: z.string().trim().min(1, 'Endereço é obrigatório'),
  valorProduto: z.number().min(0, 'Valor do produto inválido'),
  formaPagamento: z.enum(['DINHEIRO', 'PIX', 'CARTAO'], {
    message: 'Forma de pagamento é obrigatória',
  }),
  statusPagamento: z.enum(['PAGO', 'NAO_PAGO'], {
    message: 'Informe se está pago ou não pago',
  }),
  valorEntregaMotoboy: z
    .number({ message: 'Valor entrega motoboy é obrigatório' })
    .positive('Valor entrega motoboy deve ser maior que zero'),
  valorEntrega: z
    .number()
    .min(0, 'Taxa de entrega inválida')
    .optional(),
  observacao: z.string().trim().optional(),
  cidade: z.string().trim().optional(),
})

export type DeliveryMotoboyFormData = z.infer<typeof deliveryMotoboyFormSchema>
export type DeliveryClienteFormData = z.infer<typeof deliveryClienteFormSchema>

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
  origemCadastro?: OrigemCadastroEntrega
  excludeConcluidasEmRotas?: boolean
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

/** @deprecated use deliveryMotoboyFormSchema */
export const deliveryFormSchema = deliveryMotoboyFormSchema
