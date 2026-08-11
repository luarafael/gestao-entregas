import { useState } from 'react'
import { Modal, Input } from '@/shared/components/ui'
import { formatCurrency } from '@/shared/utils/cn'

export interface PagoPeloClienteModalValues {
  valorPagoCliente: number
  telefoneCliente: string
}

interface PagoPeloClienteModalProps {
  open: boolean
  valorEntrega: number
  initialValues?: Partial<PagoPeloClienteModalValues>
  onClose: () => void
  onConfirm: (values: PagoPeloClienteModalValues) => void
}

export function PagoPeloClienteModal({
  open,
  valorEntrega,
  initialValues,
  onClose,
  onConfirm,
}: PagoPeloClienteModalProps) {
  const [valorPagoCliente, setValorPagoCliente] = useState(
    initialValues?.valorPagoCliente ?? valorEntrega,
  )
  const [telefoneCliente, setTelefoneCliente] = useState(
    initialValues?.telefoneCliente ?? '',
  )
  const [error, setError] = useState<string | null>(null)

  const valorRecebivel = Math.max(0, valorEntrega - (valorPagoCliente || 0))

  const handleConfirm = () => {
    if (!telefoneCliente.trim() || telefoneCliente.trim().length < 8) {
      setError('Informe o telefone do cliente')
      return
    }

    if (!valorPagoCliente || valorPagoCliente <= 0) {
      setError('Informe o valor pago pelo cliente')
      return
    }

    if (valorPagoCliente > valorEntrega) {
      setError('O valor pago não pode ser maior que o valor da entrega')
      return
    }

    onConfirm({
      valorPagoCliente,
      telefoneCliente: telefoneCliente.trim(),
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Pago pelo cliente"
      description="Informe quanto o cliente pagou diretamente. Esse valor será descontado do total da prestação."
      confirmLabel="Salvar"
      onConfirm={handleConfirm}
    >
      <div className="space-y-4">
        <Input
          label="Valor pago pelo cliente"
          type="number"
          step="0.01"
          min="0"
          max={valorEntrega}
          value={Number.isFinite(valorPagoCliente) ? valorPagoCliente : ''}
          onChange={(event) =>
            setValorPagoCliente(Number(event.target.value))
          }
        />

        <Input
          label="Telefone do cliente"
          placeholder="(85) 99999-9999"
          value={telefoneCliente}
          onChange={(event) => setTelefoneCliente(event.target.value)}
        />

        <div className="rounded-xl border border-border/60 bg-surface/30 p-3 text-sm">
          <p className="text-muted-foreground">
            Valor da corrida:{' '}
            <span className="font-medium text-foreground">
              {formatCurrency(valorEntrega)}
            </span>
          </p>
          <p className="mt-1 text-muted-foreground">
            Valor a receber na prestação:{' '}
            <span className="font-medium text-emerald-600 dark:text-emerald-300">
              {formatCurrency(valorRecebivel)}
            </span>
          </p>
        </div>

        {error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : null}
      </div>
    </Modal>
  )
}
