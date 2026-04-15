# Estado do projeto (fonte da verdade operacional)

**Última atualização:** 2026-04-10 — guia local + pendências Vercel/CI + roadmap (perguntas diárias, cadastro pedagógico, scores)  
**Mantenedor:** preencher nome/equipe

> **Instrução para humanos e para agentes de IA (Cursor):** ao concluir uma tarefa substancial, marque os checkboxes abaixo e adicione uma linha em **Histórico de alterações**. Se uma decisão mudar arquitetura ou escopo, atualize também `03-arquitetura-tecnica.md` ou `01-visao-e-objetivos.md`.

---

## Legenda de fases

| ID | Fase | Descrição resumida |
|----|------|-------------------|
| P0 | Documentação | Visão, plano, arquitetura, segurança |
| P1 | Setup código | Repo app, CI, staging |
| P2 | Auth & perfis | Login, papéis, consentimento; **roadmap:** perfil pedagógico no cadastro |
| P3 | Chat + LLM | UI, API, streaming, prompts |
| P4 | Assinaturas | Stripe, planos, limites |
| P5 | Segurança | Moderação, testes, runbooks |
| P6 | Extensões | Vestibular, trilhas, relatórios, **scores por assunto**, **perguntas diárias** (chat + cadastro) |
| P7 | Tutor guiado | Sessão de estudo orientada, modo professor, extração de dores e plano adaptativo |

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
- [ ] **Config externa pendente** — ver secção [abaixo](#configuração-externa-pendente-fazer-depois)

### P2 — Autenticação e dados de utilizador

- [x] Registro/login (NextAuth v5 + credenciais; `/login`, `/register`, `POST /api/auth/register`)
- [x] Perfis mínimos (`STUDENT` | `GUARDIAN` na tabela `User` via Prisma)
- [x] Fluxo de consentimento na UI (checkbox + página `/terms` rascunho; revisão jurídica ainda pendente em P0)
- [x] **Cadastro / conta:** campos pedagógicos estruturados no registo — seleção guiada de matérias com mais **afinidade** (mín. 3) e mais **dificuldade** (mín. 3), com objetivo principal opcional para personalização inicial.

### P3 — Chat e aprendizado (core)

- [x] UI de conversas (básica)
- [x] Persistência de conversas e mensagens em **PostgreSQL** (Prisma: `Conversation`, `Message`)
- [x] Integração LLM server-side (mock + OpenAI opcional via `OPENAI_API_KEY`)
- [x] System prompt versionado (`PROMPT_VERSION` em `apps/web/src/server/prompts/system.ts`)
- [x] Limite técnico de taxa (rate limit em memória: chat por utilizador; registo por IP — ver `.env.example`)
- [x] Leitura em voz das respostas do assistente (Web Speech no browser por omissão; **OpenAI TTS** no BFF pronto mas desativado — `OPENAI_TTS_ENABLED`)
- [ ] **Go-live:** ativar **speech premium** (OpenAI TTS em produção) nos passos finais antes do lançamento — ver [Go-live: speech premium](#go-live-speech-premium-tts-openai)
- [x] (Opcional) SSE no `POST .../messages` com resposta incremental no chat

### P4 — Monetização

- [x] Produtos/preços no Stripe (ou equivalente)
- [x] Checkout e portal do cliente
- [ ] Enforcement de limites por plano

### P5 — Segurança operacional

- [ ] Pipeline de moderação input/output
- [ ] Testes de regressão de segurança (cenários)
- [ ] Runbook de incidentes

### P6 — Extensões (pós-MVP)

- [ ] **Score de progresso por assunto** (quão avançado o aluno parece estar em cada tema), **actualizado com análises dos chats** e alinhado ao **perfil declarado** no cadastro; UI transparente — `02-plano-de-desenvolvimento.md` (Fase 6)
- [ ] **Perguntas diárias** para o aluno (novo lote a cada início de dia), geradas a partir do **histórico de chats**, do **mapeamento de dificuldades** e dos **dados de cadastro**; detalhe em `02-plano-de-desenvolvimento.md` (Fase 6) e `01-visao-e-objetivos.md`
- [ ] “Modo vestibular” ou similar
- [ ] Trilhas / tópicos curados
- [ ] Relatórios para responsáveis

### P7 — Tutor guiado por sessão e plano adaptativo

- [x] Fluxo “iniciar sessão de estudo” (matéria, tópico, dificuldade declarada, objetivo da sessão)
- [x] Chat em modo professor com estados pedagógicos (`diagnosticar` -> `ensinar` -> `praticar` -> `avaliar` -> `próximo passo`)
- [x] Extração estruturada de dores por sessão (matéria/subtema/dor/confiança/evidências)
- [x] Persistência dos sinais e montagem de plano adaptativo por aluno
- [x] UI de transparência: mostrar “o que a IA entendeu” e próximos passos recomendados

---

## O que já foi produzido (resumo executivo)

| Área | Status |
|------|--------|
| Documentação estratégica e técnica | **Feito** (P0) |
| Código frontend + BFF Next (`apps/web`) | **P1 fechado**, **P2**, **P3** núcleo chat em PG + rate limit |
| Monetização (Stripe) | **P4 parcial**: checkout, portal e webhook de assinatura implementados; falta enforcement de limites |
| Infraestrutura | **Vercel** — deploy ativo (ver URL abaixo) |

---

## Próximo passo recomendado (ordem)

1. **P4 (continuação):** aplicar enforcement de limites por plano no chat (bloqueio/degradação para sem assinatura ou fora do plano).
2. **P1 (manual / pendente):** completar [configuração externa](#configuração-externa-pendente-fazer-depois) na Vercel (e ajustar CI se necessário).
3. **P5 (paralelo):** moderação e endurecimento de segurança conforme `docs/05-ia-seguranca-e-conformidade.md`.

---

## Go-live: speech premium (TTS OpenAI)

Nos **passos finais antes do lançamento** (checklist de produção / cutover), prevê-se **ligar o speech premium**: ativar o TTS via OpenAI no ambiente de produção (`OPENAI_TTS_ENABLED=true`, `OPENAI_API_KEY` e, se necessário, `OPENAI_TTS_MODEL` / `OPENAI_TTS_VOICE` conforme `apps/web/.env.example`). Até lá, em desenvolvimento e staging, pode manter-se **desligado** para poupar custo e iterar com **Web Speech** no browser. O código e o BFF já suportam a troca só por configuração e variáveis na Vercel.

---

## Decisões registradas (changelog de produto/eng)

| Data | Decisão |
|------|---------|
| 2026-04-15 | **P7 MVP implementado no código:** API de sessão guiada (`/api/v1/study-sessions`), contexto pedagógico injetado no chat, extração de sinais de dor e plano adaptativo exibido na UI de `/chat`. |
| 2026-04-15 | **P4 parcial implementado:** Stripe checkout (`/api/v1/billing/checkout`), portal (`/api/v1/billing/portal`) e webhook (`/api/v1/webhooks/stripe`) já sincronizam status no `User`; próximo passo é enforcement de limites por plano no chat. |
| 2026-04-15 | **Novo plano P7:** tutor guiado por sessão (matéria/tópico/meta), chat com fluxo pedagógico, extração estruturada de dores e plano adaptativo por aluno — ver Fase 7 em `02-plano-de-desenvolvimento.md`. |
| 2026-04-10 | **Roadmap:** cadastro com **dificuldades / objectivos / interesses**; **score por assunto** (chats + perfil declarado); **perguntas diárias** (reset diário) articuladas com chats + declarações — ver Fases 2 (evolução) e 6 em `02-plano-de-desenvolvimento.md`. |
| 2026-04-10 | **Go-live:** speech premium (OpenAI TTS) fica **desligado** durante a maior parte do desenvolvimento; nos passos finais antes do lançamento público, **ativar** `OPENAI_TTS_ENABLED` (e chave) em produção para a experiência de voz final. |
| 2026-04-10 | P3: TTS **OpenAI** (`POST /api/v1/tts`) implementado atrás de `OPENAI_TTS_ENABLED` (default off); com flag off o cliente usa **Web Speech**; com flag on + `OPENAI_API_KEY`, áudio MP3 no servidor (fallback nativo se o pedido falhar). |
| 2026-04-10 | P3: leitura em voz no chat via **Web Speech API** (`speechSynthesis`): só no cliente, voz do SO/browser, texto derivado do Markdown com utilitário leve (sem API de TTS paga). |
| 2026-04-10 | P3: `Conversation` + `Message` em PostgreSQL; rate limit (chat/registo); store em memória removido para chat. |
| 2026-04-10 | P2: NextAuth + Prisma + Postgres (`User`), registo/login, consentimento UI; BFF exige sessão. |
| 2026-04-10 | Deploy na Vercel; URL atual documentada em **Contatos / links úteis** (subdomínio longo = deploy/projeto no painel). |
| 2026-04-10 | App Next.js em `apps/web`: BFF `/api/v1`, chat UI básica, store em memória, LLM mock ou OpenAI opcional. |
| 2026-04-10 | Criação do pacote de documentação inicial; MVP centrado em chat + IA; assinatura prevista após núcleo de chat. |

*(Adicione novas linhas no topo da tabela.)*

---

## Histórico de alterações (engenharia)

- **2026-04-10:** Roadmap: cadastro pedagógico, score por assunto (chats + declarado), perguntas diárias; P2/P6, visão e plano actualizados.
- **2026-04-15:** P7 MVP entregue: sessões guiadas, sinais de dor persistidos e plano adaptativo básico integrado ao chat.
- **2026-04-15:** P4 monetização parcial: checkout/portal Stripe e webhook ativos com sincronização de assinatura na tabela `User`.
- **2026-04-15:** Adicionada fase P7 (tutor guiado por sessão e plano adaptativo): diagnóstico orientado, extração de dores estruturadas e plano pedagógico contínuo.
- **2026-04-15:** P2 evolutivo fechado no cadastro: onboarding visual por matérias com seleção mínima (3 afinidade + 3 dificuldade) e persistência do perfil pedagógico no `User`.
- **2026-04-15:** P3 UX: streaming SSE no envio de mensagem (`POST /api/v1/conversations/:id/messages`) com renderização incremental da resposta no chat.
- **2026-04-10:** Documentado: speech premium (OpenAI TTS) a ligar nos passos finais antes do go-live; checklist P3 atualizado.
- **2026-04-10:** BFF `GET/POST /api/v1/tts` + `OPENAI_TTS_*` (TTS OpenAI desligado por omissão; UI prefere API quando ativo, senão Web Speech).
- **2026-04-10:** Chat — botão “ouvir resposta” nas mensagens do assistente (TTS no browser com Web Speech API; `pt-BR`).
- **2026-04-10:** P3 chat persistido em PG + rate limit; nova migração `20260410140000_conversations_messages`.
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
