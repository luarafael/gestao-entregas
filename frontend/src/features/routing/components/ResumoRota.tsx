import { StatCard } from '@/shared/components/ui'
import { IconMapPin, IconPackage, IconRoute, IconClock } from '@/shared/components/icons'
import { formatDistance, formatDuration } from '../utils/googleMapsUrl'

interface ResumoRotaProps {
  totalEntregas: number
  distanciaTotal: number
  tempoTotal: number
  enderecoInicial: string
  enderecoLabel?: string
  aproximada?: boolean
}

export function ResumoRota({
  totalEntregas,
  distanciaTotal,
  tempoTotal,
  enderecoInicial,
  enderecoLabel = 'Endereço de embarque',
  aproximada = false,
}: ResumoRotaProps) {
  return (
    <div className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total de entregas"
          value={String(totalEntregas)}
          icon={<IconPackage className="size-5" />}
          accent="primary"
        />
        <StatCard
          title="Distância total"
          value={formatDistance(distanciaTotal)}
          description={aproximada ? 'Estimativa aproximada' : 'Pelas ruas'}
          icon={<IconRoute className="size-5" />}
          accent="success"
          delay={0.05}
        />
        <StatCard
          title="Tempo estimado"
          value={formatDuration(tempoTotal)}
          icon={<IconClock className="size-5" />}
          accent="warning"
          delay={0.1}
        />
        <StatCard
          title={enderecoLabel}
          value={enderecoInicial.slice(0, 28) + (enderecoInicial.length > 28 ? '…' : '')}
          description={enderecoInicial}
          icon={<IconMapPin className="size-5" />}
          accent="neutral"
          delay={0.15}
        />
      </div>
    </div>
  )
}
