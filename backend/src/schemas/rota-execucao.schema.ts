import { z } from 'zod'

export const statusExecucaoParadaSchema = z.enum([
  'PENDENTE',
  'EM_ROTA',
  'ENTREGUE',
  'CLIENTE_AUSENTE',
  'NAO_LOCALIZADO',
  'CANCELADA',
  'FALHA_ENTREGA',
])

export const updateExecucaoParadaSchema = z.object({
  status: statusExecucaoParadaSchema,
  observacao: z.string().trim().optional().nullable(),
})

export const bulkSyncExecucaoSchema = z.object({
  paradas: z.array(
    z.object({
      paradaId: z.string().min(1),
      status: statusExecucaoParadaSchema,
      observacao: z.string().trim().optional().nullable(),
      dataHoraStatus: z.coerce.date().optional().nullable(),
    }),
  ),
})

export type StatusExecucaoParada = z.infer<typeof statusExecucaoParadaSchema>
export type UpdateExecucaoParadaInput = z.infer<typeof updateExecucaoParadaSchema>
export type BulkSyncExecucaoInput = z.infer<typeof bulkSyncExecucaoSchema>
