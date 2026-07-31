import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea } from '@/shared/components/ui'
import {
  deliveryFormSchema,
  type DeliveryFormData,
} from '../schemas/delivery.schema'
import type { Entrega } from '@/shared/types/api.types'

interface DeliveryFormProps {
  editingDelivery: Entrega | null
  onSubmit: (data: DeliveryFormData) => Promise<void>
  onCancelEdit: () => void
  isSubmitting: boolean
}

const defaultValues: DeliveryFormData = {
  nomeCliente: '',
  endereco: '',
  bairro: '',
  cidade: '',
  valorEntrega: 0,
  observacao: '',
}

export function DeliveryForm({
  editingDelivery,
  onSubmit,
  onCancelEdit,
  isSubmitting,
}: DeliveryFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DeliveryFormData>({
    resolver: zodResolver(deliveryFormSchema),
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
      })
    } else {
      reset(defaultValues)
    }
  }, [editingDelivery, reset])

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data)
    reset(defaultValues)
  })

  return (
    <Card glass className="h-fit">
      <CardHeader>
        <CardTitle>{editingDelivery ? 'Editar Entrega' : 'Nova Entrega'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleFormSubmit} className="space-y-4">
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
