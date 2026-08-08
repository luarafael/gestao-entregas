import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DeliveryMotoboyForm } from './DeliveryMotoboyForm'

describe('DeliveryMotoboyForm', () => {
  it('exibe erros de validação ao enviar formulário vazio', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(
      <DeliveryMotoboyForm
        editingDelivery={null}
        onSubmit={onSubmit}
        onCancelEdit={() => undefined}
        isSubmitting={false}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Salvar Entrega' }))

    expect(await screen.findByText('Endereço é obrigatório')).toBeInTheDocument()
    expect(screen.getByText('Bairro é obrigatório')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
