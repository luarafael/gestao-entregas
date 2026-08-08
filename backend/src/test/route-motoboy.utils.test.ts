import { describe, expect, it } from 'vitest'
import {
  isRouteActiveFromExecucoes,
  isRouteExecucaoConcluida,
  resolveMotoboyIdFromRota,
  routeBelongsToMotoboy,
  routeHasExecutionProgress,
} from '../utils/route-motoboy.utils.js'

describe('route-motoboy utils', () => {
  it('considera rota ativa quando ainda há paradas pendentes', () => {
    expect(
      isRouteActiveFromExecucoes(
        [{ status: 'ENTREGUE' }, { status: 'PENDENTE' }],
        2,
      ),
    ).toBe(true)
  })

  it('considera rota concluída quando não há paradas ativas', () => {
    expect(
      isRouteActiveFromExecucoes(
        [{ status: 'ENTREGUE' }, { status: 'CLIENTE_AUSENTE' }],
        2,
      ),
    ).toBe(false)
  })

  it('detecta progresso quando alguma parada saiu de pendente', () => {
    expect(routeHasExecutionProgress([{ status: 'PENDENTE' }])).toBe(false)
    expect(routeHasExecutionProgress([{ status: 'EM_ROTA' }])).toBe(true)
  })

  it('associa rota ao motoboy pelo campo da rota ou pelas entregas', () => {
    const entregaMotoboyById = new Map([
      ['e1', 'm1'],
      ['e2', 'm2'],
    ])

    expect(
      routeBelongsToMotoboy(
        { motoboyId: 'm1', paradas: [] },
        'm1',
        entregaMotoboyById,
      ),
    ).toBe(true)

    expect(
      routeBelongsToMotoboy(
        { motoboyId: null, paradas: [{ entregaId: 'e1' }] },
        'm1',
        entregaMotoboyById,
      ),
    ).toBe(true)

    expect(
      routeBelongsToMotoboy(
        { motoboyId: null, paradas: [{ entregaId: 'e2' }] },
        'm1',
        entregaMotoboyById,
      ),
    ).toBe(false)
  })

  it('identifica rota concluída somente quando todas as paradas estão entregues', () => {
    expect(
      isRouteExecucaoConcluida(
        [{ status: 'ENTREGUE' }, { status: 'ENTREGUE' }],
        2,
      ),
    ).toBe(true)

    expect(
      isRouteExecucaoConcluida(
        [{ status: 'ENTREGUE' }, { status: 'PENDENTE' }],
        2,
      ),
    ).toBe(false)
  })

  it('resolve motoboy da rota pelo campo direto ou pelas entregas vinculadas', () => {
    const entregaMotoboyById = new Map([
      ['e1', 'm1'],
      ['e2', 'm2'],
    ])

    expect(
      resolveMotoboyIdFromRota(
        { motoboyId: 'm1', paradas: [] },
        entregaMotoboyById,
      ),
    ).toBe('m1')

    expect(
      resolveMotoboyIdFromRota(
        { motoboyId: null, paradas: [{ entregaId: 'e1' }] },
        entregaMotoboyById,
      ),
    ).toBe('m1')
  })
})
