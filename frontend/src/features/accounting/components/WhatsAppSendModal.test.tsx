import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WhatsAppSendModal } from './WhatsAppSendModal'

vi.mock('../stores/whatsappContacts.store', () => ({
  useWhatsAppContactsStore: (selector: (state: object) => unknown) =>
    selector({
      contacts: [
        { id: '1', name: 'Financeiro', phone: '5511999998888' },
      ],
      lastSelectedContactId: '1',
      addContact: vi.fn(),
      setLastSelectedContactId: vi.fn(),
    }),
}))

vi.mock('../utils/whatsappUrl', () => ({
  openWhatsApp: vi.fn().mockResolvedValue(undefined),
  formatWhatsAppPhoneDisplay: (phone: string) => phone,
}))

describe('WhatsAppSendModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza modal com favoritos e opção de relatório', () => {
    render(
      <WhatsAppSendModal
        open
        onClose={vi.fn()}
        payload={{
          baseText: 'Prestação de contas',
          dailyReport: {
            date: '2026-07-31',
            totalEntregas: 2,
            valorTotal: 100,
            valorPendencias: 0,
            valorFinal: 100,
          },
        }}
      />,
    )

    expect(screen.getByText('Enviar no WhatsApp')).toBeInTheDocument()
    expect(screen.getByText('Financeiro')).toBeInTheDocument()
    expect(
      screen.getByLabelText(/Incluir relatório diário/i),
    ).toBeInTheDocument()
  })

  it('chama openWhatsApp ao confirmar envio', async () => {
    const { openWhatsApp } = await import('../utils/whatsappUrl')

    render(
      <WhatsAppSendModal
        open
        onClose={vi.fn()}
        payload={{
          baseText: 'Texto base',
          dailyReport: {
            date: '2026-07-31',
            totalEntregas: 1,
            valorTotal: 50,
            valorPendencias: 0,
            valorFinal: 50,
          },
        }}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /^Enviar$/ }))

    expect(openWhatsApp).toHaveBeenCalled()
  })
})
