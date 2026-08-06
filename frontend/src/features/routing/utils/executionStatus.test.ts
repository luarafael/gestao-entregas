import { describe, it, expect } from 'vitest'
import {
  computeExecutionStats,
  getNextStop,
  getActiveStopsForRoute,
  isProblemStatus,
} from './executionStatus'
import type { PlannerStop } from '../schemas/routing.schema'

const baseStop = (overrides: Partial<PlannerStop>): PlannerStop => ({
  tempId: '1',
  endereco: 'Rua A',
  prioridade: 'NORMAL',
  ...overrides,
})

describe('executionStatus', () => {
  it('calcula estatísticas de progresso', () => {
    const stops: PlannerStop[] = [
      baseStop({ tempId: '1', statusExecucao: 'ENTREGUE', ordem: 1 }),
      baseStop({ tempId: '2', statusExecucao: 'PENDENTE', ordem: 2 }),
      baseStop({ tempId: '3', statusExecucao: 'EM_ROTA', ordem: 3 }),
      baseStop({
        tempId: '4',
        statusExecucao: 'CLIENTE_AUSENTE',
        ordem: 4,
      }),
    ]

    const stats = computeExecutionStats(stops)
    expect(stats.entregues).toBe(1)
    expect(stats.pendentes).toBe(1)
    expect(stats.emRota).toBe(1)
    expect(stats.problemas).toBe(1)
    expect(stats.percentual).toBe(25)
  })

  it('prioriza parada em rota como próxima', () => {
    const stops: PlannerStop[] = [
      baseStop({ tempId: '1', statusExecucao: 'ENTREGUE', ordem: 1 }),
      baseStop({ tempId: '2', statusExecucao: 'PENDENTE', ordem: 2 }),
      baseStop({ tempId: '3', statusExecucao: 'EM_ROTA', ordem: 3 }),
    ]

    expect(getNextStop(stops)?.tempId).toBe('3')
  })

  it('remove entregues da rota ativa', () => {
    const stops: PlannerStop[] = [
      baseStop({ tempId: '1', statusExecucao: 'ENTREGUE' }),
      baseStop({ tempId: '2', statusExecucao: 'PENDENTE' }),
    ]

    expect(getActiveStopsForRoute(stops)).toHaveLength(1)
    expect(getActiveStopsForRoute(stops)[0]?.tempId).toBe('2')
  })

  it('identifica status de problema', () => {
    expect(isProblemStatus('CLIENTE_AUSENTE')).toBe(true)
    expect(isProblemStatus('ENTREGUE')).toBe(false)
  })
})
