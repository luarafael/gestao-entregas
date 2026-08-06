import { describe, it, expect } from 'vitest'
import { formatRouteWhatsAppText } from './whatsappRouteMessage'
import type { PlannerStop } from '../schemas/routing.schema'

describe('formatRouteWhatsAppText', () => {
  const paradas: PlannerStop[] = [
    {
      tempId: '1',
      cliente: 'João',
      endereco: 'Rua A, 100',
      bairro: 'Centro',
      prioridade: 'URGENTE',
      ordemUrgencia: 1,
      ordem: 1,
      distancia: 5200,
      tempo: 900,
      valorEntrega: 25,
    },
    {
      tempId: '2',
      cliente: 'Maria',
      endereco: 'Rua B, 200',
      bairro: 'Aldeota',
      prioridade: 'NORMAL',
      ordem: 2,
      distancia: 3100,
      tempo: 600,
      valorEntrega: 18,
    },
  ]

  it('inclui resumo e todas as paradas', () => {
    const text = formatRouteWhatsAppText({
      enderecoInicial: 'Depósito Central',
      distanciaTotal: 8300,
      tempoTotal: 1500,
      aproximada: false,
      paradas,
    })

    expect(text).toContain('*Rota planejada*')
    expect(text).toContain('Depósito Central')
    expect(text).toContain('João')
    expect(text).toContain('Maria')
    expect(text).toContain('Urgente 1ª')
    expect(text).toContain('8.3 km')
    expect(text).toMatch(/R\$\s*43,00/)
  })
})
