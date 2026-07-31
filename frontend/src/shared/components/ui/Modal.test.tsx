import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from './Modal'

describe('Modal', () => {
  it('renderiza conteúdo quando aberto', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onConfirm = vi.fn()

    render(
      <Modal
        open
        title="Excluir item"
        description="Confirme a exclusão"
        onClose={onClose}
        onConfirm={onConfirm}
        confirmLabel="Excluir"
      />,
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(onConfirm).toHaveBeenCalled()
  })
})
