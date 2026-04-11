# SmartLearn — app web (`apps/web`)

Next.js (App Router) + TypeScript + Tailwind. O **BFF** vive em `src/app/api/v1/`; chaves de LLM ficam só no servidor.

---

## Desenvolvimento local (passo a passo)

No teu PC precisas de:

1. **Node.js** 20 ou 22 (recomendado; alinhado ao CI).
2. **PostgreSQL acessível** — uma destas opções:
   - **Docker Desktop** (Windows/macOS): na pasta `apps/web`, `docker compose up -d` (usa o `docker-compose.yml` deste repo).
   - **PostgreSQL instalado** localmente, com uma base e utilizador criados por ti.
   - **Base na nuvem** (ex.: [Neon](https://neon.tech) grátis): copias a connection string para `DATABASE_URL`.

Não é obrigatório ter o OpenAI a correr no PC; o chat funciona em modo **mock** sem `OPENAI_API_KEY`.

### Comandos (primeira vez)

Na pasta `apps/web`:

```bash
npm install
```

Cria `apps/web/.env.local` (podes copiar de `.env.example`) e define **obrigatoriamente**:

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Ex. com Docker deste repo: `postgresql://smartlearn:smartlearn@localhost:5432/smartlearn` |
| `AUTH_SECRET` | String longa e aleatória (mín. ~32 caracteres). Ex.: `openssl rand -base64 32` |

Opcional: `OPENAI_API_KEY` — respostas reais do modelo no servidor.

Com o Postgres **já a aceitar ligações** (Docker `healthy` ou serviço local), **após cada `git pull` que traga migrações novas**:

```bash
npx prisma migrate deploy
npm run dev
```

O chat (conversas e mensagens) fica na base; o rate limit de mensagens/registo é **em memória por processo** (ver comentários em `src/server/rate-limit.ts`).

### Erro: `Cannot read properties of undefined (reading 'findMany')` em `prisma.conversation`

O cliente Prisma em `node_modules` está **desatualizado** em relação ao `schema.prisma` (por exemplo após `git pull`). Faz:

1. Para o servidor: `Ctrl+C` no terminal do `npm run dev`.
2. `npx prisma generate`
3. `npx prisma migrate deploy` (se houver migrações novas)
4. Volta a arrancar: `npm run dev`

O Node mantém em cache o módulo `@prisma/client` antigo até reiniciares o processo do Next.

Abre [http://localhost:3000](http://localhost:3000) → redireciona para `/chat`; se não estiveres autenticado, vais para `/login`. Cria conta em `/register` ou faz login.

### Comandos úteis

```bash
npm run lint
npm run build
npm run db:studio    # UI Prisma para inspecionar tabelas (com DATABASE_URL válido)
docker compose down  # para o Postgres local do Docker
```

---

## Variáveis de ambiente (referência)

Ver `.env.example`. Resumo: `DATABASE_URL`, `AUTH_SECRET`; opcional `OPENAI_API_KEY` e `OPENAI_CHAT_MODEL`.

---

## Deploy na Vercel e CI no GitHub

A configuração que **depende da tua conta / painéis** (variáveis, build command, domínio) está tratada como **pendente manual** em [`docs/04-estado-do-projeto.md`](../docs/04-estado-do-projeto.md#configuração-externa-pendente-fazer-depois) — não está automatizada no repositório.

---

## Autenticação (P2)

- **NextAuth (Auth.js) v5** + sessão JWT + **Prisma** + Postgres.
- Rotas: `/login`, `/register`, `/terms` (rascunho). Área autenticada: `/chat`, `/settings` (redirect se não houver sessão).
- API `POST /api/auth/register` cria utilizador (email, senha, nome, perfil `STUDENT` | `GUARDIAN`, aceite de termos).
- BFF `/api/v1/...` exige cookie de sessão (`credentials: "include"` no cliente).

---

## Estrutura principal

| Caminho | Função |
|---------|--------|
| `src/app/(app)/chat/` | UI de conversas |
| `src/app/api/v1/` | Rotas BFF (conversas, billing/webhook placeholder) |
| `src/domain/` | Tipos de domínio |
| `src/server/` | `requireSessionUserId`, store em memória (chat), prompts, LLM |
| `prisma/` | Esquema e migrações da tabela `User` |
| `src/auth.ts` | Configuração NextAuth |
| `src/components/chat/` | `ChatThread`, `MessageList`, `Composer`, `ModelNotice` |
| `src/lib/api/v1-client.ts` | Cliente HTTP do browser para o BFF |
| `docker-compose.yml` | Postgres opcional para desenvolvimento local |
