# Grande Atualização — Consistência de UI no Frontend

## Objetivo

Aplicar em **todo o projeto** o mesmo padrão visual consolidado na aba **Entregas**:

- Listagens em **cards** (em vez de tabelas largas onde fizer sentido)
- **Chips / badges com ícones SVG** (horário, cliente, telefone, endereço, valores, pagamento, etc.)
- **Forma de pagamento** com cores distintas (Dinheiro / PIX / Cartão)
- Layout **compacto** sem scroll horizontal (`min-w-0`, `overflow-x-hidden`, grids com `minmax(0, 1fr)`)
- Botões `whatsapp` / `import` onde houver essas ações

### Escopo das abas

1. Dashboard  
2. Motoboys  
3. Pendências  
4. Aprovações  
5. Monitoramento  
6. Prestação (+ Minha Prestação)  
7. Relatórios  
8. Planejador de rotas  

### Regras de execução

- Trabalhar **por partes (etapas)**.
- **Só avançar para a próxima etapa com autorização explícita** do usuário.
- Em cada etapa: alterar apenas a aba/alvo; **não quebrar** o que já funciona.
- Antes de editar: ler o código e a estrutura já em uso (regra `sync-before-change`).
- **Prioridade: semântica de chips/badges** — o tom/ícone deve refletir o *tipo* do dado (nome → `client`/`company`/`motoboy`; valor em R$ → `money`/`motoboyFee`; forma de pagamento → `payment`; pendência → `pending`). Nunca copiar um tom só pela cor.
- **Chips sem borda por padrão** — `MetaChip` e badges de exibição (ex.: forma de pagamento) usam fundo suave **sem outline**, para não parecer botão. **Borda/outline só em controles clicáveis** (`Button`, links, selects).
- Verificar **scroll horizontal**, espaçamento e sobreposição de elementos.
- Ao final de cada etapa: build + testes das áreas tocadas; validação visual pelo usuário.

### Semântica de `MetaChip` (fonte da verdade: `MetaChip.tsx`)

| Dado | Tom correto |
|------|-------------|
| Horário / data | `time` |
| Nome de cliente / pessoa | `client` |
| Nome / tipo empresa | `company` |
| Nome de motoboy | `motoboy` |
| Telefone | `phone` |
| Endereço | `address` |
| Contagem de entregas | `delivery` |
| Valor de produto | `product` |
| Valor em R$ (total, final, corrida genérica) | `money` |
| Taxa / a receber do motoboy | `motoboyFee` |
| Forma de pagamento (PIX/cartão/dinheiro) | `payment` |
| Pendência / repasse pendente | `pending` |
| Status importado | `imported` |

### Borda vs. botão

| Elemento | Borda |
|----------|-------|
| `MetaChip` (dado: nome, endereço, valor…) | **Não** — default `borderless` |
| `FormaPagamentoBadge` (rótulo PIX/cartão…) | **Não** — só cor de fundo |
| `MetaSectionTitle` (ícone de seção) | **Não** |
| `Button` / `select` / ações clicáveis | **Sim** |
| `Badge` de status (Aprovada, Pago…) | Mantém estilo atual (rótulo, não CTA) |

---

## Checkpoint de segurança (commit)

Antes de iniciar a Etapa 0, o estado atual foi salvo:

| Item | Valor |
|------|--------|
| **Commit** | `34e2e6e` |
| **Mensagem** | `feat: entregas com cards, pagamento no planejador e chips visuais` |
| **Branch** | `main` (ahead of `origin/main` por 1 commit no momento do checkpoint) |
| **Validação no pre-commit** | lint, build e testes (frontend + backend) passaram |

### Como reverter, se necessário

```bash
# Voltar exatamente para este estado (após Etapa 0+)
git reset --hard 34e2e6e

# Ou voltar para o commit anterior às mudanças de Entregas (se preferir)
git reset --hard 9788875
```

> **Atenção:** `git reset --hard` descarta commits locais posteriores. Use só se a atualização der errado e for preciso restaurar o checkpoint.

---

## Referência do padrão (já aplicado em Entregas)

| Padrão | Onde está / o que faz |
|--------|------------------------|
| Cards Cliente / Motoboy | `DeliveryClienteList.tsx`, `DeliveryMotoboyList.tsx` |
| Chips com ícones | `DeliveryCardChips.tsx` (`DeliveryCardHeader`, `DeliveryCardChip`, `DeliveryCardSectionTitle`) |
| Células valores / pagamento | `DeliveryTableCells.tsx` |
| Badge de forma de pagamento | `FormaPagamentoBadge.tsx` + `formaPagamentoStyles.ts` |
| Shell da página | `DeliveriesPage.tsx` — `min-w-0 overflow-x-hidden`, grid com `minmax(...)` |
| Planejador — pagamento + WhatsApp | `ListaEntregas.tsx`, `routeStopPayment.ts`, `usePlannerEntregas.ts` |
| Botões | `Button.tsx` — variants `whatsapp`, `import` |

---

## Plano por etapas

### Etapa 0 — Fundação compartilhada *(recomendada primeiro)*

**Escopo:** extrair padrões reutilizáveis **sem redesenhar outras abas**.

| Ação | Detalhe | Status |
|------|---------|--------|
| Extrair chips | `MetaChip` / `MetaSectionTitle` em `shared/components/ui/MetaChip.tsx` | ✅ |
| Shell de página | `PageShell`, `PagePanel`, `PageSplit` + tokens `PAGE_CARD_*` em `PageShell.tsx` | ✅ |
| Migrar Entregas | `DeliveriesPage` + listas usam shell/tokens; aliases em `DeliveryCardChips` | ✅ |
| Tokens | Documentados neste MD (seção abaixo) | ✅ |
| Auditoria scroll | Confirmada neste MD (mapa atualizado) | ✅ |

**Risco:** baixo · **Concluída em:** 2026-08-08

**Arquivos novos**

- `frontend/src/shared/components/ui/MetaChip.tsx`
- `frontend/src/shared/components/ui/PageShell.tsx`

**Como usar nas próximas etapas**

```tsx
import {
  PageShell,
  PagePanel,
  PageSplit,
  MetaChip,
  MetaSectionTitle,
  PAGE_CARD_ARTICLE,
  PAGE_CARD_SECTION,
} from '@/shared/components/ui'
```

Aliases de domínio (Entregas) continuam válidos:

- `DeliveryCardChip` → `MetaChip`
- `DeliveryCardSectionTitle` → `MetaSectionTitle`
- `DeliveryCardHeader` permanece específico de entregas

---

## Tokens de UI (Etapa 0)

| Token / componente | Uso |
|--------------------|-----|
| `PageShell` | Root da página: `min-w-0 max-w-full overflow-x-hidden` + `space-y-4\|6` |
| `PagePanel` | Painel de lista/filtros glass: `rounded-2xl border … p-3 sm:p-4` (compact) |
| `PageSplit variant="form"` | `xl:grid-cols-[minmax(260px,320px)_minmax(0,1fr)]` |
| `PageSplit variant="wide"` | `xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]` (Motoboys/Pendências) |
| `PAGE_CARD_ARTICLE` | Card de item: `rounded-xl border … p-3 sm:p-4` |
| `PAGE_CARD_SECTION` | Bloco interno (valores/pagamento): `rounded-lg border … p-3` |
| `MetaChip tone="…"` | Pill com ícone (time, client, …); **sem borda** por padrão (`borderless`) |
| `Button variant="whatsapp"` | CTA WhatsApp verde |
| `Button variant="import"` | CTA importar |
| `Button variant="edit"` | Editar — azul sky |
| `Button variant="pdf"` | PDF / Exportar PDF — rosa rose |
| `Button variant="copy"` | Copiar — teal |
| `MetaField` | Campo rotulado (Data, Tipo, Nome…) em cards de histórico |

### Padrão de histórico em cards (manter nas próximas etapas)

Quando a listagem tiver colunas semânticas (ex.: Data, Tipo, Nome, Entregas, Valor final, Status):

1. Usar **cards** (`PAGE_CARD_ARTICLE`), não tabela `min-w-*` larga.
2. Cada campo com **`MetaField label="…"`** + chip/badge **sem borda** (dado) ou `Button` (ação).
3. Ações em faixa inferior com variants: `edit` · `pdf` · `copy` · `whatsapp` · `danger`.

Referência: `PrestacaoUnifiedHistory.tsx`.

### Densidades

| Densidade | Espaçamento vertical | Padding de painel |
|-----------|----------------------|-------------------|
| `compact` | `space-y-4` / `space-y-3` | `p-3 sm:p-4` |
| `default` | `space-y-6` / `space-y-4` | `p-4 sm:p-5` |

---

## Auditoria de scroll (confirmada na Etapa 0)

| Página | Shell atual | Problema de scroll | Severidade | Etapa alvo |
|--------|-------------|--------------------|------------|------------|
| Entregas | `PageShell` + `PageSplit` | OK | — | 0 (referência) |
| Dashboard | `PageShell` + cards | OK (tabela removida) | — | 1 ✅ |
| Motoboys | `PageShell` + `PageSplit wide` | OK (cards, sem `min-w-170`) | — | 2 ✅ |
| Pendências | `PageShell` + `PageSplit wide` | OK (cards, sem `min-w-170`) | — | 2 ✅ |
| Aprovações | `PageShell` + cards | OK (chips semânticos) | — | 3 ✅ |
| Monitoramento | `PageShell` + cards | OK (chips nas paradas) | — | 4 ✅ |
| Prestação | `PageShell` + histórico em cards | OK (tabela removida) | — | 5 ✅ |
| Minha Prestação | `PageShell` + histórico em cards | OK | — | 5 ✅ |
| Relatórios | `space-y-6` só | `DailyBreakdownTable min-w-120` | Baixa | 6 |
| Planejador | `PageShell` + grid `minmax(0,…)` | OK (chips + anti-scroll) | — | 7 ✅ |

---

### Etapa 1 — Dashboard

| | |
|--|--|
| **Problema** | Tabela “Entregas do dia” larga (`min-w-160`) |
| **Mudança** | `PageShell` + cards com `MetaChip` (horário, cliente, endereço, valor, motoboy, pagamento) |
| **Scroll** | Alta prioridade — **corrigido** |
| **Complexidade** | M |
| **Status** | ✅ Concluída em 2026-08-08 |

**Arquivo principal:** `frontend/src/features/dashboard/pages/DashboardPage.tsx`

**O que mudou**

- Root com `PageShell` (`min-w-0 overflow-x-hidden`)
- Seção “Entregas do dia” em `PagePanel` com lista de cards (`PAGE_CARD_ARTICLE`)
- Removida tabela `overflow-x-auto` / `min-w-160`
- Chips: horário, cliente, endereço, valor da corrida; motoboy (admin visão geral); produto e forma de pagamento quando existirem
- Badge “Pago pelo cliente” mantido
- Grids de stats/charts com `min-w-0` para evitar overflow
- Link “Ver todas” para `/entregas`

**Não alterado:** hooks do dashboard, StatCards, lógica de filtro por motoboy, charts (só wrappers `min-w-0`)

---

### Etapa 2 — Motoboys + Pendências

| | |
|--|--|
| **Problema** | `DataTable` com scroll interno; vários botões por linha |
| **Mudança** | Cards com `MetaField` + chips semânticos; `PageShell`/`PageSplit`/`PagePanel` |
| **Scroll** | Médio — **corrigido** |
| **Complexidade** | M |
| **Status** | ✅ Concluída em 2026-08-08 |

**Arquivos**

- `MotoboyList.tsx` — cards: Nome · E-mail · Status · Criado em
- `PendingList.tsx` — cards: Descrição · Motoboy · Referente · Valor · Status
- `MotoboysPage.tsx` / `PendingPage.tsx` — `PageShell` + `PageSplit variant="wide"`

**Semântica:** motoboy → `motoboy`; data → `time`; valor → `money`; repasse → `pending`; chips **borderless** por padrão

**Não alterado:** forms, hooks, filtros, modais, lógica CRUD

---

### Etapa 3 — Aprovações

| | |
|--|--|
| **Problema** | Já usa cards; falta chips e `min-w-0` na raiz |
| **Mudança** | Chips (motoboy, data, valores); `PageShell`; botão “Ver texto” `copy` |
| **Scroll** | Baixo — **corrigido** |
| **Complexidade** | S–M |
| **Status** | ✅ Concluída em 2026-08-08 |

**Arquivos**

- `AprovacoesPage.tsx` — `PageShell`; pendentes em cards com `MetaField` + chips borderless
- `AprovacoesHistoricoSection.tsx` — histórico no mesmo padrão (Motoboy · Data · Entregas · Total · Status · Decisão em)

**Semântica:** motoboy → `motoboy`; data → `time`; entregas → `delivery`; valores → `money`/`pending`/`motoboyFee`

**Não alterado:** hooks, approve/reject, modais, filtro por motoboy

---

### Etapa 4 — Monitoramento

| | |
|--|--|
| **Problema** | Cards ok; paradas em texto puro |
| **Mudança** | Chips nas paradas (cliente, endereço, status); shell `min-w-0` |
| **Scroll** | Baixo–médio — **corrigido** |
| **Complexidade** | M |
| **Status** | ✅ Concluída em 2026-08-08 |

**Arquivos**

- `MonitoramentoPage.tsx` — `PageShell` + `min-w-0`
- `MonitoramentoRotaCard.tsx` — paradas e próxima entrega com `MetaChip` borderless; stats sem borda
- `MonitoramentoHistoricoSection.tsx` — paradas do histórico com chips
- `MonitoramentoResumoBar.tsx` — cards de resumo sem borda (dado, não botão)

**Semântica:** cliente → `client`; endereço → `address`; telefone → `phone`; horário/trajeto → `time`; motoboy → `motoboy`

**Não alterado:** polling, alertas, hooks, timeline markers, botões “Ver mais” (mantêm borda)

---

### Etapa 5 — Prestação (+ Minha Prestação)

| | |
|--|--|
| **Problema** | Histórico com tabela `min-w-245` + muitas ações |
| **Mudança** | Históricos em cards com `MetaChip`; `PageShell`/`PagePanel`; WhatsApp `variant="whatsapp"` |
| **Scroll** | Alta — **corrigido** |
| **Complexidade** | L |
| **Status** | ✅ Concluída em 2026-08-08 |

**Arquivos**

- `PrestacaoUnifiedHistory.tsx` — cards com campos rotulados: **Data · Tipo · Nome · Entregas · Valor final · Status**
- `PrestacaoHistory.tsx` — cards (legado empresa)
- `PrestacaoMotoboyHistory.tsx` — cards (Minha Prestação)
- `WhatsAppPreview.tsx` — botão WhatsApp verde
- `PrestacaoPage.tsx` / `MinhaPrestacaoPage.tsx` — `PageShell` + `PagePanel` no histórico

**Ajuste pós-feedback:** o histórico unificado exibe os mesmos campos da tabela antiga com labels explícitos (sem scroll horizontal).

**Não alterado:** lógica de gerar/editar/excluir/aprovar, hooks, serviços, modais de edição/envio

---

### Etapa 6 — Relatórios

| | |
|--|--|
| **Problema** | Tabela pequena; falta shell compacto |
| **Mudança** | `PageShell`; `min-w-0` nos grids; detalhamento diário em cards `MetaField`/`MetaChip` |
| **Scroll** | Baixo |
| **Complexidade** | S |
| **Status** | ✅ Concluída em 2026-08-08 |

**Arquivos**

- `ReportsPage.tsx` — `PageShell`; `min-w-0` nas seções de filtros, gráficos e detalhamento
- `DailyBreakdownTable.tsx` — cards `PAGE_CARD_ARTICLE` + `MetaField` (Data, Entregas, Valor final); sem tabela `min-w-120`
- `ChartCard.tsx` — `min-w-0 overflow-hidden`
- `ReportSummaryCards.tsx` — grid com `min-w-0`

**Semântica aplicada**

- Data → `time` · Entregas → `delivery` · Valor final → `money`

**Não alterado:** hooks, serviços, gráficos Recharts, export PDF, filtros de período/motoboy

---

### Etapa 7 — Planejador de rotas

| | |
|--|--|
| **Problema** | `ListaEntregas` sem chips no header; grid sem `minmax(0, 1fr)` |
| **Mudança** | Reusar header/chips de Entregas; botões import/WhatsApp; anti-scroll |
| **Scroll** | Médio — **corrigido** |
| **Complexidade** | M |
| **Status** | ✅ Concluída em 2026-08-08 |

**Arquivos**

- `PlannerPage.tsx` — `PageShell`; grid `xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]`; botão `import`; parada selecionada com chips
- `ListaEntregas.tsx` — chips semânticos (`client`, `address`, `phone`, `imported`, `product`, `money`, `payment`, `time`); bloco pagamento com `MetaSectionTitle`
- `HistoricoRotas.tsx` — cards `PAGE_CARD_ARTICLE` + `MetaField` (Data, Paradas, Trajeto, Partida); WhatsApp / Duplicar com variants

**Semântica aplicada**

- Nome → `client` · Endereço → `address` · Telefone → `phone`
- Do cadastro → `imported` · Produto → `product` · Corrida → `money`
- Forma de pagamento → `FormaPagamentoBadge` / seção `payment`
- Contagem de paradas → `delivery` · Data/trajeto → `time`

**Não alterado:** lógica de otimização, execução de status, hooks, WhatsApp message builders, mapa

---

## Ordem sugerida de execução

```
0 Fundação
→ 1 Dashboard
→ 5 Prestação
→ 7 Planejador
→ 2 Motoboys / Pendências
→ 3 Aprovações
→ 4 Monitoramento
→ 6 Relatórios
```

Justificativa: Dashboard e Prestação primeiro (scroll alto); Aprovações / Relatórios por último (menor risco).

A ordem pode ser alterada mediante autorização do usuário.

---

## Checklist por etapa (obrigatório)

1. Ler código e estrutura da área afetada (não assumir nomes/padrões).  
2. Aplicar mudanças **somente** no escopo autorizado.  
3. Verificar scroll horizontal, espaçamento e sobreposição.  
4. Rodar build (+ testes das áreas tocadas quando existirem).  
5. Aguardar **autorização explícita** antes da próxima etapa.  

---

## Autorizações

| Etapa | Status | Autorizado em | Observação |
|-------|--------|---------------|------------|
| Checkpoint commit `34e2e6e` | ✅ Feito | 2026-08-08 | Estado salvo antes da Etapa 0 |
| Este documento MD | ✅ Feito | 2026-08-08 | Plano persistido |
| Etapa 0 | ✅ Concluída | 2026-08-08 | Fundação shared + Entregas migrada |
| Etapa 1 | ✅ Concluída | 2026-08-08 | Dashboard cards + anti-scroll; aguarda validação visual |
| Etapa 2 | ✅ Concluída | 2026-08-08 | Motoboys + Pendências em cards; PageShell |
| Etapa 3 | ✅ Concluída | 2026-08-08 | Aprovações: PageShell + chips borderless |
| Etapa 4 | ✅ Concluída | 2026-08-08 | Monitoramento: chips nas paradas + PageShell |
| Etapa 5 | ✅ Concluída | 2026-08-08 | Históricos em cards; WhatsApp variant; aguarda validação visual |
| Etapa 6 | ✅ Concluída | 2026-08-08 | PageShell + cards no detalhamento diário |
| Etapa 7 | ✅ Concluída | 2026-08-08 | Planejador: PageShell, chips semânticos, histórico em cards |

---

## Como autorizar

Exemplos de mensagem:

- `Autorizo Etapa 0`
- `Autorizo Etapa 1`
- `Autorizo 0 e 1`
- Ou outra ordem explícita

---

## Histórico

| Data | Evento |
|------|--------|
| 2026-08-08 | Commit checkpoint `34e2e6e` (Entregas + planejador + chips) |
| 2026-08-08 | Plano salvo neste arquivo; Etapa 0 ainda não iniciada |
| 2026-08-08 | Etapa 0 autorizada e concluída: `MetaChip`, `PageShell`/`PagePanel`/`PageSplit`, tokens, auditoria; Entregas migrada como referência |
| 2026-08-08 | Etapa 1 autorizada (“prossiga”) e concluída: Dashboard sem tabela larga; cards com chips |
| 2026-08-08 | Etapa 5 autorizada (“prossiga”) e concluída: Prestação/Minha Prestação sem `min-w-245` |
| 2026-08-08 | Semântica de MetaChip reforçada (`company`/`money`/`pending`); regra no MD |
| 2026-08-08 | Etapa 7 autorizada (“prossiga”) e concluída: Planejador com PageShell, chips e histórico em cards |
| 2026-08-08 | Regra borderless: MetaChip/FormaPagamento sem borda; borda só em botões/controles |
| 2026-08-08 | Etapa 2 autorizada (“prossiga”) e concluída: Motoboys + Pendências em cards |
| 2026-08-08 | Etapa 3 autorizada (“prossiga”) e concluída: Aprovações com PageShell e chips |
| 2026-08-08 | Etapa 4 autorizada (“prossiga”) e concluída: Monitoramento com chips nas paradas |
