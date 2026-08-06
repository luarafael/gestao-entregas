import { env } from '../config/env.js'
import type { DistanceMatrix } from '../utils/route-optimizer.js'
import {
  buildGeocodeCandidates,
  formatRoutingAddress,
  resolveAddressParts,
  toGeocodeRequest,
  type GeocodeRequest,
} from '../utils/geocoding.utils.js'

export interface LatLng {
  lat: number
  lng: number
}

const ROUTES_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes'
const MATRIX_URL =
  'https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix'
const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json'
const PHOTON_URL = 'https://photon.komoot.io/api/'
const FORTALEZA_BBOX = '-38.65,-3.88,-38.42,-3.68'

function hasApiKey() {
  return Boolean(env.GOOGLE_MAPS_API_KEY?.trim())
}

async function geocodeAddress(candidate: string): Promise<LatLng | null> {
  if (!hasApiKey()) return null

  const url = new URL(GEOCODE_URL)
  url.searchParams.set('address', candidate)
  url.searchParams.set('key', env.GOOGLE_MAPS_API_KEY)
  url.searchParams.set('region', 'br')
  url.searchParams.set('language', 'pt-BR')

  const response = await fetch(url, { signal: AbortSignal.timeout(12_000) })
  if (!response.ok) return null

  const data = (await response.json()) as {
    status: string
    results?: Array<{ geometry: { location: { lat: number; lng: number } } }>
  }

  if (data.status === 'OK' && data.results?.[0]) {
    return data.results[0].geometry.location
  }

  return null
}

async function geocodeNominatimFreeform(candidate: string): Promise<LatLng | null> {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', candidate)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '1')
  url.searchParams.set('countrycodes', 'br')

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

async function geocodeNominatimStructured(
  input: GeocodeRequest,
): Promise<LatLng | null> {
  const { street, bairro, cidade } = resolveAddressParts(input)
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '1')
  url.searchParams.set('countrycodes', 'br')
  url.searchParams.set('country', 'Brasil')
  url.searchParams.set('state', 'Ceará')
  url.searchParams.set('city', cidade)
  url.searchParams.set(
    'street',
    bairro ? `${street}, ${bairro}` : street,
  )

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

async function geocodePhoton(candidate: string): Promise<LatLng | null> {
  const url = new URL(PHOTON_URL)
  url.searchParams.set('q', candidate)
  url.searchParams.set('limit', '1')
  url.searchParams.set('lang', 'pt')
  url.searchParams.set('bbox', FORTALEZA_BBOX)

  const response = await fetch(url, { signal: AbortSignal.timeout(12_000) })
  if (!response.ok) return null

  const data = (await response.json()) as {
    features?: Array<{ geometry?: { coordinates?: [number, number] } }>
  }

  const coordinates = data.features?.[0]?.geometry?.coordinates
  if (!coordinates) return null

  return { lat: coordinates[1], lng: coordinates[0] }
}

const NOMINATIM_DELAY_MS = 1100

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function geocode(
  value: string | GeocodeRequest,
): Promise<LatLng | null> {
  const input = toGeocodeRequest(value)

  try {
    const candidates = buildGeocodeCandidates(input)

    if (hasApiKey()) {
      for (const candidate of candidates) {
        const google = await geocodeAddress(candidate)
        if (google) return google
      }
    }

    for (const candidate of candidates) {
      const photon = await geocodePhoton(candidate)
      if (photon) return photon
    }

    for (const candidate of candidates) {
      const nominatim = await geocodeNominatimFreeform(candidate)
      if (nominatim) return nominatim
      if (!hasApiKey()) {
        await delay(NOMINATIM_DELAY_MS)
      }
    }

    const structured = await geocodeNominatimStructured(input)
    if (structured) return structured

    return null
  } catch {
    return null
  }
}

export async function geocodeMany(
  values: Array<string | GeocodeRequest>,
): Promise<Array<LatLng | null>> {
  const results: Array<LatLng | null> = []

  for (const value of values) {
    results.push(await geocode(value))
  }

  return results
}

function toWaypoint(address: string) {
  return { location: { address } }
}

async function computeRouteMatrix(
  origin: string,
  destinations: Array<string | GeocodeRequest>,
): Promise<DistanceMatrix | null> {
  if (!hasApiKey() || destinations.length === 0) return null

  const originAddress = origin
  const stopAddresses = destinations.map((item) =>
    formatRoutingAddress(toGeocodeRequest(item)),
  )
  const origins = [originAddress, ...stopAddresses]
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
  const order: number[] = [...intermediate, destinations.length - 1]

  return {
    order,
    polyline: route.polyline?.encodedPolyline,
  }
}

export const googleRoutesService = {
  hasApiKey,
  geocode,
  geocodeMany,
  computeRouteMatrix,
  computeOptimizedRoute,
}
