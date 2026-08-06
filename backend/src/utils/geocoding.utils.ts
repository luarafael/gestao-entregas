export interface GeocodeRequest {
  endereco: string
  bairro?: string | null
  cidade?: string | null
}

export const DEFAULT_GEOCODE_CITY = 'Fortaleza'

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Separa logradouro, bairro e cidade quando vêm misturados no endereço. */
export function resolveAddressParts(input: GeocodeRequest): {
  street: string
  bairro: string | null
  cidade: string
} {
  let street = input.endereco.trim()
  let bairro = input.bairro?.trim() || null
  let cidade = input.cidade?.trim() || DEFAULT_GEOCODE_CITY

  const cidadeMatch = street.match(/\s*-\s*([^,-]+)\s*-\s*Fortaleza/i)
  if (cidadeMatch && !bairro) {
    bairro = cidadeMatch[1]?.trim() ?? null
    street = street.replace(/\s*-\s*[^,-]+\s*-\s*Fortaleza.*$/i, '').trim()
  }

  street = street
    .replace(/\s*-\s*Fortaleza(?:\s*\/\s*CE)?.*$/i, '')
    .replace(/,\s*Fortaleza(?:\s*-\s*CE)?.*$/i, '')
    .trim()

  if (!bairro) {
    const trailingBairro = street.match(/^(.+?)\s+-\s+([^,-]+)$/)
    if (trailingBairro) {
      street = trailingBairro[1]!.trim()
      bairro = trailingBairro[2]!.trim()
    }
  } else if (street.toLowerCase().includes(bairro.toLowerCase())) {
    street = street
      .replace(new RegExp(`\\s*-\\s*${escapeRegex(bairro)}`, 'i'), '')
      .replace(new RegExp(`,\\s*${escapeRegex(bairro)}`, 'i'), '')
      .trim()
  }

  return { street, bairro, cidade }
}

/** Gera variações do endereço para aumentar chance de localização. */
export function buildGeocodeCandidates(input: GeocodeRequest): string[] {
  const { street, bairro, cidade } = resolveAddressParts(input)
  const candidates = new Set<string>()

  if (bairro) {
    candidates.add(`${street} - ${bairro}, ${cidade}, CE, Brasil`)
    candidates.add(`${street}, ${bairro}, ${cidade}, Ceará, Brasil`)
    candidates.add(`${street}, ${bairro}, ${cidade}`)
  }

  candidates.add(`${street}, ${cidade}, CE, Brasil`)
  candidates.add(`${street}, ${cidade}`)

  if (bairro) {
    candidates.add(`${bairro}, ${cidade}, CE, Brasil`)
  }

  const original = input.endereco.trim()
  if (original) candidates.add(original)

  return [...candidates]
}

export function toGeocodeRequest(
  value: string | GeocodeRequest,
): GeocodeRequest {
  if (typeof value === 'string') return { endereco: value }
  return value
}

export function formatRoutingAddress(input: GeocodeRequest): string {
  const { street, bairro, cidade } = resolveAddressParts(input)
  if (bairro) return `${street} - ${bairro}, ${cidade}, CE`
  return `${street}, ${cidade}, CE`
}
