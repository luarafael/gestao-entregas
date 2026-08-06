import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PendingForm } from './PendingForm'

describe('PendingForm', () => {
  it('exibe erros de validação ao enviar formulário vazio', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(
      <PendingForm
        editingPending={null}
        onSubmit={onSubmit}
        onCancelEdit={() => undefined}
        isSubmitting={false}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Descrição é obrigatória')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
