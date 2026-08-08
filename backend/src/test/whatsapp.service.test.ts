import { describe, it, expect } from 'vitest'
import {
  generateMotoboyPrestacaoWhatsAppText,
  generateWhatsAppText,
} from '../services/whatsapp.service.js'

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
    expect(text).not.toContain('Nenhuma pendência')
    expect(text).not.toContain('*Pendências*')
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

  it('should include motoboy repasse and net value when provided', () => {
    const text = generateWhatsAppText(
      {
        ...prestacao,
        valorRepasseMotoboys: 40,
        valorLiquido: 40,
      },
      entregas,
      pendencias,
      [{ motoboyNome: 'Carlos', totalEntregas: 2, valorFinal: 40 }],
    )

    expect(text).toContain('Repasse motoboys')
    expect(text).toContain('Carlos')
    expect(text).toContain('Valor líquido')
    expect(text).toContain('Total repasse motoboys')
  })

  it('lista todos os motoboys aprovados no repasse', () => {
    const text = generateWhatsAppText(
      {
        ...prestacao,
        valorRepasseMotoboys: 80,
        valorLiquido: 0,
      },
      entregas,
      [],
      [
        { motoboyNome: 'Carlos', totalEntregas: 2, valorFinal: 40 },
        { motoboyNome: 'João', totalEntregas: 3, valorFinal: 40 },
      ],
    )

    expect(text).toContain('Carlos')
    expect(text).toContain('João')
    expect(text).toContain('2 entrega(s)')
    expect(text).toContain('3 entrega(s)')
  })

  it('agrupa entregas por motoboy quando houver motoboy atribuído', () => {
    const text = generateWhatsAppText(
      prestacao,
      [
        {
          bairro: 'Centro',
          nomeCliente: 'Cliente A',
          valorEntrega: 25,
          motoboyNome: 'Carlos',
        },
        {
          bairro: 'Jardins',
          nomeCliente: 'Cliente B',
          valorEntrega: 30,
          motoboyNome: 'João',
        },
      ],
      [],
    )

    expect(text).toContain('*Carlos*')
    expect(text).toContain('*João*')
    expect(text).toContain('Cliente A')
    expect(text).toContain('Cliente B')
  })

  it('mostra repasse e valor liquido mesmo sem motoboys aprovados', () => {
    const text = generateWhatsAppText(
      {
        ...prestacao,
        valorRepasseMotoboys: 0,
        valorLiquido: 80,
      },
      entregas,
      [],
      [],
    )

    expect(text).toContain('Nenhum repasse aprovado')
    expect(text).toContain('Valor líquido')
  })
})

describe('generateMotoboyPrestacaoWhatsAppText', () => {
  const prestacao = {
    data: new Date('2026-07-31'),
    totalEntregas: 2,
    valorTotal: 55,
    valorPendencias: 25,
    valorFinal: 80,
  }

  const entregas = [
    {
      bairro: 'Centro',
      nomeCliente: 'João Silva',
      valorEntrega: 25,
    },
    {
      bairro: 'Jardins',
      nomeCliente: null,
      valorEntrega: 30,
    },
  ]

  const pendencias = [
    {
      descricao: 'Repasse dia anterior',
      valor: 25,
      referenteAoDia: new Date('2026-07-12'),
    },
  ]

  it('lista corridas com bairro, cliente e valor da corrida', () => {
    const text = generateMotoboyPrestacaoWhatsAppText(
      'Carlos',
      prestacao,
      entregas,
      pendencias,
    )

    expect(text).toContain('Prestação do dia — Carlos')
    expect(text).toContain('*Corridas:* 2')
    expect(text).toContain('Centro')
    expect(text).toContain('João Silva')
    expect(text).toMatch(/Centro.*João Silva.*R\$/)
    expect(text).not.toContain('Valor das entregas')
    expect(text).not.toContain('Obrigado')
    expect(text).toContain('Repasse pendente')
    expect(text).toContain('Repasse:')
  })

  it('omite seções zeradas ou vazias', () => {
    const text = generateMotoboyPrestacaoWhatsAppText(
      'Carlos',
      {
        ...prestacao,
        totalEntregas: 0,
        valorFinal: 0,
      },
      [],
      [],
    )

    expect(text).toContain('Prestação do dia — Carlos')
    expect(text).not.toContain('Corridas')
    expect(text).not.toContain('Repasse pendente')
    expect(text).not.toContain('Repasse:')
    expect(text).not.toContain('Nenhuma')
  })

  it('mostra repasse sem pendências quando não houver repasse pendente', () => {
    const text = generateMotoboyPrestacaoWhatsAppText(
      'Carlos',
      { ...prestacao, valorPendencias: 0, valorFinal: 55 },
      entregas,
      [],
    )

    expect(text).toContain('*Corridas:* 2')
    expect(text).not.toContain('Repasse pendente')
    expect(text).toContain('Repasse:')
    expect(text).not.toContain('pago pelo cliente')
  })

  it('inclui PIX quando informado', () => {
    const text = generateMotoboyPrestacaoWhatsAppText(
      'Carlos',
      prestacao,
      entregas,
      [],
      '11999998888',
    )

    expect(text).toContain('*PIX:* 11999998888')
  })

  it('omite PIX quando não informado', () => {
    const text = generateMotoboyPrestacaoWhatsAppText(
      'Carlos',
      prestacao,
      entregas,
      [],
      null,
    )

    expect(text).not.toContain('*PIX:*')
  })
})
