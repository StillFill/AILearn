# Guia para agentes de IA (Cursor e similares)

Use este arquivo como **atalho** antes de implementar qualquer coisa neste repositório.

---

## 1. Contexto em uma frase

**SmartLearn** é uma web app de **chat com IA** para apoio escolar de crianças e adolescentes, com **assinatura** planejada; o núcleo é conversação pedagógica, não substituir escola ou tutores humanos.

---

## 2. Onde está a verdade sobre “o que fazer agora”

1. Leia **`docs/04-estado-do-projeto.md`** — checklist por fase e “Próximo passo recomendado”.
2. Se for decisão de arquitetura, alinhe com **`docs/03-arquitetura-tecnica.md`**.
3. Qualquer mudança de escopo de produto: **`docs/01-visao-e-objetivos.md`** e **`docs/02-plano-de-desenvolvimento.md`**.

---

## 3. Estado atual do repositório (até alguém atualizar)

- **Documentação:** `docs/` + `README.md` na raiz.
- **Aplicação:** `apps/web/` — Next.js, BFF `/api/v1`, NextAuth + Prisma (`User`, `Conversation`, `Message` em Postgres), rate limit em memória; no chat, **leitura em voz** (Web Speech por omissão; **OpenAI TTS** em `/api/v1/tts` se `OPENAI_TTS_ENABLED`). **Go-live:** speech premium (OpenAI TTS) documentado para ligar nos passos finais antes do lançamento — `04-estado-do-projeto.md` (secção *Go-live: speech premium*). **Roadmap:** **cadastro pedagógico** (dificuldades, objectivos, interesses), **score por assunto** (chats + declarado), **perguntas diárias** — `02-plano-de-desenvolvimento.md` (Fases 2 evolução e 6). Próximo: SSE opcional, P4/P5 — ver `04-estado-do-projeto.md`.

---

## 4. Regras de trabalho para implementação futura

- **Nunca** colocar chaves de API de LLM ou Stripe no frontend exposto.
- Seguir diretrizes de **`docs/05-ia-seguranca-e-conformidade.md`** para prompts, moderação e dados de menores.
- Após cada feature mergeável, atualizar checkboxes e **Histórico de alterações** em `04-estado-do-projeto.md`.

---

## 5. Estrutura de pastas (implementado)

```text
apps/web/
  src/app/(app)/chat/       # UI chat
  src/app/api/v1/           # BFF
  src/components/chat/
  src/domain/
  src/server/               # store, prompts, llm
```

Pacote `packages/shared` ainda opcional / não criado.

---

## 6. Idioma

- Documentação de produto: **português** (usuário principal).
- Código e commits: inglês ou português — **padronizar** no primeiro PR e registrar aqui.

---

## 7. Perguntas sem resposta no docs

Se algo não estiver documentado, **não inventar silenciosamente**: adicionar “DECISÃO PENDENTE” em `03-arquitetura-tecnica.md` ou abrir tarefa explícita em `04-estado-do-projeto.md` antes de codificar dependências fortes.
