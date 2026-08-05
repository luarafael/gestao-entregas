import { useState } from 'react'
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@/shared/components/ui'
import { IconMapPin } from '@/shared/components/icons'
import { DEFAULT_START_ADDRESS } from '../schemas/routing.schema'
import {
  useEnderecoPartida,
  useUpdateEnderecoPartida,
} from '../hooks/useRouting'

export function EnderecoInicial() {
  const { data, isLoading } = useEnderecoPartida()
  const updateEndereco = useUpdateEnderecoPartida()
  const enderecoInicial =
    data?.enderecoPartidaPadrao ?? DEFAULT_START_ADDRESS
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(enderecoInicial)

  const handleSave = async () => {
    const trimmed = draft.trim()
    if (!trimmed) return

    await updateEndereco.mutateAsync(trimmed)
    setEditing(false)
  }

  const handleRestoreDefault = async () => {
    setDraft(DEFAULT_START_ADDRESS)
    await updateEndereco.mutateAsync(DEFAULT_START_ADDRESS)
    setEditing(false)
  }

  if (isLoading) {
    return (
      <Card glass>
        <CardHeader>
          <CardTitle>Endereço de partida</CardTitle>
          <IconMapPin className="size-5 text-primary" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card glass>
      <CardHeader>
        <CardTitle>Endereço de partida</CardTitle>
        <IconMapPin className="size-5 text-primary" />
      </CardHeader>
      <CardContent className="space-y-3">
        {editing ? (
          <>
            <Input
              label="Endereço de partida"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleSave}
                disabled={updateEndereco.isPending || !draft.trim()}
              >
                Salvar padrão
              </Button>
              <Button
                variant="ghost"
                onClick={handleRestoreDefault}
                disabled={updateEndereco.isPending}
              >
                Restaurar padrão
              </Button>
              <Button variant="ghost" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-foreground">{enderecoInicial}</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setDraft(enderecoInicial)
                setEditing(true)
              }}
            >
              Alterar endereço padrão
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
