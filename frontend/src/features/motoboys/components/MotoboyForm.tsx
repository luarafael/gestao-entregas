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
  PasswordInput,
} from '@/shared/components/ui'
import {
  motoboyFormSchema,
  type MotoboyFormData,
} from '../schemas/motoboy.schema'
import type { Motoboy } from '../types'

interface MotoboyFormProps {
  editingMotoboy: Motoboy | null
  onSubmit: (data: MotoboyFormData) => Promise<void>
  onCancelEdit: () => void
  isSubmitting: boolean
}

const defaultValues: MotoboyFormData = {
  nome: '',
  email: '',
  senha: '',
  pix: '',
}

export function MotoboyForm({
  editingMotoboy,
  onSubmit,
  onCancelEdit,
  isSubmitting,
}: MotoboyFormProps) {
  const isEditing = Boolean(editingMotoboy)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<MotoboyFormData>({
    resolver: zodResolver(motoboyFormSchema),
    defaultValues,
  })

  useEffect(() => {
    if (editingMotoboy) {
      reset({
        nome: editingMotoboy.nome,
        email: editingMotoboy.email,
        senha: '',
        pix: editingMotoboy.pix ?? '',
      })
    } else {
      reset(defaultValues)
    }
  }, [editingMotoboy, reset])

  const handleFormSubmit = handleSubmit(async (data) => {
    const senha = data.senha?.trim() ?? ''
    if (!isEditing && senha.length < 6) {
      setError('senha', {
        type: 'manual',
        message: 'Senha deve ter no mínimo 6 caracteres',
      })
      return
    }

    await onSubmit(data)
    if (!isEditing) {
      reset(defaultValues)
    }
  })

  return (
    <Card glass className="h-fit min-w-0 w-full max-w-full">
      <CardHeader>
        <CardTitle className="text-base leading-snug sm:text-lg">
          {isEditing ? 'Editar motoboy' : 'Novo motoboy'}
        </CardTitle>
      </CardHeader>
      <CardContent className="min-w-0">
        <form onSubmit={handleFormSubmit} className="min-w-0 space-y-4">
          <Input
            label="Nome"
            placeholder="Nome do funcionário"
            error={errors.nome?.message}
            {...register('nome')}
          />

          <Input
            label="E-mail"
            type="email"
            placeholder="motoboy@empresa.com"
            autoComplete="off"
            error={errors.email?.message}
            {...register('email')}
          />

          <PasswordInput
            label={isEditing ? 'Nova senha (opcional)' : 'Senha'}
            placeholder={isEditing ? 'Deixe em branco para manter' : 'Mínimo 6 caracteres'}
            autoComplete="new-password"
            error={errors.senha?.message}
            {...register('senha')}
          />

          <Input
            label="PIX (opcional)"
            placeholder="CPF, e-mail, telefone ou chave aleatória"
            autoComplete="off"
            error={errors.pix?.message}
            {...register('pix')}
          />

          <div className="flex flex-wrap gap-2">
            <Button type="submit" isLoading={isSubmitting}>
              {isEditing ? 'Salvar alterações' : 'Criar motoboy'}
            </Button>
            {isEditing ? (
              <Button
                type="button"
                variant="secondary"
                onClick={onCancelEdit}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
