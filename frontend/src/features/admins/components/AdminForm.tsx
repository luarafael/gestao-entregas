import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Input, PasswordInput } from '@/shared/components/ui'
import {
  adminFormSchema,
  type AdminFormData,
} from '../schemas/admin.schema'
import type { AdminUser } from '../types'

interface AdminFormProps {
  editingAdmin: AdminUser | null
  onSubmit: (data: AdminFormData) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
}

const defaultValues: AdminFormData = {
  nome: '',
  email: '',
  senha: '',
}

export function AdminForm({
  editingAdmin,
  onSubmit,
  onCancel,
  isSubmitting,
}: AdminFormProps) {
  const isEditing = Boolean(editingAdmin)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<AdminFormData>({
    resolver: zodResolver(adminFormSchema),
    defaultValues,
  })

  useEffect(() => {
    if (editingAdmin) {
      reset({
        nome: editingAdmin.nome,
        email: editingAdmin.email,
        senha: '',
      })
    } else {
      reset(defaultValues)
    }
  }, [editingAdmin, reset])

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
  })

  return (
    <form onSubmit={handleFormSubmit} className="min-w-0 space-y-4">
      <Input
        label="Nome"
        placeholder="Nome do administrador"
        error={errors.nome?.message}
        {...register('nome')}
      />

      <Input
        label="E-mail"
        type="email"
        placeholder="admin@empresa.com"
        autoComplete="off"
        error={errors.email?.message}
        {...register('email')}
      />

      <PasswordInput
        label={isEditing ? 'Nova senha (opcional)' : 'Senha temporária'}
        placeholder={
          isEditing ? 'Deixe em branco para manter' : 'Mínimo 6 caracteres'
        }
        autoComplete="new-password"
        error={errors.senha?.message}
        {...register('senha')}
      />

      {!isEditing ? (
        <p className="text-xs text-muted-foreground">
          No primeiro acesso, o usuário precisará redefinir a senha — igual ao
          login administrativo principal.
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2 border-t border-border/40 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {isEditing ? 'Salvar alterações' : 'Criar administrador'}
        </Button>
      </div>
    </form>
  )
}
