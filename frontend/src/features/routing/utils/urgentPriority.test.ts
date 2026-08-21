import { describe, it, expect } from 'vitest'
import {
  formatUrgentLabel,
  normalizePlannerStopForm,
  resolveNextOrdemUrgencia,
  sortStopsByUrgentPriority,
} from './urgentPriority'
import type { PlannerStop } from '../schemas/routing.schema'

describe('urgentPriority', () => {
  const stops: PlannerStop[] = [
    {
      tempId: '1',
      endereco: 'Rua A',
      prioridade: 'URGENTE',
      ordemUrgencia: 1,
    },
    {
      tempId: '2',
      endereco: 'Rua B',
      prioridade: 'URGENTE',
      ordemUrgencia: 2,
    },
  ]

  it('sugere próxima ordem de urgência disponível', () => {
    expect(resolveNextOrdemUrgencia(stops)).toBe(3)
  })

  it('normaliza entrega normal sem ordem de urgência', () => {
    const result = normalizePlannerStopForm(
      {
        endereco: 'Rua C',
        prioridade: 'NORMAL',
        ordemUrgencia: 1,
      },
      stops,
    )

    expect(result.ordemUrgencia).toBeUndefined()
  })

  it('atribui ordem automática para nova urgente', () => {
    const result = normalizePlannerStopForm(
      {
        endereco: 'Rua D',
        prioridade: 'URGENTE',
      },
      stops,
    )

    expect(result.ordemUrgencia).toBe(3)
  })

  it('formata rótulo de urgência', () => {
    expect(formatUrgentLabel(1)).toBe('Urgente 1ª')
    expect(formatUrgentLabel()).toBe('Urgente')
  })

  it('coloca urgentes 1 e 2 no início da lista', () => {
    const ordered = sortStopsByUrgentPriority([
      { tempId: 'n1', endereco: 'Rua N', prioridade: 'NORMAL' as const },
      { tempId: 'u2', endereco: 'Rua U2', prioridade: 'URGENTE' as const, ordemUrgencia: 2 },
      { tempId: 'u1', endereco: 'Rua U1', prioridade: 'URGENTE' as const, ordemUrgencia: 1 },
    ])

    expect(ordered.map((stop) => stop.tempId)).toEqual(['u1', 'u2', 'n1'])
    expect(ordered.map((stop) => stop.ordem)).toEqual([1, 2, 3])
  })
})
