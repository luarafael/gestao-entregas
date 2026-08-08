import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea } from '@/shared/components/ui'
import {
  deliveryClienteFormSchema,
  FORMA_PAGAMENTO_OPTIONS,
  STATUS_PAGAMENTO_OPTIONS,
  type DeliveryClienteFormData,
} from '../schemas/delivery.schema'
import type { Entrega } from '@/shared/types/api.types'

interface DeliveryClienteFormProps {
  editingDelivery: Entrega | null
  onSubmit: (data: DeliveryClienteFormData) => Promise<void>
  onCancelEdit: () => void
  isSubmitting: boolean
}

const defaultValues: DeliveryClienteFormData = {
  nomeCliente: '',
  telefoneCliente: '',
  endereco: '',
  valorProduto: 0,
  formaPagamento: 'DINHEIRO',
  statusPagamento: 'NAO_PAGO',
  valorEntregaMotoboy: undefined as unknown as number,
  valorEntrega: undefined,
  observacao: '',
  cidade: '',
}

export function DeliveryClienteForm({
  editingDelivery,
  onSubmit,
  onCancelEdit,
  isSubmitting,
}: DeliveryClienteFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DeliveryClienteFormData>({
    resolver: zodResolver(deliveryClienteFormSchema),
    defaultValues,
  })

  useEffect(() => {
    if (editingDelivery) {
      reset({
        nomeCliente: editingDelivery.nomeCliente ?? '',
        telefoneCliente: editingDelivery.telefoneCliente ?? '',
        endereco: editingDelivery.endereco,
        valorProduto: Number(editingDelivery.valorProduto ?? 0),
        formaPagamento: editingDelivery.formaPagamento ?? 'DINHEIRO',
        statusPagamento: editingDelivery.statusPagamentoCliente ?? 'NAO_PAGO',
        valorEntregaMotoboy: Number(editingDelivery.valorEntregaMotoboy ?? 0),
        valorEntrega:
          Number(editingDelivery.valorEntrega) > 0
            ? Number(editingDelivery.valorEntrega)
            : undefined,
        observacao: editingDelivery.observacao ?? '',
        cidade: editingDelivery.cidade ?? '',
      })
    } else {
      reset(defaultValues)
    }
  }, [editingDelivery, reset])

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data)
    if (!editingDelivery) {
      reset(defaultValues)
    }
  })

  return (
    <Card glass className="h-fit min-w-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{editingDelivery ? 'Editar Pedido' : 'Novo Pedido — Cliente'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleFormSubmit} className="space-y-3">
          <Input
            label="Nome do cliente"
            placeholder="Ex: João Silva"
            error={errors.nomeCliente?.message}
            {...register('nomeCliente')}
          />

          <Input
            label="Telefone do cliente"
            placeholder="Ex: (11) 99999-9999"
            error={errors.telefoneCliente?.message}
            {...register('telefoneCliente')}
          />

          <Input
            label="Endereço"
            placeholder="Rua, número"
            error={errors.endereco?.message}
            {...register('endereco')}
          />

          <Input
            label="Cidade (opcional)"
            placeholder="Ex: São Paulo"
            error={errors.cidade?.message}
            {...register('cidade')}
          />

          <Input
            label="Valor do produto"
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            error={errors.valorProduto?.message}
            {...register('valorProduto', { valueAsNumber: true })}
          />

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Forma de pagamento</span>
            <select
              className="h-10 w-full rounded-xl border border-border/70 bg-surface/50 px-3 text-sm text-foreground"
              {...register('formaPagamento')}
            >
              {FORMA_PAGAMENTO_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.formaPagamento?.message ? (
              <p className="text-xs text-destructive">{errors.formaPagamento.message}</p>
            ) : null}
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Status do pagamento</span>
            <select
              className="h-10 w-full rounded-xl border border-border/70 bg-surface/50 px-3 text-sm text-foreground"
              {...register('statusPagamento')}
            >
              {STATUS_PAGAMENTO_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.statusPagamento?.message ? (
              <p className="text-xs text-destructive">{errors.statusPagamento.message}</p>
            ) : null}
          </label>

          <Input
            label="Valor entrega motoboy"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0,00"
            error={errors.valorEntregaMotoboy?.message}
            {...register('valorEntregaMotoboy', { valueAsNumber: true })}
          />

          <Input
            label="Taxa de entrega (opcional)"
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            error={errors.valorEntrega?.message}
            {...register('valorEntrega', {
              setValueAs: (value) =>
                value === '' || Number.isNaN(Number(value)) ? undefined : Number(value),
            })}
          />

          <Textarea
            label="Observações (opcional)"
            placeholder="Informações adicionais..."
            error={errors.observacao?.message}
            {...register('observacao')}
          />

          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="submit" isLoading={isSubmitting} className="flex-1 sm:flex-none">
              {editingDelivery ? 'Atualizar Pedido' : 'Salvar Pedido'}
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
