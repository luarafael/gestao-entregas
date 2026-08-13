import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DailyBreakdownTable } from './DailyBreakdownTable'
import { renderWithProviders } from '@/test/test-utils'
import { apiFetch } from '@/shared/services/api'

vi.mock('@/shared/services/api', () => ({
  apiFetch: vi.fn(),
}))

describe('DailyBreakdownTable', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset()
  })

  it('renderiza linhas da tabela', () => {
    renderWithProviders(
      <DailyBreakdownTable
        data={[
          { date: '2026-07-31', entregas: 2, valor: 50, temPrestacao: true },
          { date: '2026-07-30', entregas: 1, valor: 25, temPrestacao: true },
        ]}
      />,
    )

    expect(screen.getByText('Detalhamento diário')).toBeInTheDocument()
    expect(screen.getByText('31/07')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('abre o detalhe do dia ao clicar no card', async () => {
    const user = userEvent.setup()
    vi.mocked(apiFetch).mockResolvedValue({
      date: '2026-07-31',
      totalEntregas: 2,
      valorTotal: 50,
      distanciaTotal: 4200,
      tempoTotal: 900,
      entregas: [
        {
          id: 'e1',
          horario: '2026-07-31T12:00:00.000Z',
          nomeCliente: 'Maria',
          telefoneCliente: null,
          endereco: 'Rua A',
          bairro: 'Centro',
          cidade: 'Fortaleza',
          observacao: null,
          valorEntrega: 12,
          valorProduto: null,
          valorEntregaMotoboy: null,
          formaPagamento: null,
          pagoPeloCliente: false,
          origemCadastro: 'MOTOBOY',
          motoboy: null,
          valorRelatorio: 12,
          distancia: 2100,
          tempo: 400,
        },
      ],
      rotas: [],
    })

    renderWithProviders(
      <DailyBreakdownTable
        data={[
          { date: '2026-07-31', entregas: 2, valor: 50, temPrestacao: true },
        ]}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Ver entregas de 31/07' }))

    expect(await screen.findByText('Detalhe de 31/07/2026')).toBeInTheDocument()
    expect(screen.getByText('Maria')).toBeInTheDocument()
    expect(screen.getByText('Rua A — Centro — Fortaleza')).toBeInTheDocument()
  })
})
