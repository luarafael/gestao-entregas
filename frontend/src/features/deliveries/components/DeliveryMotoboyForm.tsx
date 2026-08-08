import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea } from '@/shared/components/ui'
import { MotoboySelect } from '@/shared/components/MotoboySelect'
import { useIsAdmin } from '@/features/auth/hooks/useIsAdmin'
import {
  deliveryMotoboyFormSchema,
  type DeliveryMotoboyFormData,
} from '../schemas/delivery.schema'
import type { Entrega } from '@/shared/types/api.types'

interface DeliveryMotoboyFormProps {
  editingDelivery: Entrega | null
  onSubmit: (data: DeliveryMotoboyFormData) => Promise<void>
  onCancelEdit: () => void
  isSubmitting: boolean
}

const defaultValues: DeliveryMotoboyFormData = {
  nomeCliente: '',
  endereco: '',
  bairro: '',
  cidade: '',
  valorEntrega: 0,
  observacao: '',
  pagoPeloCliente: false,
  motoboyId: '',
}

export function DeliveryMotoboyForm({
  editingDelivery,
  onSubmit,
  onCancelEdit,
  isSubmitting,
}: DeliveryMotoboyFormProps) {
  const isAdmin = useIsAdmin()

  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    formState: { errors },
  } = useForm<DeliveryMotoboyFormData>({
    resolver: zodResolver(deliveryMotoboyFormSchema),
    defaultValues,
  })

  useEffect(() => {
    if (editingDelivery) {
      reset({
        nomeCliente: editingDelivery.nomeCliente ?? '',
        endereco: editingDelivery.endereco,
        bairro: editingDelivery.bairro,
        cidade: editingDelivery.cidade ?? '',
        valorEntrega: Number(editingDelivery.valorEntrega),
        observacao: editingDelivery.observacao ?? '',
        pagoPeloCliente: editingDelivery.pagoPeloCliente,
        motoboyId: editingDelivery.motoboyId ?? '',
      })
    } else {
      reset(defaultValues)
    }
  }, [editingDelivery, reset])

  const handleFormSubmit = handleSubmit(async (data) => {
    if (isAdmin && !data.motoboyId?.trim()) {
      setError('motoboyId', {
        type: 'manual',
        message: 'Selecione o motoboy responsável',
      })
      return
    }

    await onSubmit({
      ...data,
      pagoPeloCliente: data.pagoPeloCliente ?? false,
      motoboyId: isAdmin ? data.motoboyId : undefined,
    })
    reset(defaultValues)
  })

  return (
    <Card glass className="h-fit min-w-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{editingDelivery ? 'Editar Entrega' : 'Nova Entrega — Motoboy'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleFormSubmit} className="space-y-3">
          {isAdmin ? (
            <Controller
              name="motoboyId"
              control={control}
              render={({ field }) => (
                <MotoboySelect
                  id="entrega-motoboy"
                  label="Motoboy"
                  layout="stack"
                  allowAll={false}
                  value={field.value || ''}
                  onChange={field.onChange}
                  error={errors.motoboyId?.message}
                />
              )}
            />
          ) : null}

          <Input
            label="Nome do Cliente (opcional)"
            placeholder="Ex: João Silva"
            error={errors.nomeCliente?.message}
            {...register('nomeCliente')}
          />

          <Input
            label="Endereço"
            placeholder="Rua, número"
            error={errors.endereco?.message}
            {...register('endereco')}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Bairro"
              placeholder="Ex: Centro"
              error={errors.bairro?.message}
              {...register('bairro')}
            />
            <Input
              label="Cidade (opcional)"
              placeholder="Ex: São Paulo"
              error={errors.cidade?.message}
              {...register('cidade')}
            />
          </div>

          <Input
            label="Valor da entrega"
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            error={errors.valorEntrega?.message}
            {...register('valorEntrega', { valueAsNumber: true })}
          />

          <Textarea
            label="Observações (opcional)"
            placeholder="Informações adicionais..."
            error={errors.observacao?.message}
            {...register('observacao')}
          />

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-surface/30 p-3">
            <input
              type="checkbox"
              className="mt-0.5 size-4 rounded border-border accent-primary"
              {...register('pagoPeloCliente')}
            />
            <span className="text-sm leading-snug">
              <span className="font-medium text-foreground">
                Pago pelo cliente
              </span>
              <span className="mt-0.5 block text-muted-foreground">
                A corrida foi paga diretamente pelo cliente cadastrado e não
                entra no total da prestação.
              </span>
            </span>
          </label>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="submit" isLoading={isSubmitting} className="flex-1 sm:flex-none">
              {editingDelivery ? 'Atualizar Entrega' : 'Salvar Entrega'}
            </Button>
            {editingDelivery ? (
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
