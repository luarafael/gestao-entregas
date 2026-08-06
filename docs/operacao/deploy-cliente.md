# Runbook — Deploy para novo cliente (Fase 1)

Implantação **single-tenant**: cada cliente recebe instâncias próprias de **Neon + Railway + Vercel**.

**Tempo estimado:** 2–4 horas (após prática com este runbook).

**Template de variáveis:** ver [`.env.cliente.example`](../../.env.cliente.example) na raiz do repositório.

---

## Pré-requisitos

- [ ] Proposta aprovada e contrato assinado
- [ ] Acesso ao GitHub do projeto (`luarafael/gestao-entregas`)
- [ ] Contas: [Neon](https://neon.tech), [Railway](https://railway.app), [Vercel](https://vercel.com)
- [ ] Logo do cliente (PNG, fundo transparente recomendado)
- [ ] Domínio ou subdomínio do cliente (opcional na Vercel: `*.vercel.app`)

---

## Passo 1 — Banco de dados (Neon)

1. Criar projeto PostgreSQL na região **sa-east-1** (São Paulo).
2. Copiar a **connection string** (`DATABASE_URL`).
3. Não rodar seed de dados de exemplo em produção — apenas migrations + admin.

---

## Passo 2 — API (Railway)

1. Novo projeto → **Deploy from GitHub** → repositório `gestao-entregas`.
2. O `Dockerfile` na raiz faz build do backend automaticamente.
3. Configurar variáveis (Settings → Variables):

| Variável | Valor |
|----------|--------|
| `DATABASE_URL` | Connection string do Neon |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | URL final do frontend (Vercel) |
| `JWT_SECRET` | Segredo forte (mín. 32 caracteres) |
| `ADMIN_EMAIL` | E-mail do administrador do cliente |
| `ADMIN_PASSWORD` | Senha temporária forte |
| `ADMIN_NAME` | Nome exibido do admin |
| `MOTOBOY_EMAIL` | E-mail do motoboy de teste/homologação (opcional) |
| `MOTOBOY_PASSWORD` | Senha do motoboy (opcional) |
| `MOTOBOY_NAME` | Nome exibido do motoboy (opcional) |
| `GOOGLE_MAPS_API_KEY` | Opcional |

Gerar `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

4. Aguardar deploy. O container executa automaticamente:
   - `prisma migrate deploy`
   - `ensure-admin` (cria/atualiza o admin)
   - `ensure-motoboy` (cria/atualiza o motoboy, se `MOTOBOY_EMAIL` e `MOTOBOY_PASSWORD` estiverem definidos)
   - Inicia a API

5. Validar: `GET https://SUA-API.up.railway.app/api/health` → `{ "status": "ok" }`

---

## Passo 3 — Frontend (Vercel)

1. Importar o mesmo repositório GitHub.
2. **Root Directory:** `frontend`
3. Variáveis de ambiente:

| Variável | Valor |
|----------|--------|
| `VITE_API_URL` | URL pública da API no Railway |
| `VITE_APP_NAME` | Nome do cliente (sidebar e login) |
| `VITE_APP_SUBTITLE` | Subtítulo (sidebar) |

4. **Logo do cliente:** substituir `frontend/public/app-logo.png` e os ícones PWA (`pwa-icon-192.png`, `pwa-icon-512.png`) antes do deploy.

5. Deploy e anotar a URL (ex.: `https://gestao-cliente.vercel.app`).

6. Voltar ao Railway e confirmar `FRONTEND_URL` = URL exata da Vercel (CORS).

---

## Passo 4 — Validação pós-deploy

- [ ] `GET /api/health` retorna OK
- [ ] Login com `ADMIN_EMAIL` / `ADMIN_PASSWORD` funciona
- [ ] Login com `MOTOBOY_EMAIL` / `MOTOBOY_PASSWORD` funciona (se configurado)
- [ ] Dashboard carrega após login
- [ ] Cadastro de entrega funciona
- [ ] Logout funciona
- [ ] Nome do cliente aparece na sidebar e na tela de login
- [ ] Logo correto na sidebar e login

---

## Passo 5 — Entrega ao cliente

1. Enviar URL, e-mail e senha temporária (WhatsApp ou e-mail seguro).
2. Pedir troca de senha no primeiro acesso (manual por enquanto — fluxo “esqueci senha” é P2).
3. Criar usuários **Motoboy** se o plano incluir (via seed manual ou painel futuro).
4. Configurar endereço de partida padrão no Planejador.
5. Enviar material de onboarding: [vídeo + guia rápido](./onboarding.md).
6. Agendar treinamento (15–30 min) e follow-up em 7 e 30 dias.

---

## Checklist de homologação (cliente assina)

```
[ ] Consigo fazer login
[ ] Cadastro de entrega funciona
[ ] Pendência funciona
[ ] Prestação do dia gera corretamente
[ ] Texto WhatsApp da prestação está correto
[ ] Relatório abre e mostra dados
[ ] Planejador calcula rota (se plano Equipe+)
[ ] WhatsApp de andamento da rota funciona (se plano Equipe+)
```

---

## Troubleshooting

| Problema | Causa provável | Solução |
|----------|----------------|---------|
| Build Railway falha | `package-lock.json` desatualizado | `npm install` no `backend/` e commit |
| API não sobe | `JWT_SECRET` fraco ou padrão | Definir segredo com 32+ caracteres no Railway |
| CORS bloqueado | `FRONTEND_URL` incorreto | Conferir URL exata da Vercel (sem barra final) |
| 401 em todas as rotas | Token ausente ou expirado | Fazer logout e login novamente |
| Login OK mas tela branca | `VITE_API_URL` errado | Rebuild Vercel com URL correta da API |

---

## Custos estimados por cliente/mês

| Serviço | Faixa |
|---------|--------|
| Neon (free tier / scale) | R$ 0 – 80 |
| Railway | R$ 25 – 80 |
| Vercel (hobby) | R$ 0 – 100 |
| **Total** | **~R$ 50 – 150** |

Repassar na mensalidade do contrato.

---

## Documentos relacionados

- [Backup e recuperação](./backup.md) — PITR Neon, `pg_dump` e procedimento de restore
- [Onboarding](./onboarding.md) — roteiro do vídeo, guia rápido e checklist de entrega

---

*Última atualização: Agosto/2026*
