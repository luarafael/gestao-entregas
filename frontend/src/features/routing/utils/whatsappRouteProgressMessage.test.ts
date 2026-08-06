import { describe, it, expect } from 'vitest'
import {
  formatRouteCompletedWhatsAppText,
  formatRouteProgressWhatsAppText,
} from './whatsappRouteProgressMessage'
import type { PlannerStop } from '../schemas/routing.schema'

const baseStop = (overrides: Partial<PlannerStop>): PlannerStop => ({
  tempId: '1',
  endereco: 'Rua A, 100',
  bairro: 'Centro',
  prioridade: 'NORMAL',
  statusExecucao: 'ENTREGUE',
  ordem: 1,
  distancia: 5200,
  tempo: 900,
  valorEntrega: 25,
  statusAtualizadoEm: '2026-08-05T18:30:00.000Z',
  ...overrides,
})

describe('whatsappRouteProgressMessage', () => {
  it('usa mensagem de andamento enquanto houver pendências', () => {
    const text = formatRouteProgressWhatsAppText({
      stops: [
        baseStop({ tempId: '1', statusExecucao: 'ENTREGUE' }),
        baseStop({
          tempId: '2',
          ordem: 2,
          statusExecucao: 'PENDENTE',
          cliente: 'Maria',
        }),
      ],
    })

    expect(text).toContain('*Andamento da Rota*')
    expect(text).toContain('PENDENTES')
  })

  it('usa mensagem completa quando todas estiverem entregues', () => {
    const text = formatRouteProgressWhatsAppText({
      enderecoInicial: 'Depósito Central',
      distanciaTotal: 8300,
      tempoTotal: 1500,
      stops: [
        baseStop({ tempId: '1', cliente: 'João' }),
        baseStop({
          tempId: '2',
          ordem: 2,
          cliente: 'Maria',
          endereco: 'Rua B, 200',
          distancia: 3100,
          tempo: 600,
          valorEntrega: 18,
        }),
      ],
    })

    expect(text).toContain('*Rota concluída*')
    expect(text).toContain('Depósito Central')
    expect(text).toContain('*Resumo final*')
    expect(text).toContain('João')
    expect(text).toContain('Maria')
    expect(text).toContain('8.3 km')
    expect(text).toMatch(/Trecho: 5\.2 km/)
    expect(text).not.toContain('*Andamento da Rota*')
  })

  it('formata resumo final com totais somados das paradas', () => {
    const text = formatRouteCompletedWhatsAppText({
      stops: [baseStop({ tempId: '1', cliente: 'João' })],
    })

    expect(text).toContain('Distância total: 5.2 km')
    expect(text).toContain('Tempo total: 15 min')
  })
})
