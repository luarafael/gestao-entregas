import { describe, it, expect } from 'vitest'
import {
  applyUrgentPriority,
  buildHaversineMatrix,
  matrixOrderToParadaIndices,
  nearestNeighborOrder,
  optimizeStopOrder,
  paradaIndicesToMatrixOrder,
  summarizeRoute,
  summarizeRouteFromCoords,
  twoOptImprove,
} from '../utils/route-optimizer.js'

describe('route-optimizer', () => {
  const matrix = {
    meters: [
      [0, 1000, 5000, 2000],
      [1000, 0, 4000, 1500],
      [5000, 4000, 0, 3000],
      [2000, 1500, 3000, 0],
    ],
    seconds: [
      [0, 120, 600, 240],
      [120, 0, 480, 180],
      [600, 480, 0, 360],
      [240, 180, 360, 0],
    ],
  }

  it('calcula nearest neighbor a partir do depósito', () => {
    const order = nearestNeighborOrder(matrix)
    expect(order[0]).toBe(1)
    expect(order).toHaveLength(3)
  })

  it('melhora rota com 2-opt', () => {
    const initial = [2, 1, 3]
    const improved = twoOptImprove(initial, matrix)
    const initialCost = summarizeRoute(initial, matrix).tempoTotal
    const improvedCost = summarizeRoute(improved, matrix).tempoTotal
    expect(improvedCost).toBeLessThanOrEqual(initialCost)
  })

  it('otimiza ordem completa', () => {
    const order = optimizeStopOrder(matrix)
    expect(order).toHaveLength(3)
    expect(new Set(order).size).toBe(3)
  })

  it('monta matriz haversine aproximada', () => {
    const haversine = buildHaversineMatrix([
      { lat: -3.73, lng: -38.52 },
      { lat: -3.74, lng: -38.53 },
      { lat: -3.75, lng: -38.54 },
    ])

    expect(haversine.meters[0][1]).toBeGreaterThan(0)
    expect(haversine.seconds[0][1]).toBeGreaterThan(0)
  })

  it('converte índices da matriz para índices das paradas', () => {
    const matrixOrder = optimizeStopOrder(matrix)
    const paradaOrder = matrixOrderToParadaIndices(matrixOrder)
    const summary = summarizeRoute(matrixOrder, matrix)

    expect(paradaOrder.every((index) => index >= 0 && index < 3)).toBe(true)
    expect(summary.distanciaTotal).toBeGreaterThan(0)
    expect(summary.legs.every((leg) => leg.distancia > 0)).toBe(true)
    expect(paradaIndicesToMatrixOrder(paradaOrder)).toEqual(matrixOrder)
  })

  it('calcula trechos parciais quando faltam coordenadas', () => {
    const summary = summarizeRouteFromCoords(
      [0, 1, 2],
      { lat: -3.73, lng: -38.52 },
      [
        null,
        { lat: -3.74, lng: -38.53 },
        { lat: -3.75, lng: -38.54 },
      ],
    )

    expect(summary.legs[0]?.distancia).toBe(0)
    expect(summary.legs[1]?.distancia).toBeGreaterThan(0)
    expect(summary.legs[2]?.distancia).toBeGreaterThan(0)
    expect(summary.distanciaTotal).toBeGreaterThan(0)
  })

  it('coloca urgentes no início respeitando ordemUrgencia', () => {
    const paradas = [
      { prioridade: 'NORMAL' as const, ordemUrgencia: null },
      { prioridade: 'URGENTE' as const, ordemUrgencia: 2 },
      { prioridade: 'URGENTE' as const, ordemUrgencia: 1 },
      { prioridade: 'NORMAL' as const, ordemUrgencia: null },
    ]

    const order = applyUrgentPriority([0, 1, 2, 3], paradas)
    expect(order).toEqual([2, 1, 0, 3])
  })
})
