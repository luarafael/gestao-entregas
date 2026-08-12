import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PasswordInput,
} from '@/shared/components/ui'
import { toast } from '@/shared/stores/toast.store'
import { useAuthStore } from '../stores/auth.store'
import { getDefaultHomePath } from '../utils/permissions'

const APP_NAME = import.meta.env.VITE_APP_NAME ?? 'Gestão de Entregas'

export function ChangePasswordPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const changePassword = useAuthStore((state) => state.changePassword)
  const [senha, setSenha] = useState('')
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (senha.length < 6) {
      toast('A senha deve ter no mínimo 6 caracteres', 'error')
      return
    }

    if (senha !== confirmacaoSenha) {
      toast('As senhas não coincidem', 'error')
      return
    }

    setIsLoading(true)

    try {
      await changePassword(senha, confirmacaoSenha)
      toast('Senha definida com sucesso', 'success')
      navigate(user ? getDefaultHomePath(user.role) : '/', { replace: true })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível salvar a senha'
      toast(message, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex size-16 items-center justify-center">
            <img
              src="/app-logo.png"
              alt={APP_NAME}
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <CardTitle className="text-2xl">Defina sua senha</CardTitle>
          <p className="text-sm text-muted-foreground">
            {user
              ? `Olá, ${user.nome}. Este é seu primeiro acesso — escolha uma senha pessoal para continuar.`
              : 'Escolha uma senha pessoal para continuar.'}
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <PasswordInput
              label="Nova senha"
              autoComplete="new-password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
            />
            <PasswordInput
              label="Confirmar nova senha"
              autoComplete="new-password"
              value={confirmacaoSenha}
              onChange={(event) => setConfirmacaoSenha(event.target.value)}
              placeholder="Repita a senha"
              required
            />
            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
            >
              Salvar senha
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
