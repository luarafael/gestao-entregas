import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { RotaDetalheModal } from './RotaDetalheModal'
import { renderWithProviders } from '@/test/test-utils'
import { routingService } from '../services/routing.service'

vi.mock('../services/routing.service', () => ({
  routingService: {
    getById: vi.fn(),
    getExecucao: vi.fn(),
  },
}))

describe('RotaDetalheModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mostra paradas, valores e distância da rota', async () => {
    vi.mocked(routingService.getById).mockResolvedValue({
      id: 'r1',
      data: '2026-08-10',
      enderecoInicial: 'Rua da Partida, 10',
      distanciaTotal: '3500',
      tempoTotal: 720,
      aproximada: false,
      concluidaEm: null,
      criadoEm: '2026-08-10T10:00:00.000Z',
      paradas: [
        {
          id: 'p1',
          entregaId: 'e1',
          cliente: 'João',
          endereco: 'Rua B, 20',
          bairro: 'Aldeota',
          telefone: '85999999999',
          observacao: 'Interfone 12',
          ordem: 1,
          distancia: '3500',
          tempo: 720,
          prioridade: 'NORMAL',
          ordemUrgencia: null,
          valorEntrega: '15',
        },
      ],
    })

    renderWithProviders(<RotaDetalheModal rotaId="r1" onClose={() => undefined} />)

    expect(await screen.findByText('Rota de 10/08/2026')).toBeInTheDocument()
    expect(screen.getByText('João')).toBeInTheDocument()
    expect(screen.getByText('Rua B, 20 — Aldeota')).toBeInTheDocument()
    expect(screen.getByText('Interfone 12')).toBeInTheDocument()
    expect(routingService.getExecucao).not.toHaveBeenCalled()
  })
})
