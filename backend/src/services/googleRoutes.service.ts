import { env } from '../config/env.js'
import type { DistanceMatrix } from '../utils/route-optimizer.js'

export interface LatLng {
  lat: number
  lng: number
}

export interface GoogleOptimizeResult {
  order: number[]
  matrix: DistanceMatrix
  polyline?: string
  origin: LatLng
  destinations: LatLng[]
  usedGoogle: boolean
}

const ROUTES_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes'
const MATRIX_URL =
  'https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix'
const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json'

function hasApiKey() {
  return Boolean(env.GOOGLE_MAPS_API_KEY?.trim())
}

async function geocodeAddress(address: string): Promise<LatLng | null> {
  if (!hasApiKey()) return null

  const url = new URL(GEOCODE_URL)
  url.searchParams.set('address', address)
  url.searchParams.set('key', env.GOOGLE_MAPS_API_KEY)
  url.searchParams.set('region', 'br')
  url.searchParams.set('language', 'pt-BR')

  const response = await fetch(url, { signal: AbortSignal.timeout(12_000) })
  if (!response.ok) return null

  const data = (await response.json()) as {
    status: string
    results?: Array<{ geometry: { location: { lat: number; lng: number } } }>
  }

  if (data.status !== 'OK' || !data.results?.[0]) return null
  return data.results[0].geometry.location
}

async function geocodeNominatim(address: string): Promise<LatLng | null> {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', address)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '1')

  const response = await fetch(url, {
    headers: { 'User-Agent': 'sistema-rotas/1.0' },
    signal: AbortSignal.timeout(12_000),
  })
  if (!response.ok) return null

  const data = (await response.json()) as Array<{ lat: string; lon: string }>
  const first = data[0]
  if (!first) return null
  return { lat: Number(first.lat), lng: Number(first.lon) }
}

export async function geocode(address: string): Promise<LatLng | null> {
  try {
    if (hasApiKey()) {
      const google = await geocodeAddress(address)
      if (google) return google
    }
    return await geocodeNominatim(address)
  } catch {
    return null
  }
}

function toWaypoint(address: string) {
  return { location: { address } }
}

async function computeRouteMatrix(
  origin: string,
  destinations: string[],
): Promise<DistanceMatrix | null> {
  if (!hasApiKey() || destinations.length === 0) return null

  const origins = [origin, ...destinations]
  const body = {
    origins: origins.map((address) => ({ waypoint: toWaypoint(address) })),
    destinations: origins.map((address) => ({ waypoint: toWaypoint(address) })),
    travelMode: 'DRIVE',
    routingPreference: 'TRAFFIC_AWARE',
  }

  const response = await fetch(MATRIX_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': env.GOOGLE_MAPS_API_KEY,
      'X-Goog-FieldMask':
        'originIndex,destinationIndex,duration,distanceMeters,status',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(25_000),
  })

  if (!response.ok) return null

  const rows = (await response.json()) as Array<{
    originIndex?: number
    destinationIndex?: number
    duration?: string
    distanceMeters?: number
    status?: { code?: number }
  }>

  if (!Array.isArray(rows)) return null

  const n = origins.length
  const meters: number[][] = Array.from({ length: n }, () => Array(n).fill(0))
  const seconds: number[][] = Array.from({ length: n }, () => Array(n).fill(0))

  for (const row of rows) {
    const i = row.originIndex ?? 0
    const j = row.destinationIndex ?? 0
    if (row.status?.code && row.status.code !== 0) continue
    meters[i][j] = row.distanceMeters ?? 0
    const match = row.duration?.match(/^(\d+)/)
    seconds[i][j] = match ? Number(match[1]) : 0
  }

  return { meters, seconds }
}

async function computeOptimizedRoute(
  origin: string,
  destinations: string[],
): Promise<{ order: number[]; polyline?: string } | null> {
  if (!hasApiKey() || destinations.length === 0) return null

  const body = {
    origin: toWaypoint(origin),
    destination: toWaypoint(destinations[destinations.length - 1]!),
    intermediates: destinations.slice(0, -1).map(toWaypoint),
    travelMode: 'DRIVE',
    routingPreference: 'TRAFFIC_AWARE',
    optimizeWaypointOrder: destinations.length > 1,
    languageCode: 'pt-BR',
    regionCode: 'BR',
  }

  const response = await fetch(ROUTES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': env.GOOGLE_MAPS_API_KEY,
      'X-Goog-FieldMask':
        'routes.optimizedIntermediateWaypointIndex,routes.polyline.encodedPolyline,routes.legs.distanceMeters,routes.legs.duration',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(25_000),
  })

  if (!response.ok) return null

  const data = (await response.json()) as {
    routes?: Array<{
      optimizedIntermediateWaypointIndex?: number[]
      polyline?: { encodedPolyline?: string }
    }>
  }

  const route = data.routes?.[0]
  if (!route) return null

  const intermediate = route.optimizedIntermediateWaypointIndex ?? []
  // Map: intermediates are indices 0..n-2 of destinations[0..n-2], last dest fixed at end unless we rebuild.
  // When optimizeWaypointOrder is true, Google returns order of intermediate waypoints only;
  // destination stays last. We remap to destination indices 0..n-1.
  const order: number[] = [
    ...intermediate,
    destinations.length - 1,
  ]

  return {
    order,
    polyline: route.polyline?.encodedPolyline,
  }
}

export const googleRoutesService = {
  hasApiKey,
  geocode,
  computeRouteMatrix,
  computeOptimizedRoute,
}
