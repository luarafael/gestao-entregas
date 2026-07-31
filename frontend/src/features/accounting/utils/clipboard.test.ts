import { describe, it, expect, vi, beforeEach } from 'vitest'
import { copyToClipboard } from './clipboard'

describe('copyToClipboard', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  it('copia texto para a área de transferência', async () => {
    await copyToClipboard('Texto de teste')

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Texto de teste')
  })
})
