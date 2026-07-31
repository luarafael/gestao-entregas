import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastContainer } from './ToastContainer'
import { useToastStore } from '@/shared/stores/toast.store'

describe('ToastContainer', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] })
  })

  it('renderiza toasts ativos', async () => {
    useToastStore.setState({
      toasts: [{ id: '1', message: 'Salvo!', type: 'success' }],
    })

    render(<ToastContainer />)

    expect(screen.getByText('Salvo!')).toBeInTheDocument()
  })

  it('remove toast ao clicar', async () => {
    const user = userEvent.setup()
    useToastStore.setState({
      toasts: [{ id: '1', message: 'Erro', type: 'error' }],
    })

    render(<ToastContainer />)
    await user.click(screen.getByRole('button', { name: 'Fechar notificação' }))

    expect(useToastStore.getState().toasts).toHaveLength(0)
  })
})
