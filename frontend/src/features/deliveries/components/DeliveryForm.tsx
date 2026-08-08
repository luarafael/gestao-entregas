import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea } from '@/shared/components/ui'
import { MotoboySelect } from '@/shared/components/MotoboySelect'
import { useIsAdmin } from '@/features/auth/hooks/useIsAdmin'
import {
  deliveryFormSchema,
  FORMA_PAGAMENTO_OPTIONS,
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
  valorProduto: undefined,
  formaPagamento: undefined,
  valorEntrega: 0,
  observacao: '',
  pagoPeloCliente: false,
  motoboyId: '',
}

export function DeliveryForm({
  editingDelivery,
  onSubmit,
  onCancelEdit,
  isSubmitting,
}: DeliveryFormProps) {
  const isAdmin = useIsAdmin()

  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
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
        valorProduto: editingDelivery.valorProduto
          ? Number(editingDelivery.valorProduto)
          : undefined,
        formaPagamento: editingDelivery.formaPagamento ?? undefined,
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
    <Card glass className="h-fit">
      <CardHeader>
        <CardTitle>{editingDelivery ? 'Editar Entrega' : 'Nova Entrega'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleFormSubmit} className="space-y-4">
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
            label="Nome do Cliente"
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
            label="Valor do produto (opcional)"
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            error={errors.valorProduto?.message as string | undefined}
            {...register('valorProduto', {
              setValueAs: (value) =>
                value === '' || Number.isNaN(Number(value))
                  ? undefined
                  : Number(value),
            })}
          />

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">
              Forma de pagamento (opcional)
            </span>
            <select
              className="h-10 w-full rounded-xl border border-border/70 bg-surface/50 px-3 text-sm text-foreground"
              {...register('formaPagamento')}
            >
              <option value="">Selecione...</option>
              {FORMA_PAGAMENTO_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <Input
            label="Taxa de entrega"
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
