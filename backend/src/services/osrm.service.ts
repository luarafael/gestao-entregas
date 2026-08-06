import type { DistanceMatrix } from '../utils/route-optimizer.js'
import type { LatLng } from './googleRoutes.service.js'

const OSRM_BASE = 'https://router.project-osrm.org'

function toCoordinatePath(points: LatLng[]): string {
  return points.map((point) => `${point.lng},${point.lat}`).join(';')
}

async function computeRouteMatrix(
  points: LatLng[],
): Promise<DistanceMatrix | null> {
  if (points.length < 2) return null

  const url = `${OSRM_BASE}/table/v1/driving/${toCoordinatePath(points)}?annotations=duration,distance`

  const response = await fetch(url, { signal: AbortSignal.timeout(20_000) })
  if (!response.ok) return null

  const data = (await response.json()) as {
    code?: string
    durations?: number[][]
    distances?: number[][]
  }

  if (data.code !== 'Ok' || !data.durations || !data.distances) return null

  const n = points.length
  const meters: number[][] = Array.from({ length: n }, () => Array(n).fill(0))
  const seconds: number[][] = Array.from({ length: n }, () => Array(n).fill(0))

  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      const distance = data.distances[i]?.[j]
      const duration = data.durations[i]?.[j]
      if (distance == null || duration == null) continue
      meters[i][j] = distance
      seconds[i][j] = Math.round(duration)
    }
  }

  return { meters, seconds }
}

async function computeRoutePolyline(points: LatLng[]): Promise<string | null> {
  if (points.length < 2) return null

  const url = `${OSRM_BASE}/route/v1/driving/${toCoordinatePath(points)}?overview=full&geometries=polyline`

  const response = await fetch(url, { signal: AbortSignal.timeout(20_000) })
  if (!response.ok) return null

  const data = (await response.json()) as {
    code?: string
    routes?: Array<{ geometry?: string }>
  }

  if (data.code !== 'Ok' || !data.routes?.[0]?.geometry) return null
  return data.routes[0].geometry
}

export const osrmService = {
  computeRouteMatrix,
  computeRoutePolyline,
}
