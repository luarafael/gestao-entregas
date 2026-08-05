import { useEffect, useMemo } from 'react'
import { MapContainer, Marker, Popup, Polyline, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui'
import type { PlannerStop } from '../schemas/routing.schema'
import { formatDistance, formatDuration } from '../utils/googleMapsUrl'
import 'leaflet/dist/leaflet.css'

interface MapaRotaProps {
  origem: { lat: number; lng: number } | null
  paradas: PlannerStop[]
  selectedTempId?: string | null
  onSelect?: (stop: PlannerStop) => void
}

function createNumberIcon(label: string, color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${color};
      color:white;
      width:28px;height:28px;border-radius:9999px;
      display:flex;align-items:center;justify-content:center;
      font-size:12px;font-weight:700;border:2px solid white;
      box-shadow:0 1px 4px rgba(0,0,0,.35)">${label}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

function FitBounds({
  points,
}: {
  points: Array<[number, number]>
}) {
  const map = useMap()

  useEffect(() => {
    if (points.length === 0) return
    if (points.length === 1) {
      map.setView(points[0]!, 14)
      return
    }
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40] })
  }, [map, points])

  return null
}

export function MapaRota({
  origem,
  paradas,
  selectedTempId,
  onSelect,
}: MapaRotaProps) {
  const points = useMemo(() => {
    const list: Array<[number, number]> = []
    if (origem) list.push([origem.lat, origem.lng])
    for (const stop of paradas) {
      if (stop.latitude != null && stop.longitude != null) {
        list.push([stop.latitude, stop.longitude])
      }
    }
    return list
  }, [origem, paradas])

  const center = points[0] ?? ([-3.7319, -38.5267] as [number, number])

  return (
    <Card glass>
      <CardHeader>
        <CardTitle>Mapa da rota</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 overflow-hidden rounded-xl border border-border/50 md:h-96">
          <MapContainer
            center={center}
            zoom={13}
            className="h-full w-full"
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitBounds points={points} />
            {origem ? (
              <Marker
                position={[origem.lat, origem.lng]}
                icon={createNumberIcon('P', '#6366f1')}
              >
                <Popup>Ponto de partida</Popup>
              </Marker>
            ) : null}
            {paradas.map((stop, index) =>
              stop.latitude != null && stop.longitude != null ? (
                <Marker
                  key={stop.tempId}
                  position={[stop.latitude, stop.longitude]}
                  icon={createNumberIcon(
                    String(stop.ordem ?? index + 1),
                    selectedTempId === stop.tempId ? '#d97706' : '#16a34a',
                  )}
                  eventHandlers={{
                    click: () => onSelect?.(stop),
                  }}
                >
                  <Popup>
                    <div className="space-y-1 text-sm">
                      <p className="font-semibold">
                        {stop.cliente || 'Sem nome'}
                      </p>
                      <p>{stop.endereco}</p>
                      {stop.distancia != null ? (
                        <p>
                          {formatDistance(stop.distancia)} ·{' '}
                          {formatDuration(stop.tempo ?? 0)}
                        </p>
                      ) : null}
                    </div>
                  </Popup>
                </Marker>
              ) : null,
            )}
            {points.length > 1 ? (
              <Polyline positions={points} pathOptions={{ color: '#6366f1', weight: 4 }} />
            ) : null}
          </MapContainer>
        </div>
        {points.length < 2 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Calcule a rota para visualizar pontos e trajeto no mapa.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
