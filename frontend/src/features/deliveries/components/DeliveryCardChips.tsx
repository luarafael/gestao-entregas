import { MetaChip, MetaSectionTitle } from '@/shared/components/ui/MetaChip'

/**
 * Domain aliases + delivery-specific header.
 * Prefer importing MetaChip / MetaSectionTitle from shared in new code.
 */
export const DeliveryCardChip = MetaChip
export const DeliveryCardSectionTitle = MetaSectionTitle

export function DeliveryCardHeader({
  horario,
  nomeCliente,
  telefone,
  endereco,
  motoboyNome,
  imported,
}: {
  horario: string
  nomeCliente?: string | null
  telefone?: string | null
  endereco: string
  motoboyNome?: string | null
  imported?: boolean
}) {
  return (
    <div className="min-w-0 flex-1 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <MetaChip tone="time">{horario}</MetaChip>
        {imported ? <MetaChip tone="imported">Importado</MetaChip> : null}
        {motoboyNome ? (
          <MetaChip tone="motoboy" title={`Motoboy: ${motoboyNome}`}>
            {motoboyNome}
          </MetaChip>
        ) : null}
      </div>

      <MetaChip
        tone="client"
        className="max-w-full text-sm font-semibold"
        title={nomeCliente ?? undefined}
      >
        {nomeCliente?.trim() || 'Sem nome de cliente'}
      </MetaChip>

      {telefone ? (
        <MetaChip tone="phone" className="tabular-nums">
          {telefone}
        </MetaChip>
      ) : null}

      <MetaChip tone="address" className="w-full items-start whitespace-normal">
        <span className="line-clamp-2 text-left leading-relaxed">{endereco}</span>
      </MetaChip>
    </div>
  )
}
