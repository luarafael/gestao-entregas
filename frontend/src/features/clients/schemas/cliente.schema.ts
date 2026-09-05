import { z } from 'zod'

export const clienteSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório').max(200),
  telefone: z.string().trim().max(40),
  endereco: z.string().trim().min(1, 'Endereço é obrigatório').max(500),
  bairro: z.string().trim().max(150),
  cidade: z.string().trim().max(150),
  observacao: z.string().trim().max(2000),
  valorEntregaMotoboy: z
    .number()
    .positive()
    .max(99999999.99)
    .nullable()
    .optional(),
})
export type ClienteInput = z.infer<typeof clienteSchema>
