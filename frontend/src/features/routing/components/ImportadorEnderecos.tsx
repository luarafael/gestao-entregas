import { useState } from 'react'
import { Button, Card, CardContent, CardHeader, CardTitle, Textarea } from '@/shared/components/ui'
import { parsePastedAddresses } from '../utils/parseAddresses'
import type { PlannerStop } from '../schemas/routing.schema'
import { toast } from '@/shared/stores/toast.store'

interface ImportadorEnderecosProps {
  onImport: (stops: PlannerStop[]) => void
}

export function ImportadorEnderecos({ onImport }: ImportadorEnderecosProps) {
  const [raw, setRaw] = useState('')

  const handleImport = () => {
    const stops = parsePastedAddresses(raw)
    if (stops.length === 0) {
      toast('Nenhum endereço válido encontrado', 'error')
      return
    }
    onImport(stops)
    setRaw('')
    toast(`${stops.length} endereço(s) importado(s)`, 'success')
  }

  return (
    <Card glass>
      <CardHeader>
        <CardTitle>Importação rápida</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          label="Cole endereços (nome + endereço ou só endereço)"
          placeholder={`João\nRua A, 120\n\nMaria\nRua B, 500`}
          value={raw}
          onChange={(event) => setRaw(event.target.value)}
          rows={6}
        />
        <Button variant="secondary" onClick={handleImport} disabled={!raw.trim()}>
          Interpretar e adicionar
        </Button>
      </CardContent>
    </Card>
  )
}
