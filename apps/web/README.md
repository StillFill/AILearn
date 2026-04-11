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

Copie `.env.example` para `.env.local`. Sem `OPENAI_API_KEY`, o chat usa **resposta mockada** para desenvolvimento.

Na Vercel, configure as mesmas variáveis em **Project → Settings → Environment Variables** (não commitar segredos).

## Deploy

URL atual do ambiente hospedado: ver **Contatos / links úteis** em [`docs/04-estado-do-projeto.md`](../../docs/04-estado-do-projeto.md). **Root Directory** do projeto na Vercel: `apps/web`.

## Estrutura principal

| Caminho | Função |
|---------|--------|
| `src/app/(app)/chat/` | UI de conversas |
| `src/app/api/v1/` | Rotas BFF (conversas, billing/webhook placeholder) |
| `src/domain/` | Tipos de domínio |
| `src/server/` | Persistência em memória, prompts, chamada LLM |
| `src/components/chat/` | `ChatThread`, `MessageList`, `Composer`, `ModelNotice` |
| `src/lib/api/v1-client.ts` | Cliente HTTP do browser para o BFF |

## Usuário em desenvolvimento

O BFF identifica o dono das conversas via header opcional `x-smartlearn-user` (padrão: `dev-user`). Na P2 isso vira sessão real.
