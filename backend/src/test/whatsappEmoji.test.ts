import { describe, it, expect } from 'vitest'
import { WA } from '../utils/whatsappEmoji.js'

describe('whatsappEmoji', () => {
  it('gera emojis UTF-8 válidos via code point', () => {
    expect(WA.report).toBe('\u{1F4CB}')
    expect(WA.clock).toBe('\u{1F550}')
    expect(WA.money).toBe('\u{1F4B0}')
  })
})
