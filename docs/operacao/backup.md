# Runbook — Backup e recuperação (Fase 2)

Procedimento para **proteger e restaurar** os dados de cada cliente.

**Arquitetura:** cada cliente tem um projeto **Neon** (PostgreSQL) dedicado. A API (Railway) e o frontend (Vercel) são stateless — em caso de perda, basta redeploy a partir do GitHub. **O que precisa de backup é o banco.**

**Documentos relacionados:** [Deploy por cliente](./deploy-cliente.md)

---

## O que está em risco

| Dado | Onde vive | Recuperável sem backup? |
|------|-----------|-------------------------|
| Entregas, pendências, prestações, rotas, usuários | Neon (PostgreSQL) | **Não** |
| Código da aplicação | GitHub | Sim (redeploy) |
| Variáveis de ambiente | Railway / Vercel | Parcial — manter cópia segura |
| Logo e nome do cliente | Vercel (build) | Sim (redeploy com assets) |

**Tabelas principais:** `entregas`, `pendencias`, `prestacoes_contas`, `rotas_planejadas`, `rota_paradas`, `rota_execucao`, `usuarios`, `configuracao_planejador`.

---

## Estratégia recomendada

Use **duas camadas** de proteção para clientes em produção:

| Camada | Método | RPO* | Quando usar |
|--------|--------|------|-------------|
| **1 — Automática** | Point-in-time restore (PITR) do Neon | Minutos a horas | Exclusão acidental, corrupção recente |
| **2 — Manual** | Export lógico com `pg_dump` (mensal ou semanal) | Até o último dump | Desastre no projeto Neon, auditoria, migração |

\* **RPO** = Recovery Point Objective — quanto dado no máximo pode ser perdido.

**Plano Neon:** o free tier tem histórico limitado. Para clientes pagantes, use plano **Scale** com PITR habilitado (retenção conforme o plano contratado).

---

## Configuração inicial (por cliente)

Ao criar o projeto Neon no [deploy do cliente](./deploy-cliente.md):

- [ ] Anotar **nome do projeto**, **região** (`sa-east-1`) e **ID** no cadastro interno do cliente
- [ ] Guardar a `DATABASE_URL` em cofre de senhas (1Password, Bitwarden, etc.) — **nunca** no repositório
- [ ] Confirmar que o plano inclui **PITR** (clientes Operação / produção)
- [ ] Definir responsável pela revisão mensal de backups
- [ ] Agendar primeiro **teste de restore** antes do go-live (ver seção abaixo)

---

## Camada 1 — Point-in-time restore (Neon)

### Quando usar

- Dados apagados ou alterados nas últimas horas/dias
- Necessidade de voltar a um momento específico sem restaurar dump antigo

### Procedimento (console Neon)

1. Acesse [console.neon.tech](https://console.neon.tech) → projeto do cliente
2. Vá em **Branches** ou **Restore** (menu varia conforme versão do console)
3. Escolha **Restore to point in time** (ou crie um **branch** a partir de um timestamp)
4. Selecione data/hora **antes** do incidente
5. Neon cria um branch ou restaura o endpoint — anote a **nova connection string** se mudar
6. Se a connection string mudou:
   - Atualize `DATABASE_URL` no Railway
   - Aguarde redeploy automático da API
7. Valide com o [checklist pós-restore](#checklist-pós-restore)

### Após restore por PITR

- Se criou um **branch de teste**, valide os dados antes de apontar a produção
- Se substituiu o branch `main`, a API passa a usar os dados restaurados imediatamente após atualizar `DATABASE_URL`

---

## Camada 2 — Export lógico (`pg_dump`)

### Pré-requisitos

- [PostgreSQL client tools](https://www.postgresql.org/download/) instalados (`pg_dump`, `psql`)
- `DATABASE_URL` do cliente (com `sslmode=require` — use a string copiada do Neon)

### Export manual (Windows PowerShell)

```powershell
$env:DATABASE_URL = "postgresql://usuario:senha@ep-xxx.sa-east-1.aws.neon.tech/neondb?sslmode=require"
$date = Get-Date -Format "yyyy-MM-dd"
$cliente = "nome-do-cliente"
pg_dump $env:DATABASE_URL -F c -f "backup-$cliente-$date.dump"
```

Formato custom (`-F c`) é compacto e recomendado para restore com `pg_restore`.

### Export manual (Linux / macOS)

```bash
export DATABASE_URL="postgresql://..."
CLIENTE="nome-do-cliente"
DATA=$(date +%Y-%m-%d)
pg_dump "$DATABASE_URL" -F c -f "backup-${CLIENTE}-${DATA}.dump"
```

### Onde guardar os arquivos

- Pasta criptografada (BitLocker, FileVault) ou cofre de arquivos
- Opcional: bucket S3 / Backblaze com criptografia e política de retenção (90 dias mínimo)
- **Não** commitar dumps no Git — contêm dados sensíveis do cliente

### Frequência sugerida

| Perfil do cliente | Frequência do dump |
|-------------------|-------------------|
| Piloto / baixo volume | Mensal |
| Operação diária | Semanal |
| Antes de migration ou deploy arriscado | Imediato |

---

## Restore a partir de dump

### Cenário A — Banco vazio ou novo projeto Neon

1. Crie um novo projeto Neon (ou use branch limpo)
2. Copie a nova `DATABASE_URL`
3. Restaure o dump:

```bash
pg_restore -d "$DATABASE_URL" --no-owner --no-acl backup-cliente-2026-08-05.dump
```

4. Atualize `DATABASE_URL` no Railway
5. A API roda `prisma migrate deploy` no próximo deploy — migrations já aplicadas no dump devem estar alinhadas; se o dump for de versão antiga, rode migrate após restore
6. Execute o [checklist pós-restore](#checklist-pós-restore)

### Cenário B — Substituir banco existente (cuidado)

```bash
pg_restore -d "$DATABASE_URL" --clean --if-exists --no-owner --no-acl backup-cliente-2026-08-05.dump
```

`--clean` remove objetos antes de recriar — **apaga dados atuais**. Use apenas quando tiver certeza.

### Cenário C — Restore em branch de teste (recomendado para validação)

1. No Neon, crie um **branch** a partir de `main`
2. Use a connection string do branch de teste
3. Restaure o dump no branch de teste
4. Valide queries e login
5. Só então aplique em produção (PITR ou troca de branch)

---

## Teste de restore (obrigatório antes do go-live)

Executar **uma vez** por cliente antes da homologação final:

```
[ ] Criar branch ou projeto Neon de teste
[ ] Gerar dump de produção (ou usar seed representativo)
[ ] Restaurar dump no ambiente de teste
[ ] Atualizar DATABASE_URL temporária e subir API local ou branch Railway
[ ] Login admin funciona
[ ] Contagem de entregas bate com o esperado
[ ] Prestação do dia visível no histórico
[ ] Documentar data do teste e responsável
```

**Query rápida de sanidade** (psql ou cliente SQL do Neon):

```sql
SELECT
  (SELECT COUNT(*) FROM entregas) AS entregas,
  (SELECT COUNT(*) FROM pendencias) AS pendencias,
  (SELECT COUNT(*) FROM prestacoes_contas) AS prestacoes,
  (SELECT COUNT(*) FROM usuarios) AS usuarios;
```

---

## Checklist pós-restore

```
[ ] GET /api/health retorna OK
[ ] Login admin funciona
[ ] Dashboard carrega
[ ] Última prestação gerada aparece no histórico
[ ] Entregas do dia atual listam corretamente
[ ] Planejador abre (se plano incluir)
[ ] Informar cliente se houve perda de dados dentro do RPO
```

---

## Incidentes comuns

| Situação | Ação |
|----------|------|
| Cliente apagou prestação por engano | PITR para minutos antes do delete, ou restore dump recente |
| Migration falhou no deploy | Corrigir migration; se banco ficou inconsistente, PITR para antes do deploy |
| Projeto Neon excluído por engano | Restaurar a partir do último `pg_dump` em novo projeto; atualizar Railway |
| Suspeita de vazamento da `DATABASE_URL` | Rotacionar senha no Neon, atualizar Railway, revisar logs de acesso |

---

## Manutenção recorrente

### Mensal (por cliente ativo)

```
[ ] Confirmar no console Neon que PITR está ativo e dentro da retenção
[ ] Gerar dump lógico e armazenar em local seguro
[ ] Anotar data do dump no cadastro do cliente
[ ] Verificar que DATABASE_URL no Railway ainda aponta para o projeto correto
```

### Trimestral

```
[ ] Revisar política de retenção dos dumps (apagar > 90 dias se não houver exigência legal)
[ ] Confirmar que cofre de senhas tem DATABASE_URL e JWT_SECRET atualizados
```

---

## RTO e RPO estimados

| Cenário | RPO | RTO |
|---------|-----|-----|
| PITR Neon | Conforme retenção do plano (ex.: 7 dias) | 15–60 min (restore + validação) |
| Dump semanal | Até 7 dias | 30–90 min (novo restore + Railway) |
| Dump mensal | Até 30 dias | 30–90 min |

Ajuste expectativas com o cliente no contrato de suporte.

---

## O que **não** está neste runbook

- Backup do código (GitHub) — use tags/releases para versões em produção
- Backup de variáveis Railway/Vercel — export manual das env vars ao onboarding
- Replicação multi-região — evolução futura se o volume justificar

---

*Última atualização: Agosto/2026*
