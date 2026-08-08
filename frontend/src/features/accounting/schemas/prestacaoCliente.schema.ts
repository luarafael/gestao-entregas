import { z } from 'zod'
import { getTodayInputDate } from './prestacao.schema'

export const submitPrestacaoClienteFormSchema = z.object({
  data: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  nomeCliente: z.string().trim().min(1, 'Selecione um cliente'),
  observacoes: z.string().trim().optional(),
})

export type SubmitPrestacaoClienteFormData = z.infer<
  typeof submitPrestacaoClienteFormSchema
>

export const defaultSubmitClienteFormValues: SubmitPrestacaoClienteFormData = {
  data: getTodayInputDate(),
  nomeCliente: '',
  observacoes: '',
}

export function formatPrestacaoClienteDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split('-')
  return `${day}/${month}/${year}`
}
