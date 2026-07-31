import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Pagination } from './Pagination'

describe('Pagination', () => {
  it('não renderiza com uma página', () => {
    const { container } = render(
      <Pagination page={1} totalPages={1} onPageChange={vi.fn()} />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('navega entre páginas', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()

    render(<Pagination page={2} totalPages={3} onPageChange={onPageChange} />)

    await user.click(screen.getByRole('button', { name: 'Próxima' }))
    await user.click(screen.getByRole('button', { name: 'Anterior' }))

    expect(onPageChange).toHaveBeenCalledWith(3)
    expect(onPageChange).toHaveBeenCalledWith(1)
  })
})
