# Arquitetura técnica

Documento de referência para implementação. **Decisões ainda não tomadas** aparecem como “DECISÃO PENDENTE”; ao escolher, atualize este arquivo e `04-estado-do-projeto.md`.

---

## 1. Visão geral lógica

```text
[Browser]  HTTPS  [API / BFF]  —→  [PostgreSQL]
                |                        ↑
                ├—→  [Provedor LLM]       |
                |                        |
                └—→  [Provedor pagamentos] (webhooks → API)
```

- **BFF (Backend for Frontend):** recomendado para esconder chaves de API, aplicar rate limit e políticas de moderação no servidor.
- **LLM:** chamadas apenas server-side.

---

## 2. Stack sugerida (ponto de partida)

| Camada | Sugestão | Notas |
|--------|----------|--------|
| Frontend | Next.js (React) + TypeScript | SSR/SSG, rotas API opcionais como BFF |
| Estilo | Tailwind CSS + componentes acessíveis | Foco em contraste e leitura para longas conversas |
| Backend persistência | PostgreSQL | Conversas, usuários, assinaturas |
| ORM | **Prisma 5** | Em uso para `User`; conversas/mensagens ainda em memória até P3. |
| Auth | **NextAuth (Auth.js) v5** + JWT + credenciais | Rotas `/login`, `/register`; BFF exige sessão. |
| Hospedagem | Vercel + Neon/Railway/Fly | DECISÃO PENDENTE |
| LLM | OpenAI / Azure OpenAI / outro | Comparar custo, SLA e política de dados |
| Pagamentos | Stripe Billing | Padrão de mercado; adaptar se Brasil exigir métodos locais |
| Observabilidade | OpenTelemetry ou provedor (Datadog, etc.) | DECISÃO PENDENTE |

Trocar qualquer item acima é válido; o importante é manter **este documento** como fonte da verdade após a decisão.

---

## 3. Domínio de dados (conceitual)

Entidades mínimas para o MVP:

- **User (implementado em Prisma):** id, email, passwordHash, name, role (`STUDENT` \| `GUARDIAN`), termsAcceptedAt, createdAt. *Perfil e consentimento estão no mesmo modelo por simplicidade do MVP.*
- **Profile (doc original):** pode evoluir para tabela separada (`user_id`, `display_name`, …) se necessário.
- **Subscription:** user_id ou family_id, plan_id, status, period_end, external_customer_id.
- **Conversation:** id, owner_user_id, title (opcional), model, prompt_version, created_at.
- **Message:** id, conversation_id, role (`user` | `assistant` | `system`), content, token_count (opcional), created_at.

Campos adicionais (auditoria, moderação):

- **ModerationEvent:** message_id, action, reason_code, created_at (sem armazenar conteúdo redundante se não necessário).

---

## 4. API (contrato orientativo)

Prefixo sugerido: `/api/v1`. Autenticação: Bearer session ou cookie httpOnly.

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/conversations` | Lista conversas do usuário |
| POST | `/conversations` | Cria conversa |
| GET | `/conversations/:id/messages` | Histórico paginado |
| POST | `/conversations/:id/messages` | Envia mensagem do usuário; resposta pode ser SSE/stream |
| POST | `/billing/checkout` | Inicia checkout (retorna URL) — no código: `/api/v1/billing/checkout` (placeholder 501 até P4) |
| POST | `/webhooks/stripe` | Webhooks — no código: `/api/v1/webhooks/stripe` (placeholder 501 até P4) |

Detalhar schemas JSON em um OpenAPI/Swagger na Fase 1–2 do código.

---

## 5. Fluxo de chat (sequência)

1. Cliente envia texto + `conversation_id` (ou cria nova).
2. API carrega histórico recente (janela de tokens limitada).
3. API monta mensagens: `system` (prompt pedagógico) + histórico + nova mensagem.
4. (Opcional) Pré-moderação do input.
5. Chamada ao LLM com streaming.
6. (Opcional) Pós-moderação do output; se falhar, substituir por mensagem segura e logar evento.
7. Persistir mensagens e atualizar uso do plano.

---

## 6. Configuração e segredos

- Variáveis de ambiente: `DATABASE_URL`, `LLM_API_KEY`, `STRIPE_SECRET`, `STRIPE_WEBHOOK_SECRET`, `AUTH_SECRET`, etc.
- Nunca commitar `.env`; usar `.env.example` no repositório de código quando este existir.

---

## 7. Frontend — módulos sugeridos

- `app/(auth)/` — login, registro
- `app/(app)/chat/` — interface principal
- `app/(app)/settings/` — conta, plano, privacidade
- Componentes: `ChatThread`, `MessageList`, `Composer`, `ModelNotice` (aviso de IA)

### 7.1 Estrutura real no repositório (`apps/web`)

| Caminho | Conteúdo |
|---------|-----------|
| `apps/web/src/app/(app)/chat/` | Lista de conversas + rota `[conversationId]` com thread |
| `apps/web/src/app/(app)/settings/` | Placeholder conta/plano |
| `apps/web/src/app/(auth)/login/` | Placeholder login |
| `apps/web/src/app/api/v1/conversations/` | BFF: CRUD conversas + mensagens |
| `apps/web/src/app/api/v1/billing/checkout/` | Placeholder até P4 |
| `apps/web/src/app/api/v1/webhooks/stripe/` | Placeholder até P4 |
| `apps/web/src/domain/` | Tipos `Conversation`, `Message`, etc. |
| `apps/web/src/server/conversation-store.ts` | Repositório em memória (trocar por DB) |
| `apps/web/src/server/llm/generate-reply.ts` | Geração: mock ou OpenAI se `OPENAI_API_KEY` |
| `apps/web/src/server/prompts/system.ts` | `PROMPT_VERSION` + texto system |
| `apps/web/src/lib/api/v1-client.ts` | Chamadas `fetch` do browser ao BFF |

Resposta do assistente no MVP de código: **JSON na mesma requisição** `POST .../messages` (streaming SSE pode ser adicionado depois sem mudar o contrato de domínio).

---

## 8. Testes

- Unitários: utilitários, formatação de prompts, políticas puras.
- Integração: API + banco de teste (container).
- E2E críticos: login smoke, envio de mensagem mockada ou em sandbox.

---

## 9. Evolução técnica planejada

- **RAG (opcional):** material didático proprietário indexado para respostas ancoradas em fontes — documentar em fase futura.
- **i18n:** português primeiro; arquitetura preparada para strings externas.

---

## 10. Checklist antes do primeiro deploy público

- [ ] HTTPS em todo tráfego
- [ ] Política de privacidade e termos publicados
- [ ] Rate limiting na rota de chat
- [ ] Backup do banco configurado
- [ ] Chaves rotacionáveis sem downtime desnecessário
