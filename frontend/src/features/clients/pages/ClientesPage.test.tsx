import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ClientesPage } from './ClientesPage'
import { clienteService } from '../services/cliente.service'

vi.mock('../services/cliente.service', () => ({
  clienteService: { list: vi.fn(), save: vi.fn(), delete: vi.fn() },
}))

describe('exclusão de cliente', () => {
  it('exige confirmação e remove o cliente da lista após sucesso', async () => {
    const cliente = {
      id: 'c1',
      nome: 'Maria',
      telefone: '',
      endereco: 'Rua A',
      bairro: '',
      cidade: '',
      observacao: '',
      criadoEm: '',
      atualizadoEm: '',
    }
    const meta = { total: 1, page: 1, limit: 20, totalPages: 1 }
    vi.mocked(clienteService.list).mockResolvedValue({ data: [cliente], meta })
    vi.mocked(clienteService.delete).mockImplementation(async () => {
      vi.mocked(clienteService.list).mockResolvedValue({
        data: [],
        meta: { ...meta, total: 0 },
      })
    })
    const user = userEvent.setup()
    render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <ClientesPage />
      </QueryClientProvider>,
    )
    await user.click(await screen.findByRole('button', { name: 'Excluir' }))
    expect(screen.getByLabelText('Valor entrega motoboy')).toBeInTheDocument()
    expect(screen.queryByLabelText('Valor do produto')).not.toBeInTheDocument()
    expect(
      screen.queryByLabelText('Forma de pagamento'),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByLabelText('Status do pagamento padrão'),
    ).not.toBeInTheDocument()
    expect(clienteService.delete).not.toHaveBeenCalled()
    const dialog = screen.getByRole('dialog')
    expect(
      within(dialog).getByText(/entregas e rotas existentes serão preservadas/),
    ).toBeInTheDocument()
    await user.click(
      within(dialog).getByRole('button', { name: 'Excluir cliente' }),
    )
    await waitFor(() =>
      expect(clienteService.delete).toHaveBeenCalledWith('c1'),
    )
    await waitFor(() =>
      expect(screen.queryByText('Maria')).not.toBeInTheDocument(),
    )
  })
})
