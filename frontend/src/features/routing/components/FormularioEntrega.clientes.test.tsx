import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FormularioEntrega } from './FormularioEntrega'
import { clienteService } from '@/features/clients/services/cliente.service'

vi.mock('@/features/clients/services/cliente.service', () => ({
  clienteService: { list: vi.fn() },
}))

describe('seleção de destinatário no planejador', () => {
  it('preenche os dados, permite ajuste e só adiciona a parada após confirmar', async () => {
    vi.mocked(clienteService.list).mockResolvedValue({
      data: [
        {
          id: 'cliente-1',
          nome: 'Maria',
          valorEntregaMotoboy: 12,
          telefone: '85999990000',
          endereco: 'Rua A, 10',
          bairro: 'Centro',
          cidade: 'Fortaleza',
          observacao: 'Portão azul',
          criadoEm: '',
          atualizadoEm: '',
        },
      ],
      meta: { total: 1, totalPages: 1, page: 1, limit: 20 },
    })
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <FormularioEntrega
          open
          editing={null}
          stops={[]}
          onClose={vi.fn()}
          onSubmit={onSubmit}
        />
      </QueryClientProvider>,
    )
    await user.click(await screen.findByRole('button', { name: /Maria/ }))
    expect(screen.getByLabelText('Cliente')).toHaveValue('Maria')
    expect(screen.getByLabelText('Valor entrega motoboy')).toHaveValue(12)
    expect(screen.getByLabelText('Endereço')).toHaveValue(
      'Rua A, 10, Fortaleza',
    )
    expect(screen.getByLabelText('Bairro')).toHaveValue('Centro')
    expect(screen.getByLabelText('Telefone')).toHaveValue('85999990000')
    expect(screen.getByLabelText('Observação')).toHaveValue('Portão azul')
    expect(onSubmit).not.toHaveBeenCalled()
    await user.clear(screen.getByLabelText('Observação'))
    await user.type(screen.getByLabelText('Observação'), 'Chamar ao chegar')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          cliente: 'Maria',
          endereco: 'Rua A, 10, Fortaleza',
          observacao: 'Chamar ao chegar',
          prioridade: 'NORMAL',
          valorEntrega: 12,
        }),
      ),
    )
  })
})
