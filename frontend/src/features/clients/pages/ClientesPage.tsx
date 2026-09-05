import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Input,
  Textarea,
  PageShell,
  PageSplit,
  PagePanel,
  Pagination,
  Modal,
} from '@/shared/components/ui'
import { useDebounce } from '@/shared/hooks'
import { toast } from '@/shared/stores/toast.store'
import { clienteSchema, type ClienteInput } from '../schemas/cliente.schema'
import { clienteService, type Cliente } from '../services/cliente.service'
import { useClientes } from '../hooks/useClientes'

const empty: ClienteInput = {
  nome: '',
  telefone: '',
  endereco: '',
  bairro: '',
  cidade: '',
  observacao: '',
  valorEntregaMotoboy: null,
}

export function ClientesPage() {
  const [editing, setEditing] = useState<Cliente | null>(null)
  const [deleting, setDeleting] = useState<Cliente | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const query = useClientes(useDebounce(search), page)
  const queryClient = useQueryClient()
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<ClienteInput>({
    resolver: zodResolver(clienteSchema),
    defaultValues: empty,
  })
  const save = useMutation({
    mutationFn: (data: ClienteInput) => clienteService.save(data, editing?.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['clientes'] })
      toast(editing ? 'Cliente atualizado' : 'Cliente cadastrado', 'success')
      setEditing(null)
      reset(empty)
    },
  })
  function edit(cliente: Cliente) {
    setEditing(cliente)
    reset(cliente)
    save.reset()
  }
  const remove = useMutation({
    mutationFn: (id: string) => clienteService.delete(id),
    onSuccess: async (_data, id) => {
      if (editing?.id === id) {
        setEditing(null)
        reset(empty)
        save.reset()
      }
      setDeleting(null)
      if (query.data?.data.length === 1 && page > 1) setPage(page - 1)
      await queryClient.invalidateQueries({ queryKey: ['clientes'] })
      toast('Cliente excluído', 'success')
    },
  })
  return (
    <PageShell>
      <p className="text-sm text-muted-foreground">
        Destinatários compartilhados entre a empresa e os motoboys. Selecione um
        cliente ao adicionar uma entrega no planejador.
      </p>
      <PageSplit variant="wide">
        <PagePanel>
          <h2 className="font-semibold">
            {editing ? 'Editar cliente' : 'Cadastrar cliente'}
          </h2>
          <form
            className="space-y-3"
            onSubmit={handleSubmit((data) => save.mutate(data))}
          >
            <Input
              label="Nome do cliente"
              {...register('nome')}
              error={errors.nome?.message}
              maxLength={200}
            />
            <Input
              label="Telefone do cliente"
              type="tel"
              {...register('telefone')}
              error={errors.telefone?.message}
              maxLength={40}
            />
            <Input
              label="Endereço"
              placeholder="Rua, número e complemento"
              {...register('endereco')}
              error={errors.endereco?.message}
              maxLength={500}
            />
            <Input
              label="Bairro"
              {...register('bairro')}
              error={errors.bairro?.message}
              maxLength={150}
            />
            <Input
              label="Cidade"
              {...register('cidade')}
              error={errors.cidade?.message}
              maxLength={150}
            />
            <Textarea
              label="Observação"
              placeholder="Referência ou instruções para encontrar o destinatário"
              {...register('observacao')}
              error={errors.observacao?.message}
              maxLength={2000}
            />
            <h3 className="pt-2 font-medium">
              Valor padrão para este endereço
            </h3>
            <Input
              label="Valor entrega motoboy"
              type="number"
              step="0.01"
              min="0.01"
              error={errors.valorEntregaMotoboy?.message}
              {...register('valorEntregaMotoboy', {
                setValueAs: (v) => (v === '' ? null : Number(v)),
              })}
            />
            <p className="text-xs text-muted-foreground">
              Preenche o valor da parada no planejador, usado na prestação do
              motoboy.
            </p>
            <p className="text-xs text-muted-foreground">
              Valor do produto, taxa, forma de pagamento e status são definidos
              em cada nova entrega.
            </p>
            {save.isError && (
              <p role="alert" className="text-sm text-red-500">
                {save.error.message}
              </p>
            )}
            <div className="flex gap-2">
              <Button type="submit" isLoading={save.isPending}>
                {editing ? 'Salvar alterações' : 'Cadastrar cliente'}
              </Button>
              {editing && (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={save.isPending}
                  onClick={() => {
                    setEditing(null)
                    reset(empty)
                    save.reset()
                  }}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </PagePanel>
        <PagePanel>
          <h2 className="font-semibold">
            Clientes cadastrados
            {query.data ? ` (${query.data.meta.total})` : ''}
          </h2>
          <Input
            label="Buscar clientes"
            placeholder="Nome, telefone ou endereço"
            value={search}
            maxLength={200}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
          />
          {query.isLoading ? (
            <p role="status">Carregando clientes…</p>
          ) : query.isError ? (
            <div role="alert">
              Não foi possível carregar os clientes.{' '}
              <Button variant="ghost" onClick={() => query.refetch()}>
                Tentar novamente
              </Button>
            </div>
          ) : query.data?.data.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">
              {search
                ? 'Nenhum cliente encontrado para esta busca.'
                : 'Cadastre o primeiro destinatário para reutilizar seus dados nas rotas.'}
            </p>
          ) : (
            <ul className="space-y-3">
              {query.data?.data.map((cliente) => (
                <li
                  key={cliente.id}
                  className="space-y-2 rounded-xl border border-border/60 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="break-words font-medium">{cliente.nome}</h3>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={save.isPending}
                        onClick={() => edit(cliente)}
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        disabled={save.isPending || remove.isPending}
                        onClick={() => {
                          remove.reset()
                          setDeleting(cliente)
                        }}
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                  <p className="break-words text-sm text-muted-foreground">
                    {[cliente.endereco, cliente.bairro, cliente.cidade]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  {cliente.telefone && (
                    <p className="text-sm">{cliente.telefone}</p>
                  )}
                  {cliente.observacao && (
                    <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
                      {cliente.observacao}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
          {query.data && (
            <Pagination
              page={page}
              totalPages={query.data.meta.totalPages}
              onPageChange={setPage}
            />
          )}
        </PagePanel>
      </PageSplit>
      <Modal
        open={Boolean(deleting)}
        title="Excluir cliente"
        description={`Excluir ${deleting?.nome ?? 'este cliente'} da base compartilhada? As entregas e rotas existentes serão preservadas.`}
        variant="danger"
        confirmLabel="Excluir cliente"
        isLoading={remove.isPending}
        onClose={() => {
          if (!remove.isPending) setDeleting(null)
        }}
        onConfirm={() => {
          if (deleting && !remove.isPending) remove.mutate(deleting.id)
        }}
      >
        {remove.isError && (
          <p role="alert" className="text-sm text-red-500">
            {remove.error.message}
          </p>
        )}
      </Modal>
    </PageShell>
  )
}
