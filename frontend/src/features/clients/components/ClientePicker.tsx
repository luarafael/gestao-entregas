import { useState } from 'react'
import { Button, Input, Pagination } from '@/shared/components/ui'
import { useDebounce } from '@/shared/hooks'
import { useClientes } from '../hooks/useClientes'
import type { Cliente } from '../services/cliente.service'

export function ClientePicker({
  onSelect,
  enabled = true,
}: {
  onSelect: (cliente: Cliente) => void
  enabled?: boolean
}) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search)
  const query = useClientes(debouncedSearch, page, enabled)
  return (
    <section
      className="space-y-3 rounded-xl border border-border/60 bg-surface/20 p-3"
      aria-label="Selecionar cliente cadastrado"
    >
      <Input
        label="Buscar cliente cadastrado"
        placeholder="Nome, telefone ou endereço"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value)
          setPage(1)
        }}
        maxLength={200}
      />
      {query.isLoading ? (
        <p role="status" className="text-sm">
          Carregando clientes…
        </p>
      ) : query.isError ? (
        <div role="alert" className="text-sm">
          Não foi possível carregar os clientes.{' '}
          <Button type="button" variant="ghost" onClick={() => query.refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : query.data?.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum cliente encontrado. Cadastre na aba Clientes ou preencha os
          dados abaixo.
        </p>
      ) : (
        <ul className="max-h-48 space-y-2 overflow-y-auto">
          {query.data?.data.map((cliente) => (
            <li key={cliente.id}>
              <button
                type="button"
                onClick={() => onSelect(cliente)}
                className="w-full rounded-lg border border-border/50 p-2 text-left hover:bg-surface/70 focus-visible:outline-2"
              >
                <span className="block font-medium">{cliente.nome}</span>
                <span className="block text-xs text-muted-foreground">
                  {[cliente.endereco, cliente.bairro, cliente.cidade]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
                {cliente.telefone && (
                  <span className="block text-xs text-muted-foreground">
                    {cliente.telefone}
                  </span>
                )}
              </button>
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
    </section>
  )
}
