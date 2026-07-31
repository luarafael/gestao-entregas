import { z } from 'zod'
import { normalizeWhatsAppPhone } from '../utils/whatsappUrl'

export const whatsappContactFormSchema = z.object({
  name: z.string().trim().min(1, 'Informe um nome'),
  phone: z
    .string()
    .trim()
    .min(1, 'Informe o número')
    .refine(
      (value) => {
        const digits = normalizeWhatsAppPhone(value)
        return digits.length >= 12 && digits.length <= 13
      },
      { message: 'Número inválido. Use DDD + número (ex: 11999998888)' },
    ),
})

export type WhatsAppContactFormData = z.infer<typeof whatsappContactFormSchema>
