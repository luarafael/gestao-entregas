import { beforeEach, describe, it, expect, vi } from 'vitest'
import { useToastStore, toast } from './toast.store'

describe('toast store', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] })
    vi.useFakeTimers()
  })

  it('adiciona toast', () => {
    useToastStore.getState().addToast('Mensagem', 'success')

    expect(useToastStore.getState().toasts).toHaveLength(1)
    expect(useToastStore.getState().toasts[0]?.message).toBe('Mensagem')
  })

  it('remove toast manualmente', () => {
    useToastStore.getState().addToast('Mensagem')
    const id = useToastStore.getState().toasts[0]?.id as string

    useToastStore.getState().removeToast(id)

    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('expõe helper toast', () => {
    toast('Info', 'info')

    expect(useToastStore.getState().toasts[0]?.type).toBe('info')
  })

  it('remove toast automaticamente após timeout', () => {
    useToastStore.getState().addToast('Auto')

    expect(useToastStore.getState().toasts).toHaveLength(1)

    vi.advanceTimersByTime(4000)

    expect(useToastStore.getState().toasts).toHaveLength(0)
  })
})
