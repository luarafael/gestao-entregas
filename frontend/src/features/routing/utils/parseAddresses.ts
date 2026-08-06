import type { PlannerStop, PrioridadeParada } from '../schemas/routing.schema'

function createTempId() {
  return `tmp_${Math.random().toString(36).slice(2, 10)}`
}

function splitEnderecoBairro(line: string): { endereco: string; bairro?: string } {
  const trailingBairro = line.match(/^(.+?)\s+-\s+([^,-]+)$/)
  if (!trailingBairro) return { endereco: line }
  return {
    endereco: trailingBairro[1]!.trim(),
    bairro: trailingBairro[2]!.trim(),
  }
}

/**
 * Interpreta blocos colados:
 * - "Nome\nEndereço"
 * - "Endereço" sozinho
 * Blocos separados por linha em branco.
 */
export function parsePastedAddresses(raw: string): PlannerStop[] {
  const blocks = raw
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)

  const stops: PlannerStop[] = []

  for (const block of blocks) {
    const lines = block
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    if (lines.length === 0) continue

    if (lines.length === 1) {
      const parsed = splitEnderecoBairro(lines[0]!)
      stops.push({
        tempId: createTempId(),
        endereco: parsed.endereco,
        bairro: parsed.bairro,
        prioridade: 'NORMAL' as PrioridadeParada,
      })
      continue
    }

    const [first, ...rest] = lines
    const looksLikeAddress =
      /\d/.test(first!) ||
      /rua|av\.|avenida|travessa|estrada|rodovia|leite|ce|fortaleza/i.test(
        first!,
      )

    if (looksLikeAddress) {
      stops.push({
        tempId: createTempId(),
        endereco: lines.join(', '),
        prioridade: 'NORMAL',
      })
    } else {
      stops.push({
        tempId: createTempId(),
        cliente: first,
        endereco: rest.join(', '),
        prioridade: 'NORMAL',
      })
    }
  }

  // Fallback: uma linha por endereço
  if (stops.length === 0) {
    const lines = raw
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    for (const line of lines) {
      const parsed = splitEnderecoBairro(line)
      stops.push({
        tempId: createTempId(),
        endereco: parsed.endereco,
        bairro: parsed.bairro,
        prioridade: 'NORMAL',
      })
    }
  }

  return stops
}

export function createPlannerStop(
  partial: Omit<PlannerStop, 'tempId' | 'prioridade'> & {
    prioridade?: PrioridadeParada
  },
): PlannerStop {
  return {
    tempId: createTempId(),
    prioridade: partial.prioridade ?? 'NORMAL',
    statusExecucao: partial.statusExecucao ?? 'PENDENTE',
    ...partial,
  }
}
