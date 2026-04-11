# SmartLearn — app web (`apps/web`)

Next.js (App Router) + TypeScript + Tailwind. O **BFF** vive em `src/app/api/v1/`; chaves de LLM ficam só no servidor.

## Comandos

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) (redireciona para `/chat`).

```bash
npm run lint
npm run build
```

## Variáveis de ambiente

Copie `.env.example` para `.env.local`. Obrigatório para a app:

- `DATABASE_URL` — PostgreSQL (ex.: [Neon](https://neon.tech) grátis).
- `AUTH_SECRET` — string longa e aleatória (ex.: `openssl rand -base64 32`).

Opcional: `OPENAI_API_KEY` — sem ela, o chat usa resposta **mock** no servidor.

Na Vercel: **Settings → Environment Variables** com os mesmos nomes. **Build Command** recomendado:

`npx prisma migrate deploy && npm run build`

(assim a base é migrada em cada deploy; requer `DATABASE_URL` disponível no passo de build.)

## Deploy

URL atual do ambiente hospedado: ver **Contatos / links úteis** em [`docs/04-estado-do-projeto.md`](../../docs/04-estado-do-projeto.md). **Root Directory** na Vercel: `apps/web`.

## Autenticação (P2)

- **NextAuth (Auth.js) v5** + sessão JWT + **Prisma** + Postgres.
- Rotas: `/login`, `/register`, `/terms` (rascunho). Área autenticada: `/chat`, `/settings` (redirect se não houver sessão).
- API `POST /api/auth/register` cria utilizador (email, senha, nome, perfil `STUDENT` | `GUARDIAN`, aceite de termos).
- BFF `/api/v1/...` exige cookie de sessão (`credentials: "include"` no cliente).

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

## Base de dados local

Com Postgres a correr (porta 5432) e `DATABASE_URL` apontando para a BD:

```bash
npx prisma migrate deploy
npm run dev
```
