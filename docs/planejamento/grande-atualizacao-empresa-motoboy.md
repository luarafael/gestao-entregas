# Grande Atualização — Estrutura Empresa x Motoboy (Administrador x Funcionário)

## Objetivo Geral

Realizar uma grande atualização no sistema **sem alterar a lógica existente**, utilizando toda a estrutura atual como base.

A atualização transformará o sistema para um modelo de **Empresa → Funcionários (Motoboys)**.

O usuário **Administrador** passa a representar a empresa/patrão.

Os usuários **Motoboy** passam a representar os funcionários da empresa.

Toda nova funcionalidade deverá respeitar o funcionamento atual do projeto, apenas adicionando suporte para múltiplos motoboys.

> **IMPORTANTE**
>
> - Não remover funcionalidades existentes.
> - Não alterar regras atuais.
> - Não modificar layouts sem necessidade.
> - Toda implementação deve ser incremental.
> - Toda alteração deve reaproveitar ao máximo o código existente.
> - A arquitetura atual deve permanecer intacta.

---

## Diretrizes Gerais

A atualização deverá ser dividida em fases. Cada fase deve ser totalmente funcional antes da próxima.

Todas as próximas implementações dependerão da **Fase 1**.

---

## FASE 1 — Gestão de Usuários Motoboy

### Objetivo

Permitir que o Administrador (empresa) possa criar funcionários (motoboys).

### O Administrador deverá poder

- Criar usuários Motoboy
- Editar usuários Motoboy
- Desativar usuários Motoboy
- Reativar usuários Motoboy

### Campos

Cada motoboy deverá possuir:

- Nome
- E-mail
- Senha

(opcional futuramente: Telefone, Foto, Status)

### Regras

O administrador poderá criar **quantos motoboys desejar**. Limitação por plano será implementada futuramente. Para esta atualização: criação ilimitada para testes.

### Persistência

Salvar normalmente no banco. Sincronizar com Railway quando possível.

### Estrutura

Nova área **Funcionários** ou **Motoboys**: listar, pesquisar, editar, excluir/desativar.

---

## FASE 2 — Dashboard

Manter o Dashboard atual. Adicionar seletor **Todos / Motoboy A / Motoboy B** para visão geral ou individual.

Atualizar: entregas, valor recebido, pendências, prestação, aprovações, indicadores, gráficos e cards conforme o filtro.

---

## FASE 3 — Entregas

Toda entrega pertence a um Motoboy. Adicionar campo **Motoboy** obrigatório no cadastro. Histórico com filtro Todos ou motoboy específico.

---

## FASE 4 — Pendências

Toda pendência pertence a um Motoboy. Admin delega ao cadastrar. Histórico com filtro geral ou por motoboy.

---

## FASE 5 — Aprovações

Separar por funcionário. Seletor Todos ou motoboy específico.

---

## FASE 6 — Monitoramento

**Somente visão individual por motoboy** — sem visão geral consolidada.

---

## FASE 7 — Prestação de Contas

Gerar prestação por motoboy selecionado. Histórico com Todos ou motoboy específico. Aplicar em todas as abas.

---

## FASE 8 — Relatórios

Manter relatório geral. Adicionar relatório por motoboy em todas as abas.

---

## Regras Técnicas

- Implementação **aditiva** — nada existente deixa de funcionar.
- Reutilizar componentes, hooks, services e stores existentes.
- Relacionar registros via `motoboy_id`.
- Padrão de filtro: **Todos / Motoboy A / Motoboy B** (exceto monitoramento: só individual).

---

## Fluxo da Aplicação

```text
Administrador (Empresa)
            │
            ▼
Cria Motoboys
            │
            ▼
Cada Motoboy possui:
    • Entregas
    • Pendências
    • Aprovações
    • Prestação de Contas
    • Relatórios
    • Monitoramento
            │
            ▼
Administrador pode visualizar:
    • Tudo (visão geral)
    • Apenas um Motoboy (visão individual)

Exceção:
Monitoramento → apenas visão individual.
```

---

## Objetivo Final

Transformar o sistema em plataforma multi-motoboy, preservando toda a lógica existente e garantindo escalabilidade para limitações de plano futuras.
