import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@/shared/components/ui'
import { toast } from '@/shared/stores/toast.store'
import { useAuthStore } from '../stores/auth.store'

const APP_NAME = import.meta.env.VITE_APP_NAME ?? 'Gestão de Entregas'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((state) => state.login)
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname ?? '/'

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoading(true)

    try {
      await login(email.trim(), senha)
      toast('Login realizado com sucesso', 'success')
      navigate(from, { replace: true })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível entrar'
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
          <CardTitle className="text-2xl">{APP_NAME}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Entre com seu e-mail e senha para acessar o sistema.
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="E-mail"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seu@email.com"
              required
            />
            <Input
              label="Senha"
              type="password"
              autoComplete="current-password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              placeholder="••••••••"
              required
            />
            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
            >
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
