import { z } from 'zod'
import { toUtcDateOnly } from '../utils/date.utils.js'

export const dashboardStatsQuerySchema = z.object({
  data: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida')
    .optional()
    .transform((value) => (value ? toUtcDateOnly(value) : undefined)),
  motoboyId: z.string().trim().min(1).optional(),
  origemCadastro: z.enum(['MOTOBOY', 'CLIENTE']).optional(),
})

export type DashboardStatsQuery = z.infer<typeof dashboardStatsQuerySchema>

export const monitoramentoQuerySchema = z.object({
  data: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida')
    .optional()
    .transform((value) => (value ? toUtcDateOnly(value) : undefined)),
  motoboyId: z.string().trim().min(1, 'Selecione um motoboy'),
})

export type MonitoramentoQuery = z.infer<typeof monitoramentoQuerySchema>

export const monitoramentoEventosQuerySchema = z.object({
  since: z.string().datetime({ message: 'Data/hora inválida' }),
  motoboyId: z.string().trim().min(1).optional(),
})

export type MonitoramentoEventosQuery = z.infer<
  typeof monitoramentoEventosQuerySchema
>

const formaPagamentoSchema = z.enum(['DINHEIRO', 'PIX', 'CARTAO'])
const statusPagamentoClienteSchema = z.enum(['PAGO', 'NAO_PAGO'])

const entregaBaseSchema = z.object({
  nomeCliente: z.string().trim().optional(),
  telefoneCliente: z.string().trim().optional(),
  endereco: z.string().trim().min(1, 'Endereço é obrigatório'),
  bairro: z.string().trim().min(1, 'Bairro é obrigatório'),
  cidade: z.string().trim().optional(),
  valorProduto: z.coerce.number().min(0, 'Valor do produto inválido').optional(),
  formaPagamento: formaPagamentoSchema.optional(),
  statusPagamentoCliente: statusPagamentoClienteSchema.optional(),
  valorEntrega: z.coerce.number().positive('Valor da taxa de entrega deve ser maior que zero'),
  valorPagoCliente: z.coerce.number().positive('Valor pago pelo cliente deve ser maior que zero').optional(),
  observacao: z.string().trim().optional(),
  pagoPeloCliente: z.boolean().optional().default(false),
  motoboyId: z.string().trim().min(1).optional(),
})

function validatePagoPeloCliente(
  data: {
    pagoPeloCliente?: boolean
    nomeCliente?: string
    telefoneCliente?: string
    valorEntrega?: number
    valorPagoCliente?: number
  },
  ctx: z.RefinementCtx,
) {
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

  if (data.valorEntrega != null && data.valorPagoCliente > data.valorEntrega) {
    ctx.addIssue({
      code: 'custom',
      message: 'Valor pago pelo cliente não pode ser maior que o valor da entrega',
      path: ['valorPagoCliente'],
    })
  }
}

export const createEntregaSchema = entregaBaseSchema.superRefine((data, ctx) => {
  validatePagoPeloCliente(data, ctx)
})

export const updateEntregaSchema = entregaBaseSchema.partial().extend({
  status: z.enum(['ENTREGUE', 'CANCELADA']).optional(),
}).superRefine((data, ctx) => {
  validatePagoPeloCliente(data, ctx)
})

export const listEntregasSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  filter: z.enum(['today', 'yesterday', 'week', 'month']).default('today'),
  referenceDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida')
    .optional(),
  sortBy: z
    .enum(['horario', 'nomeCliente', 'bairro', 'valorEntrega'])
    .default('horario'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  motoboyId: z.string().trim().min(1).optional(),
  nomeCliente: z.string().trim().min(1).optional(),
  origemCadastro: z.enum(['MOTOBOY', 'CLIENTE']).optional(),
  excludeConcluidasEmRotas: z.coerce.boolean().optional(),
})

export const createEntregaClienteSchema = z.object({
  nomeCliente: z.string().trim().min(1, 'Nome do cliente é obrigatório'),
  telefoneCliente: z.string().trim().min(8, 'Telefone do cliente é obrigatório'),
  endereco: z.string().trim().min(1, 'Endereço é obrigatório'),
  valorProduto: z.coerce.number().min(0, 'Valor do produto inválido'),
  formaPagamento: formaPagamentoSchema,
  statusPagamento: statusPagamentoClienteSchema,
  valorEntregaMotoboy: z.coerce
    .number()
    .positive('Valor entrega motoboy deve ser maior que zero'),
  valorEntrega: z.coerce.number().min(0).optional(),
  observacao: z.string().trim().optional(),
  cidade: z.string().trim().optional(),
})

export const updateEntregaClienteSchema = createEntregaClienteSchema.partial()

export const importEntregasClienteSchema = z.object({
  ids: z.array(z.string().trim().min(1)).min(1, 'Selecione ao menos uma entrega'),
  motoboyId: z.string().trim().min(1).optional(),
})

export const entregasPorIdsSchema = z.object({
  ids: z.array(z.string().trim().min(1)).min(1).max(100),
})

export const updateStatusPagamentoSchema = z.object({
  statusPagamento: statusPagamentoClienteSchema,
})

export type CreateEntregaClienteInput = z.infer<typeof createEntregaClienteSchema>
export type UpdateEntregaClienteInput = z.infer<typeof updateEntregaClienteSchema>
export type ImportEntregasClienteInput = z.infer<typeof importEntregasClienteSchema>
export type EntregasPorIdsInput = z.infer<typeof entregasPorIdsSchema>
export type UpdateStatusPagamentoInput = z.infer<typeof updateStatusPagamentoSchema>

export type CreateEntregaInput = z.infer<typeof createEntregaSchema>
export type UpdateEntregaInput = z.infer<typeof updateEntregaSchema>
export type ListEntregasInput = z.infer<typeof listEntregasSchema>
