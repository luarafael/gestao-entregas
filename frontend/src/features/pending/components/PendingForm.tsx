import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from '@/shared/components/ui'
import {
  pendingFormSchema,
  toInputDate,
  type PendingFormData,
} from '../schemas/pending.schema'
import { getTodayInputDate } from '@/shared/utils/date'
import { useIsAdmin } from '@/features/auth/hooks/useIsAdmin'
import type { Pendencia } from '@/shared/types/api.types'

interface PendingFormProps {
  editingPending: Pendencia | null
  onSubmit: (data: PendingFormData) => Promise<void>
  onCancelEdit: () => void
  isSubmitting: boolean
}

const defaultValues: PendingFormData = {
  descricao: '',
  valor: 0,
  referenteAoDia: getTodayInputDate(),
  status: 'PENDENTE',
}

export function PendingForm({
  editingPending,
  onSubmit,
  onCancelEdit,
  isSubmitting,
}: PendingFormProps) {
  const isAdmin = useIsAdmin()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PendingFormData>({
    resolver: zodResolver(pendingFormSchema),
    defaultValues,
  })

  useEffect(() => {
    if (editingPending) {
      reset({
        descricao: editingPending.descricao,
        valor: Number(editingPending.valor),
        referenteAoDia: toInputDate(editingPending.referenteAoDia),
        status: editingPending.status,
      })
    } else {
      reset(defaultValues)
    }
  }, [editingPending, reset])

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data)
    reset({ ...defaultValues, referenteAoDia: getTodayInputDate() })
  })

  return (
    <Card glass className="h-fit">
      <CardHeader>
        <CardTitle>
          {editingPending
            ? 'Editar pendência'
            : isAdmin
              ? 'Nova pendência'
              : 'Repasse pendente com o admin'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Input
            label="Descrição"
            placeholder="Ex: Pagamento pendente do dia 12/07"
            error={errors.descricao?.message}
            {...register('descricao')}
          />

          <Input
            label="Valor"
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            error={errors.valor?.message}
            {...register('valor', { valueAsNumber: true })}
          />

          <Input
            label="Referente ao dia"
            type="date"
            error={errors.referenteAoDia?.message}
            {...register('referenteAoDia')}
          />

          {isAdmin ? (
            <div className="space-y-1.5">
              <label htmlFor="status" className="text-sm font-medium text-foreground">
                Status
              </label>
              <select
                id="status"
                className="h-10 w-full rounded-xl border border-border/70 bg-surface/50 px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                {...register('status')}
              >
                <option value="PENDENTE">Pendente</option>
                <option value="RECEBIDO">Recebido</option>
              </select>
              {errors.status?.message ? (
                <p className="text-xs text-danger">{errors.status.message}</p>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="submit" isLoading={isSubmitting} className="flex-1 sm:flex-none">
              {editingPending ? 'Atualizar Pendência' : 'Salvar Pendência'}
            </Button>
            {editingPending ? (
              <Button type="button" variant="ghost" onClick={onCancelEdit}>
                Cancelar
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
