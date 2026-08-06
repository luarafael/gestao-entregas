import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  Input,
  Modal,
  Textarea,
} from '@/shared/components/ui'
import {
  plannerStopSchema,
  type PlannerStop,
  type PlannerStopFormData,
} from '../schemas/routing.schema'
import { resolveNextOrdemUrgencia } from '../utils/urgentPriority'

interface FormularioEntregaProps {
  open: boolean
  editing: PlannerStop | null
  stops: PlannerStop[]
  onClose: () => void
  onSubmit: (data: PlannerStopFormData) => void
}

const FORM_ID = 'planner-stop-form'
const ORDEM_URGENCIA_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export function FormularioEntrega({
  open,
  editing,
  stops,
  onClose,
  onSubmit,
}: FormularioEntregaProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<PlannerStopFormData>({
    resolver: zodResolver(plannerStopSchema),
    defaultValues: {
      cliente: '',
      endereco: '',
      bairro: '',
      observacao: '',
      prioridade: 'NORMAL',
      ordemUrgencia: undefined,
    },
  })

  const prioridade = useWatch({ control, name: 'prioridade' })
  const suggestedOrdem = resolveNextOrdemUrgencia(stops, editing?.tempId)

  useEffect(() => {
    if (!open) return
    const initialPrioridade = editing?.prioridade ?? 'NORMAL'
    reset({
      cliente: editing?.cliente ?? '',
      endereco: editing?.endereco ?? '',
      bairro: editing?.bairro ?? '',
      observacao: editing?.observacao ?? '',
      prioridade: initialPrioridade,
      ordemUrgencia:
        initialPrioridade === 'URGENTE'
          ? editing?.ordemUrgencia ?? suggestedOrdem
          : undefined,
    })
  }, [editing, open, reset, suggestedOrdem])

  useEffect(() => {
    if (prioridade === 'URGENTE' && !getValues('ordemUrgencia')) {
      setValue('ordemUrgencia', suggestedOrdem)
    }
    if (prioridade === 'NORMAL') {
      setValue('ordemUrgencia', undefined)
    }
  }, [prioridade, suggestedOrdem, setValue, getValues])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar entrega do planejamento' : 'Adicionar entrega'}
      description="Esta entrega fica só no planejador. Não altera o cadastro de Entregas."
      className="max-w-lg"
    >
      <div className="flex min-h-0 flex-col">
        <form
          id={FORM_ID}
          className="space-y-4"
          onSubmit={handleSubmit((data) => {
            onSubmit(data)
            onClose()
          })}
        >
          <Input
            label="Cliente"
            placeholder="Opcional"
            error={errors.cliente?.message}
            {...register('cliente')}
          />
          <Input
            label="Endereço"
            placeholder="Rua e número"
            error={errors.endereco?.message}
            {...register('endereco')}
          />
          <Input
            label="Bairro"
            placeholder="Ex: Centro, Meireles..."
            error={errors.bairro?.message}
            {...register('bairro')}
          />
          <Textarea
            label="Observação"
            placeholder="Opcional"
            error={errors.observacao?.message}
            {...register('observacao')}
          />
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-muted-foreground">Prioridade</span>
            <select
              className="h-10 w-full rounded-xl border border-border/70 bg-surface/50 px-3 text-sm"
              {...register('prioridade')}
            >
              <option value="NORMAL">Normal</option>
              <option value="URGENTE">Urgente</option>
            </select>
          </label>
          {prioridade === 'URGENTE' ? (
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-muted-foreground">
                Ordem entre urgentes
              </span>
              <select
                className="h-10 w-full rounded-xl border border-border/70 bg-surface/50 px-3 text-sm"
                {...register('ordemUrgencia', {
                  setValueAs: (value) => {
                    const parsed = Number(value)
                    return Number.isNaN(parsed) ? undefined : parsed
                  },
                })}
              >
                {ORDEM_URGENCIA_OPTIONS.map((ordem) => (
                  <option key={ordem} value={ordem}>
                    {ordem}ª mais urgente
                    {ordem === suggestedOrdem && !editing?.ordemUrgencia
                      ? ' (sugerida)'
                      : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                1ª = primeira parada da rota. Urgentes sempre vêm antes das
                normais.
              </p>
            </label>
          ) : null}
        </form>

        <div className="sticky bottom-0 mt-4 flex shrink-0 justify-end gap-2 border-t border-border/40 bg-card pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form={FORM_ID}>
            {editing ? 'Atualizar' : 'Salvar'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
