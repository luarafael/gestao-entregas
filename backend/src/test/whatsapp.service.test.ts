import { describe, it, expect } from 'vitest'
import { generateWhatsAppText } from '../services/whatsapp.service.js'

describe('generateWhatsAppText', () => {
  const prestacao = {
    id: '1',
    data: new Date('2026-07-31'),
    totalEntregas: 2,
    valorTotal: 55,
    valorPendencias: 25,
    valorFinal: 80,
    observacoes: null,
    criadoEm: new Date(),
  }

  const entregas = [
    {
      id: '1',
      data: new Date('2026-07-31'),
      horario: new Date('2026-07-31T10:00:00'),
      nomeCliente: 'João Silva',
      endereco: 'Rua A, 1',
      bairro: 'Centro',
      cidade: 'São Paulo',
      observacao: null,
      valorEntrega: 25,
      status: 'ENTREGUE' as const,
      criadoEm: new Date(),
    },
    {
      id: '2',
      data: new Date('2026-07-31'),
      horario: new Date('2026-07-31T11:00:00'),
      nomeCliente: null,
      endereco: 'Rua B, 2',
      bairro: 'Jardins',
      cidade: null,
      observacao: null,
      valorEntrega: 30,
      status: 'ENTREGUE' as const,
      criadoEm: new Date(),
    },
  ]

  const pendencias = [
    {
      id: '1',
      descricao: 'Pagamento pendente do dia 12/07',
      valor: 25,
      referenteAoDia: new Date('2026-07-12'),
      status: 'PENDENTE' as const,
      criadoEm: new Date(),
    },
  ]

  it('should generate formatted WhatsApp text', () => {
    const text = generateWhatsAppText(prestacao, entregas, pendencias)

    expect(text).toContain('📋')
    expect(text).toContain('Prestação de Contas')
    expect(text).toContain('📦')
    expect(text).toContain('Centro')
    expect(text).toContain('João Silva')
    expect(text).toContain('Jardins')
    expect(text).toContain('Sem nome')
    expect(text).toContain('💰')
    expect(text).toContain('Pagamento pendente do dia 12/07')
    expect(text).toContain('🕐')
    expect(text).toContain('12/07/2026')
    expect(text).toContain('Valor final')
    expect(text).toContain('🙏')
  })

  it('should handle empty deliveries and pendencies', () => {
    const text = generateWhatsAppText(prestacao, [], [])

    expect(text).toContain('Nenhuma entrega registrada')
    expect(text).toContain('Nenhuma pendência')
  })

  it('should mark deliveries paid by client and show summary', () => {
    const text = generateWhatsAppText(
      prestacao,
      [
        {
          ...entregas[0],
          pagoPeloCliente: true,
        },
        entregas[1],
      ],
      [],
    )

    expect(text).toContain('pago pelo cliente')
    expect(text).toContain('Pagas pelo cliente (fora do total)')
  })
})
