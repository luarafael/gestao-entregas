const MAX_WAYPOINTS = 8

/** Gera um ou mais links do Google Maps respeitando o limite de waypoints. */
export function buildGoogleMapsNavigationUrls(
  origin: string,
  stops: Array<{ endereco: string }>,
): string[] {
  if (stops.length === 0) return []

  const chunks: Array<typeof stops> = []
  for (let i = 0; i < stops.length; i += MAX_WAYPOINTS) {
    chunks.push(stops.slice(i, i + MAX_WAYPOINTS))
  }

  return chunks.map((chunk, index) => {
    const chunkOrigin =
      index === 0 ? origin : chunks[index - 1]![chunks[index - 1]!.length - 1]!.endereco
    const destination = chunk[chunk.length - 1]!.endereco
    const waypoints = chunk.slice(0, -1).map((stop) => stop.endereco)

    const params = new URLSearchParams({
      api: '1',
      origin: chunkOrigin,
      destination,
      travelmode: 'driving',
    })

    if (waypoints.length > 0) {
      params.set('waypoints', waypoints.join('|'))
    }

    return `https://www.google.com/maps/dir/?${params.toString()}`
  })
}

export function formatDistance(meters: number) {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

export function formatDuration(seconds: number) {
  const totalMinutes = Math.round(seconds / 60)
  if (totalMinutes < 60) return `${totalMinutes} min`
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`
}
