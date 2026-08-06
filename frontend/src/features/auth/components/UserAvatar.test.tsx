import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserAvatar } from './UserAvatar'
import { useProfileStore } from '../stores/profile.store'

vi.mock('@/shared/stores/toast.store', () => ({
  toast: vi.fn(),
}))

describe('UserAvatar', () => {
  beforeEach(() => {
    useProfileStore.setState({ avatars: {} })
  })

  it('exibe iniciais quando nao ha foto', () => {
    render(<UserAvatar userId="user-1" nome="Luã Rafael" />)

    expect(screen.getByText('LR')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Alterar foto do perfil' })).toBeInTheDocument()
  })

  it('abre seletor de imagem ao clicar no avatar', async () => {
    const user = userEvent.setup()
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click')

    render(<UserAvatar userId="user-1" nome="Luã Rafael" />)

    await user.click(screen.getByRole('button', { name: 'Alterar foto do perfil' }))

    expect(clickSpy).toHaveBeenCalled()
    clickSpy.mockRestore()
  })
})
