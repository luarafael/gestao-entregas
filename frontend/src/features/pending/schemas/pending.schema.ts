import { z } from 'zod'

export const pendingFormSchema = z.object({
  descricao: z.string().trim().min(1, 'Descrição é obrigatória'),
  valor: z
    .number({ message: 'Valor é obrigatório' })
    .positive('Valor deve ser maior que zero'),
  referenteAoDia: z.string().min(1, 'Data de referência é obrigatória'),
  status: z.enum(['PENDENTE', 'RECEBIDO']),
})

export type PendingFormData = z.infer<typeof pendingFormSchema>

export type PendingStatus = 'PENDENTE' | 'RECEBIDO'

export interface PendingFilters {
  page: number
  limit: number
  search: string
  status?: PendingStatus
}

export const STATUS_OPTIONS: { value: PendingStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Todos' },
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'RECEBIDO', label: 'Recebido' },
]

export function toApiPayload(data: PendingFormData) {
  return {
    descricao: data.descricao,
    valor: data.valor,
    referenteAoDia: data.referenteAoDia,
    status: data.status,
  }
}

export function formatReferenteAoDia(date: string) {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function toInputDate(date: string) {
  const parsed = new Date(date)
  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
