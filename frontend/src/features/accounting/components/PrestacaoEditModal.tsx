import { Modal, Textarea } from '@/shared/components/ui'

interface PrestacaoEditModalProps {
  isOpen: boolean
  isSaving: boolean
  observacoes: string
  recalcular: boolean
  title?: string
  description?: string
  showRecalcular?: boolean
  onObservacoesChange: (value: string) => void
  onRecalcularChange: (value: boolean) => void
  onClose: () => void
  onSave: () => void
}

export function PrestacaoEditModal({
  isOpen,
  isSaving,
  observacoes,
  recalcular,
  title = 'Editar prestação',
  description = 'Atualize observações ou recalcule os valores com base nas entregas e pendências do dia.',
  showRecalcular = true,
  onObservacoesChange,
  onRecalcularChange,
  onClose,
  onSave,
}: PrestacaoEditModalProps) {
  if (!isOpen) return null

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      confirmLabel="Salvar"
      onConfirm={onSave}
      isLoading={isSaving}
    >
      <div className="space-y-4">
        <Textarea
          label="Observações"
          value={observacoes}
          onChange={(event) => onObservacoesChange(event.target.value)}
          placeholder="Observações opcionais..."
        />
        {showRecalcular ? (
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={recalcular}
              onChange={(event) => onRecalcularChange(event.target.checked)}
              className="size-4 rounded border-border accent-primary"
            />
            Recalcular totais a partir das entregas e pendências do dia
          </label>
        ) : null}
      </div>
    </Modal>
  )
}
