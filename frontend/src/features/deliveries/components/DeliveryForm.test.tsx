import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'
import { DeliveryMotoboyForm } from './DeliveryMotoboyForm'
vi.mock('@/features/clients/services/cliente.service', () => ({
  clienteService: {
    list: vi.fn(async () => ({
      data: [
        {
          id: 'c1',
          nome: 'Maria',
          telefone: '85999990000',
          endereco: 'Rua A, 10',
          bairro: 'Centro',
          cidade: 'Fortaleza',
          observacao: 'Portão azul',
          valorEntregaMotoboy: 12,
        },
      ],
      meta: { total: 1, totalPages: 1, page: 1, limit: 20 },
    })),
  },
}))

describe('DeliveryMotoboyForm', () => {
  it('exibe erros de validação ao enviar formulário vazio', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(
      <QueryClientProvider client={new QueryClient()}>
        <DeliveryMotoboyForm
          editingDelivery={null}
          onSubmit={onSubmit}
          onCancelEdit={() => undefined}
          isSubmitting={false}
        />
      </QueryClientProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Salvar Entrega' }))

    expect(
      await screen.findByText('Endereço é obrigatório'),
    ).toBeInTheDocument()
    expect(screen.getByText('Bairro é obrigatório')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })
  it('seleciona cliente e permite ajustar os dados desta entrega antes de salvar', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn(async () => undefined)
    render(
      <QueryClientProvider client={new QueryClient()}>
        <DeliveryMotoboyForm
          editingDelivery={null}
          onSubmit={onSubmit}
          onCancelEdit={() => undefined}
          isSubmitting={false}
        />
      </QueryClientProvider>,
    )
    await user.click(await screen.findByRole('button', { name: /Maria/ }))
    expect(screen.getByLabelText('Nome do Cliente (opcional)')).toHaveValue(
      'Maria',
    )
    expect(screen.getByLabelText('Telefone do cliente (opcional)')).toHaveValue(
      '85999990000',
    )
    expect(screen.getByLabelText('Endereço')).toHaveValue('Rua A, 10')
    expect(screen.getByLabelText('Bairro')).toHaveValue('Centro')
    expect(screen.getByLabelText('Cidade (opcional)')).toHaveValue('Fortaleza')
    expect(screen.getByLabelText('Valor da entrega')).toHaveValue(12)
    expect(onSubmit).not.toHaveBeenCalled()
    await user.clear(screen.getByLabelText('Observações (opcional)'))
    await user.selectOptions(screen.getByLabelText('Forma de pagamento'), 'PIX')
    await user.selectOptions(
      screen.getByLabelText('Status do pagamento'),
      'PAGO',
    )
    await user.type(
      screen.getByLabelText('Observações (opcional)'),
      'Chamar ao chegar',
    )
    await user.click(screen.getByRole('button', { name: 'Salvar Entrega' }))
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          nomeCliente: 'Maria',
          telefoneCliente: '85999990000',
          valorEntrega: 12,
          observacao: 'Chamar ao chegar',
          pagoPeloCliente: false,
          formaPagamento: 'PIX',
          statusPagamentoCliente: 'PAGO',
        }),
      ),
    )
  })
})
