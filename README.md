# Sistema de Gestão de Entregas e Prestação de Contas

Aplicação web profissional para controle de entregas diárias e prestação de contas, com geração automática de relatório para WhatsApp.

## Stack

| Camada | Tecnologias |
|--------|-------------|
| Frontend | React 19, Vite, TypeScript, TailwindCSS, React Router, React Hook Form, Zod, TanStack Query, Zustand, Framer Motion |
| Backend | Node.js, Express, TypeScript, Prisma ORM |
| Banco | PostgreSQL |
| Testes | Vitest, React Testing Library |
| DevOps | Docker, Docker Compose, ESLint, Prettier, Husky |

## Arquitetura

Monorepo com arquitetura **Feature Based**:

```
sistema-rotas/
├── frontend/                 # Aplicação React
│   └── src/
│       ├── app/              # Configuração da aplicação (providers, router)
│       ├── features/         # Módulos por domínio
│       │   ├── deliveries/   # Entregas
│       │   ├── pending/      # Pendências
│       │   └── accounting/   # Prestação de contas
│       ├── shared/           # Componentes, hooks, utils reutilizáveis
│       ├── layouts/          # Layouts da aplicação
│       └── routes/           # Definição de rotas
├── backend/                  # API REST
│   ├── prisma/               # Schema e migrations
│   └── src/
│       ├── repositories/     # Repository Pattern
│       ├── services/         # Regras de negócio
│       ├── routes/           # Endpoints da API
│       └── middleware/       # Middlewares Express
└── docker-compose.yml
```

## Pré-requisitos

- Node.js >= 20
- npm >= 10
- Docker e Docker Compose (opcional, para PostgreSQL)

## Instalação

```bash
# Clonar o repositório
git clone <url-do-repositorio>
cd sistema-rotas

# Instalar dependências (monorepo)
npm install

# Configurar variáveis de ambiente
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

## Variáveis de Ambiente

### Backend (`backend/.env`)

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `DATABASE_URL` | URL de conexão PostgreSQL | `postgresql://postgres:postgres@localhost:5432/sistema_rotas` |
| `PORT` | Porta da API | `3001` |
| `NODE_ENV` | Ambiente | `development` |
| `FRONTEND_URL` | URL do frontend (CORS) | `http://localhost:5173` |

### Frontend (`frontend/.env`)

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `VITE_API_URL` | URL da API | `http://localhost:3001` |

## Execução

### Desenvolvimento local

```bash
# Subir PostgreSQL via Docker
npm run docker:up

# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Health check: http://localhost:3001/api/health

### Docker (stack completa)

```bash
docker compose up --build
```

## Testes

```bash
# Executar todos os testes
npm test

# Com cobertura
npm run test:coverage

# Apenas frontend
npm run test --workspace=frontend

# Apenas backend
npm run test --workspace=backend
```

## Lint e Formatação

```bash
npm run lint
npm run format
```

Git hooks (Husky) executam lint-staged automaticamente no pre-commit.

## Banco de Dados (Prisma)

```bash
# Gerar Prisma Client
npm run db:generate

# Executar migrations (Etapa 2)
npm run db:migrate

# Abrir Prisma Studio
npm run db:studio
```

## Deploy

Documentação completa: **[DEPLOY.md](./DEPLOY.md)**

| Serviço | Plataforma |
|---------|------------|
| Frontend | Vercel ou nginx (Docker prod) |
| Backend/API | Railway ou Docker prod |
| Banco de Dados | Neon PostgreSQL ou PostgreSQL (Docker prod) |

### Docker produção (VPS)

```bash
cp .env.production.example .env.production
# Edite senhas e FRONTEND_URL
npm run docker:prod
```

Acesse `http://SEU_IP` — nginx serve o frontend e faz proxy de `/api` para o backend.

### Vercel + Railway + Neon

Veja passo a passo em [DEPLOY.md](./DEPLOY.md#opção-b--vercel--railway--neon).

### Produção (ativo)

| Ambiente | URL |
|----------|-----|
| Frontend | https://gestao-entregas-frontend.vercel.app |
| API | https://backend-production-795e.up.railway.app |
| Banco | Neon PostgreSQL (sa-east-1) |

Health check: `GET /api/health` na URL da API.

Para voltar a este ponto no git: `git checkout pre-etapa-9`

## API Endpoints

### Entregas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/entregas/stats` | Estatísticas do dashboard |
| GET | `/api/entregas` | Listar entregas (paginação, filtros, busca) |
| GET | `/api/entregas/:id` | Buscar entrega por ID |
| POST | `/api/entregas` | Criar entrega |
| PUT | `/api/entregas/:id` | Atualizar entrega |
| DELETE | `/api/entregas/:id` | Excluir entrega |

### Pendências

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/pendencias` | Listar pendências |
| GET | `/api/pendencias/:id` | Buscar pendência por ID |
| POST | `/api/pendencias` | Criar pendência |
| PUT | `/api/pendencias/:id` | Atualizar pendência |
| DELETE | `/api/pendencias/:id` | Excluir pendência |

### Prestação de Contas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/prestacoes` | Listar prestações |
| GET | `/api/prestacoes/:id` | Buscar prestação por ID |
| GET | `/api/prestacoes/:id/whatsapp` | Texto formatado para WhatsApp |
| POST | `/api/prestacoes/generate` | Gerar prestação do dia |

## Etapas de Desenvolvimento

- [x] **Etapa 1** — Estrutura inicial, dependências e configurações
- [x] **Etapa 2** — Banco de dados, models, migrations, repositories, services, API
- [x] **Etapa 3** — Layout, sidebar, navbar, dashboard, dark mode
- [x] **Etapa 4** — CRUD de Entregas
- [x] **Etapa 5** — CRUD de Pendências
- [x] **Etapa 6** — Prestação de Contas e WhatsApp
- [x] **Etapa 7** — Gráficos e relatórios
- [x] **Etapa 8** — Testes automatizados (90% cobertura)
- [x] **Deploy produção** — Vercel + Railway + Neon
- [ ] **Etapa 9** — Refatoração, performance e clean code

## Licença

ISC
