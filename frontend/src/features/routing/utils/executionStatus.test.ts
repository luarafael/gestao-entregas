import { describe, it, expect } from 'vitest'
import {
  computeExecutionStats,
  getNextStop,
  getActiveStopsForRoute,
  getStopLegMetrics,
  isProblemStatus,
  isAllStopsDelivered,
  isExecucaoConcluida,
  shouldClearPlannerRoute,
  applyStatusUpdate,
  mergeStopsWithStatus,
  resolveEmbarqueEndereco,
  getLastDeliveredStop,
  formatStopEmbarqueAddress,
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

  it('identifica quando todas as paradas foram entregues', () => {
    expect(
      isAllStopsDelivered([
        baseStop({ statusExecucao: 'ENTREGUE' }),
        baseStop({ tempId: '2', statusExecucao: 'ENTREGUE' }),
      ]),
    ).toBe(true)
    expect(
      isAllStopsDelivered([
        baseStop({ statusExecucao: 'ENTREGUE' }),
        baseStop({ tempId: '2', statusExecucao: 'PENDENTE' }),
      ]),
    ).toBe(false)
  })

  it('detecta execução concluída e rota legada para limpar planejador', () => {
    expect(
      isExecucaoConcluida(
        [{ status: 'ENTREGUE' }, { status: 'ENTREGUE' }],
        2,
      ),
    ).toBe(true)

    expect(
      shouldClearPlannerRoute({
        concluidaEm: null,
        paradaCount: 2,
        execucoes: [{ status: 'ENTREGUE' }, { status: 'ENTREGUE' }],
      }),
    ).toBe(true)

    expect(
      shouldClearPlannerRoute({
        concluidaEm: '2026-08-08T12:00:00.000Z',
        paradaCount: 2,
        execucoes: [{ status: 'ENTREGUE' }, { status: 'PENDENTE' }],
      }),
    ).toBe(true)
  })

  it('congela km e tempo ao marcar entregue', () => {
    const delivered = applyStatusUpdate(
      baseStop({
        distancia: 5200,
        tempo: 900,
      }),
      'ENTREGUE',
    )

    expect(delivered.distanciaEntrega).toBe(5200)
    expect(delivered.tempoEntrega).toBe(900)
    expect(getStopLegMetrics(delivered)).toEqual({
      distancia: 5200,
      tempo: 900,
    })
  })

  it('preserva metricas ao mesclar paradas apos recalculo', () => {
    const base = [
      baseStop({
        tempId: '1',
        distancia: 5200,
        tempo: 900,
        statusExecucao: 'ENTREGUE',
      }),
    ]
    const updated = [
      baseStop({
        tempId: '1',
        distancia: 0,
        tempo: 0,
      }),
    ]

    const merged = mergeStopsWithStatus(base, updated)
    expect(merged[0]?.distancia).toBe(5200)
    expect(merged[0]?.tempo).toBe(900)
  })

  it('usa endereço padrão enquanto nenhuma entrega foi concluída', () => {
    const stops = [
      baseStop({ tempId: '1', statusExecucao: 'PENDENTE', ordem: 1 }),
      baseStop({ tempId: '2', statusExecucao: 'EM_ROTA', ordem: 2 }),
    ]

    expect(
      resolveEmbarqueEndereco(stops, 'Depósito Central'),
    ).toBe('Depósito Central')
  })

  it('atualiza embarque para o último endereço entregue', () => {
    const stops = [
      baseStop({
        tempId: '1',
        statusExecucao: 'ENTREGUE',
        ordem: 1,
        endereco: 'Rua A, 100',
        bairro: 'Centro',
        statusAtualizadoEm: '2026-08-08T10:00:00.000Z',
      }),
      baseStop({
        tempId: '2',
        statusExecucao: 'ENTREGUE',
        ordem: 2,
        endereco: 'Rua B, 200',
        bairro: 'Aldeota',
        statusAtualizadoEm: '2026-08-08T11:00:00.000Z',
      }),
      baseStop({ tempId: '3', statusExecucao: 'PENDENTE', ordem: 3 }),
    ]

    expect(formatStopEmbarqueAddress(stops[1]!)).toBe('Rua B, 200 — Aldeota')
    expect(getLastDeliveredStop(stops)?.tempId).toBe('2')
    expect(resolveEmbarqueEndereco(stops, 'Depósito Central')).toBe(
      'Rua B, 200 — Aldeota',
    )
  })
})
