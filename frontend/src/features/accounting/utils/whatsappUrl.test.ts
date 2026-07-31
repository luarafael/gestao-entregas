import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  buildWhatsAppUrl,
  encodeWhatsAppText,
  formatWhatsAppPhoneDisplay,
  normalizeWhatsAppPhone,
  openWhatsApp,
} from './whatsappUrl'

describe('whatsappUrl', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('normaliza número brasileiro com DDD', () => {
    expect(normalizeWhatsAppPhone('(11) 99999-8888')).toBe('5511999998888')
  })

  it('mantém número já com código do país', () => {
    expect(normalizeWhatsAppPhone('5511987654321')).toBe('5511987654321')
  })

  it('codifica emoji em UTF-8 na URL', () => {
    const encoded = encodeWhatsAppText('📋 Prestação')
    expect(encoded).toContain('%F0%9F%93%8B')
  })

  it('monta URL do WhatsApp com texto codificado', () => {
    const url = buildWhatsAppUrl('11999998888', 'Olá mundo')
    expect(url).toContain('https://api.whatsapp.com/send?phone=5511999998888')
    expect(url).toContain(encodeURIComponent('Olá mundo'))
  })

  it('formata número para exibição', () => {
    expect(formatWhatsAppPhoneDisplay('5511999998888')).toBe(
      '+55 (11) 99999-8888',
    )
  })

  it('no desktop copia texto e abre chat sem parâmetro text', async () => {
    vi.spyOn(window, 'open').mockImplementation(() => null)
    vi.stubGlobal(
      'navigator',
      {
        ...navigator,
        userAgent: 'Windows NT 10.0',
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      },
    )

    await openWhatsApp('11999998888', '📋 Prestação')

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('📋 Prestação')
    expect(window.open).toHaveBeenCalledWith(
      'https://api.whatsapp.com/send?phone=5511999998888',
      '_blank',
      'noopener,noreferrer',
    )
  })
})
