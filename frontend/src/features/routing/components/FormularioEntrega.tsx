import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
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

interface FormularioEntregaProps {
  open: boolean
  editing: PlannerStop | null
  onClose: () => void
  onSubmit: (data: PlannerStopFormData) => void
}

export function FormularioEntrega({
  open,
  editing,
  onClose,
  onSubmit,
}: FormularioEntregaProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PlannerStopFormData>({
    resolver: zodResolver(plannerStopSchema),
    defaultValues: {
      cliente: '',
      endereco: '',
      observacao: '',
      prioridade: 'NORMAL',
    },
  })

  useEffect(() => {
    if (!open) return
    reset({
      cliente: editing?.cliente ?? '',
      endereco: editing?.endereco ?? '',
      observacao: editing?.observacao ?? '',
      prioridade: editing?.prioridade ?? 'NORMAL',
    })
  }, [editing, open, reset])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar entrega do planejamento' : 'Adicionar entrega'}
      description="Esta entrega fica só no planejador. Não altera o cadastro de Entregas."
      className="max-w-lg"
    >
      <form
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
          placeholder="Rua, número - bairro"
          error={errors.endereco?.message}
          {...register('endereco')}
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
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">{editing ? 'Atualizar' : 'Salvar'}</Button>
        </div>
      </form>
    </Modal>
  )
}
