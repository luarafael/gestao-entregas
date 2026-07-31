import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { useCopyWhatsAppText } from './usePrestacao'
import { createTestQueryClient } from '@/test/test-utils'

vi.mock('@/shared/stores/toast.store', () => ({
  toast: vi.fn(),
}))

function createWrapper() {
  const queryClient = createTestQueryClient()

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('useCopyWhatsAppText', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  it('copia texto para clipboard', async () => {
    const { result } = renderHook(() => useCopyWhatsAppText(), {
      wrapper: createWrapper(),
    })

    await result.current.mutateAsync('Texto WhatsApp')

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Texto WhatsApp')
  })

  it('trata erro ao copiar', async () => {
    vi.mocked(navigator.clipboard.writeText).mockRejectedValue(new Error('fail'))

    const { result } = renderHook(() => useCopyWhatsAppText(), {
      wrapper: createWrapper(),
    })

    await expect(result.current.mutateAsync('Texto')).rejects.toThrow()
  })
})
