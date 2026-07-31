export function normalizeWhatsAppPhone(input: string): string {
  let digits = input.replace(/\D/g, '')

  if (digits.startsWith('0')) {
    digits = digits.slice(1)
  }

  if (
    digits.length >= 10 &&
    digits.length <= 11 &&
    !digits.startsWith('55')
  ) {
    digits = `55${digits}`
  }

  return digits
}

export function formatWhatsAppPhoneDisplay(phone: string): string {
  const digits = normalizeWhatsAppPhone(phone)

  if (digits.length === 13 && digits.startsWith('55')) {
    const ddd = digits.slice(2, 4)
    const part1 = digits.slice(4, 9)
    const part2 = digits.slice(9)
    return `+55 (${ddd}) ${part1}-${part2}`
  }

  return phone
}

export function encodeWhatsAppText(text: string): string {
  return encodeURIComponent(text)
}

export function buildWhatsAppUrl(phone: string, text: string): string {
  const normalizedPhone = normalizeWhatsAppPhone(phone)
  return `https://api.whatsapp.com/send?phone=${normalizedPhone}&text=${encodeWhatsAppText(text)}`
}

function isMobileDevice(): boolean {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
}

/**
 * No Windows/desktop o WhatsApp corrompe emojis passados na URL (?text=).
 * Copiamos a mensagem completa e abrimos só o chat; no mobile usa URL com texto.
 */
export async function openWhatsApp(phone: string, text: string): Promise<void> {
  const normalizedPhone = normalizeWhatsAppPhone(phone)

  if (isMobileDevice()) {
    window.open(buildWhatsAppUrl(normalizedPhone, text), '_blank', 'noopener,noreferrer')
    return
  }

  await navigator.clipboard.writeText(text)
  window.open(
    `https://api.whatsapp.com/send?phone=${normalizedPhone}`,
    '_blank',
    'noopener,noreferrer',
  )
}

export type WhatsAppSendMode = 'url' | 'clipboard'

export function getWhatsAppSendMode(): WhatsAppSendMode {
  return isMobileDevice() ? 'url' : 'clipboard'
}
