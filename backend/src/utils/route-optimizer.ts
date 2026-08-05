export interface DistanceMatrix {
  /** meters[from][to] */
  meters: number[][]
  /** seconds[from][to] */
  seconds: number[][]
}

/** Nearest Neighbor starting at index 0 (depot), returns order of stop indices (1..n). */
export function nearestNeighborOrder(matrix: DistanceMatrix): number[] {
  const n = matrix.seconds.length
  if (n <= 1) return []

  const remaining = new Set(
    Array.from({ length: n - 1 }, (_, i) => i + 1),
  )
  const order: number[] = []
  let current = 0

  while (remaining.size > 0) {
    let best = -1
    let bestCost = Number.POSITIVE_INFINITY

    for (const candidate of remaining) {
      const cost = matrix.seconds[current]?.[candidate] ?? Number.POSITIVE_INFINITY
      if (cost < bestCost) {
        bestCost = cost
        best = candidate
      }
    }

    if (best < 0) break
    order.push(best)
    remaining.delete(best)
    current = best
  }

  return order
}

function routeCost(order: number[], matrix: DistanceMatrix): number {
  let cost = 0
  let current = 0

  for (const next of order) {
    cost += matrix.seconds[current]?.[next] ?? 0
    current = next
  }

  return cost
}

/** 2-opt improvement on stop order (indices into matrix, excluding depot 0). */
export function twoOptImprove(
  order: number[],
  matrix: DistanceMatrix,
  maxIterations = 200,
): number[] {
  if (order.length < 3) return order

  let best = [...order]
  let bestCost = routeCost(best, matrix)
  let improved = true
  let iterations = 0

  while (improved && iterations < maxIterations) {
    improved = false
    iterations += 1

    for (let i = 0; i < best.length - 1; i += 1) {
      for (let k = i + 1; k < best.length; k += 1) {
        const candidate = [
          ...best.slice(0, i),
          ...best.slice(i, k + 1).reverse(),
          ...best.slice(k + 1),
        ]
        const cost = routeCost(candidate, matrix)
        if (cost + 0.5 < bestCost) {
          best = candidate
          bestCost = cost
          improved = true
        }
      }
    }
  }

  return best
}

export function optimizeStopOrder(matrix: DistanceMatrix): number[] {
  const initial = nearestNeighborOrder(matrix)
  return twoOptImprove(initial, matrix)
}

export function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

/** Build approximate road matrix (~1.3x haversine, ~30 km/h urban). */
export function buildHaversineMatrix(
  points: Array<{ lat: number; lng: number }>,
): DistanceMatrix {
  const n = points.length
  const meters: number[][] = Array.from({ length: n }, () => Array(n).fill(0))
  const seconds: number[][] = Array.from({ length: n }, () => Array(n).fill(0))

  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      if (i === j) continue
      const a = points[i]
      const b = points[j]
      if (!a || !b) continue
      const straight = haversineMeters(a.lat, a.lng, b.lat, b.lng)
      const road = straight * 1.3
      meters[i][j] = road
      seconds[i][j] = Math.max(60, Math.round((road / 1000 / 30) * 3600))
    }
  }

  return { meters, seconds }
}

export function summarizeRoute(
  order: number[],
  matrix: DistanceMatrix,
): { distanciaTotal: number; tempoTotal: number; legs: Array<{ distancia: number; tempo: number }> } {
  const legs: Array<{ distancia: number; tempo: number }> = []
  let current = 0
  let distanciaTotal = 0
  let tempoTotal = 0

  for (const next of order) {
    const distancia = matrix.meters[current]?.[next] ?? 0
    const tempo = matrix.seconds[current]?.[next] ?? 0
    legs.push({ distancia, tempo })
    distanciaTotal += distancia
    tempoTotal += tempo
    current = next
  }

  return { distanciaTotal, tempoTotal, legs }
}
