import { describe, it, expect } from 'vitest'
import { deliveryFormSchema } from '../schemas/delivery.schema'

describe('deliveryFormSchema', () => {
  it('valida entrega com campos obrigatórios', () => {
    const result = deliveryFormSchema.safeParse({
      endereco: 'Rua A, 10',
      bairro: 'Centro',
      valorEntrega: 25,
    })

    expect(result.success).toBe(true)
  })

  it('rejeita entrega sem endereço', () => {
    const result = deliveryFormSchema.safeParse({
      bairro: 'Centro',
      valorEntrega: 25,
    })

    expect(result.success).toBe(false)
  })

  it('rejeita valor zero ou negativo', () => {
    const result = deliveryFormSchema.safeParse({
      endereco: 'Rua A, 10',
      bairro: 'Centro',
      valorEntrega: 0,
    })

    expect(result.success).toBe(false)
  })
})
