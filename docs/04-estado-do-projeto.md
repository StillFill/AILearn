# Estado do projeto (fonte da verdade operacional)

**Última atualização:** 2026-04-10 — deploy Vercel documentado  
**Mantenedor:** preencher nome/equipe

> **Instrução para humanos e para agentes de IA (Cursor):** ao concluir uma tarefa substancial, marque os checkboxes abaixo e adicione uma linha em **Histórico de alterações**. Se uma decisão mudar arquitetura ou escopo, atualize também `03-arquitetura-tecnica.md` ou `01-visao-e-objetivos.md`.

---

## Legenda de fases

| ID | Fase | Descrição resumida |
|----|------|-------------------|
| P0 | Documentação | Visão, plano, arquitetura, segurança |
| P1 | Setup código | Repo app, CI, staging |
| P2 | Auth & perfis | Login, papéis, consentimento |
| P3 | Chat + LLM | UI, API, streaming, prompts |
| P4 | Assinaturas | Stripe, planos, limites |
| P5 | Segurança | Moderação, testes, runbooks |
| P6 | Extensões | Vestibular, trilhas, relatórios |

---

## Checklist por fase

### P0 — Documentação e produto

- [x] Visão e objetivos (`01-visao-e-objetivos.md`)
- [x] Plano de desenvolvimento (`02-plano-de-desenvolvimento.md`)
- [x] Arquitetura técnica rascunho (`03-arquitetura-tecnica.md`)
- [x] IA, segurança e conformidade — rascunho (`05-ia-seguranca-e-conformidade.md`)
- [x] Negócio e assinaturas — rascunho (`06-negocio-e-assinaturas.md`)
- [x] Guia para agentes (`CURSOR_AGENT.md`)
- [ ] Revisão jurídica externa (LGPD, termos, menores) — **obrigatório antes de produção com menores**

### P1 — Código base e DevOps

- [x] Repositório de aplicação inicializado (`apps/web`, Next.js 16)
- [x] `README` técnico com comandos dev/build/test (`apps/web/README.md` + README raiz)
- [x] Lint + CI (GitHub Actions em `.github/workflows/ci.yml`)
- [x] Deploy Vercel (URL em **Contatos / links úteis**; domínio estável do projeto pode ser adicionado depois)
- [x] `.env.example` documentado (`apps/web/.env.example`)

### P2 — Autenticação e dados de utilizador

- [x] Registro/login (NextAuth v5 + credenciais; `/login`, `/register`, `POST /api/auth/register`)
- [x] Perfis mínimos (`STUDENT` | `GUARDIAN` na tabela `User` via Prisma)
- [x] Fluxo de consentimento na UI (checkbox + página `/terms` rascunho; revisão jurídica ainda pendente em P0)

### P3 — Chat e aprendizado (core)

- [x] UI de conversas (básica)
- [x] Persistência de mensagens (em memória; **não** PostgreSQL ainda)
- [x] Integração LLM server-side (mock + OpenAI opcional via `OPENAI_API_KEY`)
- [x] System prompt versionado (`PROMPT_VERSION` em `apps/web/src/server/prompts/system.ts`)
- [ ] Limite técnico de taxa (rate limit)

### P4 — Monetização

- [ ] Produtos/preços no Stripe (ou equivalente)
- [ ] Checkout e portal do cliente
- [ ] Enforcement de limites por plano

### P5 — Segurança operacional

- [ ] Pipeline de moderação input/output
- [ ] Testes de regressão de segurança (cenários)
- [ ] Runbook de incidentes

### P6 — Extensões (pós-MVP)

- [ ] “Modo vestibular” ou similar
- [ ] Trilhas / tópicos curados
- [ ] Relatórios para responsáveis

---

## O que já foi produzido (resumo executivo)

| Área | Status |
|------|--------|
| Documentação estratégica e técnica | **Feito** (P0) |
| Código frontend + BFF Next (`apps/web`) | **P1 fechado**, **P2 auth feito**, **P3 chat** ainda sem PG para mensagens |
| Infraestrutura | **Vercel** — deploy ativo (ver URL abaixo) |

---

## Próximo passo recomendado (ordem)

1. **P3:** Persistir conversas/mensagens em PostgreSQL (além de `User`) + rate limit + (opcional) SSE no `POST .../messages`.
2. **P1 (opcional):** domínio estável na Vercel; **Build Command** com `npx prisma migrate deploy && npm run build` e env `DATABASE_URL` + `AUTH_SECRET` (+ `OPENAI_API_KEY` se quiser LLM real).
3. **P5 (paralelo):** moderação e endurecimento de segurança conforme `docs/05-ia-seguranca-e-conformidade.md`.

---

## Decisões registradas (changelog de produto/eng)

| Data | Decisão |
|------|---------|
| 2026-04-10 | P2: NextAuth + Prisma + Postgres (`User`), registo/login, consentimento UI; BFF exige sessão. |
| 2026-04-10 | Deploy na Vercel; URL atual documentada em **Contatos / links úteis** (subdomínio longo = deploy/projeto no painel). |
| 2026-04-10 | App Next.js em `apps/web`: BFF `/api/v1`, chat UI básica, store em memória, LLM mock ou OpenAI opcional. |
| 2026-04-10 | Criação do pacote de documentação inicial; MVP centrado em chat + IA; assinatura prevista após núcleo de chat. |

*(Adicione novas linhas no topo da tabela.)*

---

## Histórico de alterações (engenharia)

- **2026-04-10:** P2 autenticação (NextAuth, Prisma `User`, páginas login/registo/termos); CI com Postgres para migrações.
- **2026-04-10:** URL de deploy Vercel registrada; app público em ambiente hospedado (dados de chat ainda em memória no servidor).
- **2026-04-10:** Scaffold `apps/web` (Next 16), rotas BFF, componentes de chat, CI; persistência ainda em memória.
- **2026-04-10:** Estrutura `docs/` e README raiz criados; nenhum código de aplicação.

---

## Bloqueadores atuais

- Nenhum técnico documentado. **Bloqueador de negócio:** revisão legal antes de dados reais de menores em produção.

---

## Contatos / links úteis

- Repositório Git: [https://github.com/StillFill/AILearn](https://github.com/StillFill/AILearn)
- Design / Figma: *a preencher*
- Painel Stripe: *a preencher*
- Deploy Vercel (produção atual): [https://ai-learn-7ko00erej-maujsgregorio-8983s-projects.vercel.app/](https://ai-learn-7ko00erej-maujsgregorio-8983s-projects.vercel.app/) — *subdomínio de equipe/projeto; pode haver também um domínio `*.vercel.app` curto no painel “Domains”.*
