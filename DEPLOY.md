# Deploy em produção

Guia para publicar o **Sistema de Rotas** antes da etapa 9.

## Opções de deploy

| Opção | Melhor para | Custo |
|-------|-------------|-------|
| **A — Docker (VPS)** | Controle total, um servidor | VPS ~R$ 20–50/mês |
| **B — Vercel + Railway + Neon** | Deploy gerenciado, escala automática | Free tier / pay-as-you-go |

---

## Opção A — Docker em VPS (recomendado para começar)

Stack completa: PostgreSQL + API + frontend (nginx).

### 1. Preparar servidor

- Ubuntu 22+ ou similar
- Docker e Docker Compose instalados
- Porta **80** (e **443** se usar HTTPS depois) liberada

### 2. Clonar e configurar

```bash
git clone <url-do-repositorio>
cd sistema-rotas

cp .env.production.example .env.production
# Edite .env.production:
# - POSTGRES_PASSWORD (senha forte)
# - FRONTEND_URL (ex: http://SEU_IP ou https://seudominio.com)
```

### 3. Subir produção

```bash
npm run docker:prod
```

- App: `http://SEU_IP` (porta 80)
- API (interna): proxy em `/api` via nginx
- Migrations rodam automaticamente ao iniciar o backend

### 4. Comandos úteis

```bash
# Ver logs
docker compose -f docker-compose.prod.yml logs -f

# Parar
npm run docker:prod:down

# Rebuild após atualização
git pull
npm run docker:prod
```

### 5. HTTPS (opcional)

Coloque **Caddy** ou **Nginx** na frente do container na porta 80, ou use **Cloudflare Tunnel** / **Traefik** com Let's Encrypt.

---

## Opção B — Vercel + Railway + Neon

### 1. Banco — [Neon](https://neon.tech)

1. Crie um projeto PostgreSQL
2. Copie a connection string (`DATABASE_URL`)

### 2. Backend — [Railway](https://railway.app)

1. New Project → Deploy from GitHub
2. **Root Directory:** `backend`
3. Variáveis de ambiente:

| Variável | Valor |
|----------|--------|
| `DATABASE_URL` | Connection string do Neon |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | URL do frontend na Vercel |
| `PORT` | `3001` (Railway injeta `PORT` — use `$PORT` se necessário) |

4. O `railway.toml` já define:
   - `npx prisma migrate deploy` antes do start
   - Health check em `/api/health`

5. Anote a URL pública da API (ex: `https://xxx.up.railway.app`)

### 3. Frontend — [Vercel](https://vercel.com)

1. Import Git Repository
2. **Root Directory:** `frontend`
3. Framework: Vite (detectado automaticamente)
4. Variável de ambiente:

| Variável | Valor |
|----------|--------|
| `VITE_API_URL` | URL da API no Railway (sem barra no final) |

5. Deploy → anote a URL (ex: `https://xxx.vercel.app`)

### 4. Ajustar CORS

No Railway, atualize `FRONTEND_URL` com a URL final da Vercel.

### 5. Seed (opcional, só dev/staging)

```bash
cd backend
DATABASE_URL="..." npm run db:seed
```

**Não rode seed em produção** se já houver dados reais.

---

## Checklist antes de ir ao ar

- [ ] `npm run build` passa localmente
- [ ] `npm test` passa
- [ ] `POSTGRES_PASSWORD` / `DATABASE_URL` fortes e únicos
- [ ] `FRONTEND_URL` aponta para o domínio real do frontend
- [ ] `VITE_API_URL` aponta para a API em produção (Opção B)
- [ ] Migrations aplicadas (`db:migrate:deploy`)
- [ ] Health check: `GET /api/health` retorna `{ "status": "ok" }`

---

## Variáveis de ambiente

### Backend

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | Sim | PostgreSQL |
| `PORT` | Não | Padrão `3001` |
| `NODE_ENV` | Sim | `production` |
| `FRONTEND_URL` | Sim | URL do frontend (CORS) |

### Frontend

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `VITE_API_URL` | Opção B: sim | URL da API. Opção A Docker: vazio (proxy `/api`) |

---

## Atualizações futuras

```bash
git pull origin master
npm run docker:prod          # Docker
# ou redeploy automático via Vercel/Railway
```

Depois do deploy validado, siga para a **Etapa 9** (refatoração e performance).
