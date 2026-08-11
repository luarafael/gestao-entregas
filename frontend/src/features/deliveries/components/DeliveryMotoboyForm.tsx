import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  MetaChip,
  Textarea,
} from '@/shared/components/ui'
import { MotoboySelect } from '@/shared/components/MotoboySelect'
import { useIsAdmin } from '@/features/auth/hooks/useIsAdmin'
import { formatCurrency } from '@/shared/utils/cn'
import {
  deliveryMotoboyFormSchema,
  type DeliveryMotoboyFormData,
} from '../schemas/delivery.schema'
import type { Entrega } from '@/shared/types/api.types'
import { PagoPeloClienteModal } from './PagoPeloClienteModal'
import {
  getValorPagoPeloCliente,
  getValorRecebivelEntrega,
} from '../utils/entregaValor'

interface DeliveryMotoboyFormProps {
  editingDelivery: Entrega | null
  onSubmit: (data: DeliveryMotoboyFormData) => Promise<void>
  onCancelEdit: () => void
  isSubmitting: boolean
}

const defaultValues: DeliveryMotoboyFormData = {
  nomeCliente: '',
  telefoneCliente: '',
  endereco: '',
  bairro: '',
  cidade: '',
  valorEntrega: 0,
  valorPagoCliente: undefined,
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
  const [pagoModalOpen, setPagoModalOpen] = useState(false)
  const [pagoModalKey, setPagoModalKey] = useState(0)

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<DeliveryMotoboyFormData>({
    resolver: zodResolver(deliveryMotoboyFormSchema),
    defaultValues,
  })

  const valorEntrega = watch('valorEntrega')
  const pagoPeloCliente = watch('pagoPeloCliente')
  const valorPagoCliente = watch('valorPagoCliente')
  const telefoneCliente = watch('telefoneCliente')

  useEffect(() => {
    if (editingDelivery) {
      reset({
        nomeCliente: editingDelivery.nomeCliente ?? '',
        telefoneCliente: editingDelivery.telefoneCliente ?? '',
        endereco: editingDelivery.endereco,
        bairro: editingDelivery.bairro,
        cidade: editingDelivery.cidade ?? '',
        valorEntrega: Number(editingDelivery.valorEntrega),
        valorPagoCliente: editingDelivery.valorPagoCliente
          ? Number(editingDelivery.valorPagoCliente)
          : editingDelivery.pagoPeloCliente
            ? Number(editingDelivery.valorEntrega)
            : undefined,
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

  const handleTogglePagoPeloCliente = () => {
    if (pagoPeloCliente) {
      setValue('pagoPeloCliente', false)
      setValue('valorPagoCliente', undefined)
      setValue('telefoneCliente', '')
      return
    }

    if (!valorEntrega || valorEntrega <= 0) {
      setError('valorEntrega', {
        type: 'manual',
        message: 'Informe o valor da entrega antes',
      })
      return
    }

    setPagoModalKey((current) => current + 1)
    setPagoModalOpen(true)
  }

  const previewEntrega = {
    valorEntrega: valorEntrega || 0,
    pagoPeloCliente: Boolean(pagoPeloCliente),
    valorPagoCliente: valorPagoCliente ?? null,
  }

  return (
    <>
      <Card glass className="h-fit min-w-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {editingDelivery ? 'Editar Entrega' : 'Nova Entrega — Motoboy'}
          </CardTitle>
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

            <div className="grid gap-3">
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

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleTogglePagoPeloCliente}
                className="flex w-full cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-surface/30 p-3 text-left"
              >
                <input
                  type="checkbox"
                  readOnly
                  checked={Boolean(pagoPeloCliente)}
                  className="mt-0.5 size-4 rounded border-border accent-primary"
                />
                <span className="text-sm leading-snug">
                  <span className="font-medium text-foreground">
                    Pago pelo cliente
                  </span>
                  <span className="mt-0.5 block text-muted-foreground">
                    Abre um formulário para informar valor e telefone. O valor
                    informado será descontado da prestação.
                  </span>
                </span>
              </button>

              {pagoPeloCliente ? (
                <div className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
                  <div className="flex flex-wrap gap-2">
                    <MetaChip tone="money" className="tabular-nums">
                      Pago: {formatCurrency(getValorPagoPeloCliente(previewEntrega))}
                    </MetaChip>
                    <MetaChip tone="motoboyFee" className="tabular-nums">
                      Recebível: {formatCurrency(getValorRecebivelEntrega(previewEntrega))}
                    </MetaChip>
                    {telefoneCliente?.trim() ? (
                      <MetaChip tone="phone">{telefoneCliente.trim()}</MetaChip>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setPagoModalKey((current) => current + 1)
                      setPagoModalOpen(true)
                    }}
                  >
                    Editar pagamento do cliente
                  </Button>
                </div>
              ) : null}

              {errors.telefoneCliente?.message ? (
                <p className="text-sm text-red-500">{errors.telefoneCliente.message}</p>
              ) : null}
              {errors.valorPagoCliente?.message ? (
                <p className="text-sm text-red-500">{errors.valorPagoCliente.message}</p>
              ) : null}
            </div>

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

      <PagoPeloClienteModal
        key={pagoModalKey}
        open={pagoModalOpen}
        valorEntrega={valorEntrega || 0}
        initialValues={{
          valorPagoCliente: valorPagoCliente ?? valorEntrega,
          telefoneCliente: telefoneCliente ?? '',
        }}
        onClose={() => setPagoModalOpen(false)}
        onConfirm={(values) => {
          setValue('pagoPeloCliente', true)
          setValue('valorPagoCliente', values.valorPagoCliente)
          setValue('telefoneCliente', values.telefoneCliente)
          setPagoModalOpen(false)
        }}
      />
    </>
  )
}
