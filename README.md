# Gestão de Entregas

Aplicação web para controle de entregas do dia a dia, pendências financeiras e fechamento da prestação de contas — com relatório pronto para enviar no WhatsApp.

**Demo:** [gestao-entregas-frontend.vercel.app](https://gestao-entregas-frontend.vercel.app)

---

## O que o sistema faz

O fluxo é simples: o entregador registra as entregas ao longo do dia, anota pendências quando o cliente não paga na hora e, no fim do expediente, gera a prestação com totais, descontos e texto formatado para repassar ao responsável.

Na prática, substitui planilha + anotações soltas por um painel único com histórico, filtros e gráficos.

### Funcionalidades

- **Dashboard** — resumo do dia, entregas recentes e visão da semana
- **Entregas** — CRUD com busca, filtros por data/bairro e paginação
- **Pendências** — controle de valores em aberto vinculados às entregas
- **Prestação de contas** — geração diária, histórico, cópia e envio via WhatsApp
- **Relatórios** — gráficos por período, bairro e evolução de valores
- **Planejador de Rotas** — importa entregas cadastradas, otimiza a sequência (Google Routes API ou fallback local), mapa Leaflet, histórico e navegação no Google Maps
- **Tema claro/escuro** — interface responsiva para desktop e mobile

---

## Stack

| Camada | Tecnologias |
|--------|-------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, Zustand, React Hook Form, Zod, Recharts, Leaflet |
| Backend | Node.js, Express, TypeScript, Prisma |
| Banco | PostgreSQL |
| Testes | Vitest, React Testing Library |
| Infra | Docker, Vercel, Railway, Neon |

---

## Decisões técnicas

- **Monorepo** com workspaces npm — frontend e backend no mesmo repositório, deploy independente
- **Arquitetura por features** no frontend (`deliveries`, `pending`, `accounting`, `reports`) e camadas no backend (routes → services → repositories)
- **Validação compartilhada** com Zod nos formulários e schemas da API
- **Fuso horário de negócio** (`America/Sao_Paulo`) para entregas e dashboard baterem com o dia real, mesmo com o servidor em UTC
- **Code splitting** com lazy loading das páginas e chunks separados para Recharts e libs pesadas
- **173 testes automatizados** cobrindo services, hooks, componentes e utilitários

---

## Estrutura do projeto

```
gestao-entregas/
├── frontend/          # SPA React
│   └── src/
│       ├── app/       # providers, router
│       ├── features/  # módulos de negócio
│       ├── shared/    # UI, hooks, services
│       └── layouts/
├── backend/           # API REST
│   ├── prisma/        # schema e migrations
│   └── src/
│       ├── routes/
│       ├── services/
│       └── repositories/
├── docker-compose.yml
└── Dockerfile         # build do backend (Railway)
```

---

## Rodando localmente

**Requisitos:** Node.js 20+, npm 10+, Docker (opcional, para o PostgreSQL)

```bash
git clone https://github.com/luarafael/gestao-entregas.git
cd gestao-entregas

npm install

cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Suba o banco e as migrations:

```bash
npm run docker:up
npm run db:migrate
```

Em dois terminais (ou use `npm run dev` na raiz):

```bash
npm run dev:backend   # http://localhost:3001
npm run dev:frontend  # http://localhost:5173
```

Health check da API: `GET http://localhost:3001/api/health`

### Variáveis de ambiente

**Backend** (`backend/.env`)

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Conexão PostgreSQL |
| `PORT` | Porta da API (padrão `3001`) |
| `FRONTEND_URL` | Origem permitida no CORS |
| `NODE_ENV` | `development` ou `production` |
| `GOOGLE_MAPS_API_KEY` | Opcional — Routes/Geocoding API para otimização real |

**Frontend** (`frontend/.env`)

| Variável | Descrição |
|----------|-----------|
| `VITE_API_URL` | URL da API (ex: `http://localhost:3001`) |

---

## Testes e qualidade

```bash
npm test              # frontend + backend
npm run test:coverage # com relatório de cobertura
npm run lint          # ESLint no frontend
npm run build         # build de produção
```

Hooks de pre-commit (Husky) rodam lint e testes antes de cada commit.

---

## Deploy

O projeto está em produção com:

| Serviço | Plataforma |
|---------|------------|
| Frontend | [Vercel](https://vercel.com) |
| API | [Railway](https://railway.app) |
| Banco | [Neon](https://neon.tech) (PostgreSQL, sa-east-1) |

Para subir em VPS com Docker (stack completa com nginx):

```bash
cp .env.production.example .env.production
# ajuste senhas e FRONTEND_URL
npm run docker:prod
```

No Railway, o `Dockerfile` na raiz do repo faz o build do backend. Na Vercel, configure `Root Directory` como `frontend` e `VITE_API_URL` apontando para a API.

### Checklist de produção (Railway + Vercel)

Antes do primeiro deploy com autenticação, configure no **Railway** (serviço da API):

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `JWT_SECRET` | Sim | Segredo forte com **mínimo 32 caracteres** (a API não sobe em produção com valor padrão) |
| `ADMIN_EMAIL` | Sim | E-mail do administrador inicial |
| `ADMIN_PASSWORD` | Sim | Senha forte do admin (evite `admin123` em produção) |
| `ADMIN_NAME` | Não | Nome exibido do admin |
| `FRONTEND_URL` | Sim | URL do frontend na Vercel (CORS) |
| `DATABASE_URL` | Sim | Conexão PostgreSQL (Neon) |

Gerar `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

No deploy, o container executa automaticamente:

1. `prisma migrate deploy` — aplica migrations
2. `ensure-admin` — cria/atualiza o usuário admin
3. Inicia a API

Após o deploy, acesse o frontend e faça login com `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

**Runbook completo para novo cliente:** [docs/operacao/deploy-cliente.md](docs/operacao/deploy-cliente.md)  
**Backup e recuperação:** [docs/operacao/backup.md](docs/operacao/backup.md)  
**Onboarding (vídeo + guia):** [docs/operacao/onboarding.md](docs/operacao/onboarding.md)  
**Template de variáveis:** [.env.cliente.example](.env.cliente.example)

---

## API (resumo)

| Recurso | Endpoints principais |
|---------|---------------------|
| Entregas | `GET/POST /api/entregas`, `GET /api/entregas/stats` |
| Pendências | `GET/POST /api/pendencias` |
| Prestações | `POST /api/prestacoes/generate`, `GET /api/prestacoes/:id/whatsapp` |
| Relatórios | `GET /api/reports/summary`, `GET /api/reports/daily` |
| Rotas | `POST /api/rotas/optimize`, `GET/POST /api/rotas`, `POST /api/rotas/sync-entrega` |

---

## Autor

**Luã Rafael** — [github.com/luarafael](https://github.com/luarafael)

Projeto desenvolvido como portfólio full stack: do modelagem do banco ao deploy em produção.
