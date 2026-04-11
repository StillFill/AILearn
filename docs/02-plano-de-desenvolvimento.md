# Plano de desenvolvimento

Este plano divide o trabalho em **fases sequenciais** com entregas verificáveis. Ajuste datas e prioridades em `04-estado-do-projeto.md` conforme a realidade do time.

---

## Fase 0 — Fundação de produto e documentação

**Objetivo:** alinhar visão, riscos legais básicos e decisões de alto nível antes de código significativo.

**Entregas:**

- Documentos em `docs/` (este conjunto).
- Definição de MVP e “não objetivos” explícitos.

**Critérios de pronto:**

- Qualquer desenvolvedor (ou agente de IA) consegue ler `04-estado-do-projeto.md` + `CURSOR_AGENT.md` e saber o próximo passo.

**Status:** concluída com a criação inicial do repositório (sem código de app).

---

## Fase 1 — Setup técnico e esqueleto da aplicação web

**Objetivo:** repositório com build, lint, testes mínimos e deploy de ambiente de desenvolvimento/staging.

**Entregas sugeridas:**

- Monorepo ou repo único com frontend (e opcionalmente backend no mesmo repo).
- CI (pipeline) rodando lint + testes em PR.
- Ambiente de staging (ex.: Vercel/Netlify para front; backend conforme `03-arquitetura-tecnica.md`).

**Critérios de pronto:**

- `README.md` do código com comandos `dev`, `build`, `test`.
- Deploy automático da branch principal em staging.

---

## Fase 2 — Identidade, contas e papéis

**Objetivo:** permitir cadastro/login e separação entre **aluno** e **responsável/organização** (mesmo que simplificado no MVP).

**Entregas:**

- Fluxo de registro e login (email/OAuth — decisão técnica a registrar em arquitetura).
- Modelo de dados: `User`, `Profile` (idade ou faixa etária), vínculo tutor–aluno se necessário.
- Política de consentimento e idade mínima (texto jurídico revisado por profissional).

**Critérios de pronto:**

- Usuário consegue entrar, sair e recuperar sessão de forma segura.
- Dados mínimos coletados; campos sensíveis documentados.

**Evolução planeada (produto — após MVP mínimo de auth):** no **cadastro** (e/ou definições de conta), o aluno passará a fornecer de forma **estruturada**: **áreas/matérias em que sente dificuldade**, **o que gostaria de aprender** e **temas ou áreas de interesse para explorar coisas novas**. Estes campos alimentam personalização e, em conjunto com o histórico de **chats**, sustentam um **score ou nível de progresso por assunto** (quão avançado o utilizador parece estar naquele tópico ao longo do tempo), com transparência na UI, revisão de qualidade e enquadramento legal de **inferências** (ver `05-ia-seguranca-e-conformidade.md`).

---

## Fase 3 — Chat conversacional (núcleo)

**Objetivo:** UI de chat + backend que chama o LLM com políticas pedagógicas e limites.

**Entregas:**

- Lista de conversas e tela de mensagens (streaming de tokens se possível).
- Endpoint seguro que encapsula a chave do provedor de IA (nunca expor chave no browser).
- System prompt versionado (arquivo ou tabela `prompt_version`).

**Critérios de pronto:**

- Latência aceitável e tratamento de erros (timeout, rate limit).
- Logs sem dados desnecessários de menores (ver `05-ia-seguranca-e-conformidade.md`).

**Antes do lançamento público:** nos passos finais de go-live, ativar o **speech premium** (TTS OpenAI no servidor, `OPENAI_TTS_ENABLED` em produção) conforme descrito em `04-estado-do-projeto.md` — secção **Go-live: speech premium (TTS OpenAI)**. Durante o ciclo de desenvolvimento pode manter-se Web Speech no browser para controlar custos.

---

## Fase 4 — Assinaturas e limites de uso

**Objetivo:** monetização inicial e controle de custo de IA.

**Entregas:**

- Integração com provedor de pagamentos (ex.: Stripe) e webhooks.
- Planos (ex.: mensal) com limites de mensagens/tokens.
- Página de conta e cancelamento.

**Critérios de pronto:**

- Upgrade/downgrade refletindo limites no chat.
- Conformidade fiscal e de faturamento delegada ao provedor onde possível (detalhar com contador).

---

## Fase 5 — Qualidade pedagógica e segurança operacional

**Objetivo:** endurecer o produto para uso por menores.

**Entregas:**

- Filtros de entrada/saída (lista de tópicos bloqueados, classificador ou regras).
- Testes com cenários de conversa (dataset interno, não público se contiver exemplos sensíveis).
- Processo de revisão de incidentes e atualização de prompts.

**Critérios de pronto:**

- Runbook interno: o que fazer se um conteúdo inadequado passar.
- Métricas básicas de moderação (contagem de bloqueios, falsos positivos anotados).

---

## Fase 6 — Extensões (pós-MVP)

**Objetivo:** cursinho, trilhas, conteúdo estruturado — sem perder o foco no chat.

**Entregas (priorizar uma de cada vez):**

- **Jornada de perguntas diárias (“check-in” de entendimento):** o aluno recebe um conjunto de perguntas **por dia** para responder e avaliar o que assimilou; o estado **reinicia no início de cada dia** (novo lote, sem arrastar progresso pendente do dia anterior salvo decisão de produto). A geração usa **leitura agregada dos chats existentes** desse utilizador (com minimização de dados e opt-in/consentimento conforme evolução legal), **dados declarados no cadastro** (dificuldades, objectivos, interesses) e sinais de **onde o aluno demonstra mais dificuldade** na conversa (ex.: tópicos repetidos, erros corrigidos pelo assistente, pedidos de explicação mais longos — a definir tecnicamente). Requer jobs ou cron no BFF, armazenamento de “sessão do dia”, moderação das perguntas geradas e limites de custo LLM.
- **Score de domínio por assunto:** modelo de dados e UI para um **indicador evolutivo** (por tema ou matéria) combinando **perfil declarado** e **análise periódica dos chats** (pipeline assíncrono ou batch); documentar limitações (“não é nota”), opt-out ou ajuste manual onde aplicável, e impacto em custo de LLM.
- “Modo vestibular” com bancas e estilo de questão configurável.
- Biblioteca de tópicos com links para o chat contextualizado.
- Relatórios para responsáveis (tempo de estudo, temas perguntados — com privacidade).

---

## Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| Custo de LLM explode | Limites por plano, cache onde fizer sentido, modelo mais barato para rascunho |
| Respostas incorretas confundem o aluno | Disclaimer + estilo socrático + sugestão de conferir com professor |
| Conteúdo inadequado | Camadas de moderação, idade no perfil, reporte |
| LGPD / menores | Minimização de dados, bases legais, DPO ou consultoria |

---

## Dependências entre fases

```text
F0 Docs → F1 Setup → F2 Auth → F3 Chat → F4 Billing
                              ↘
                               F5 Safety (paralelo a partir de F3)
                                        → F6 Extensões
```

Atualize esta seção se a ordem mudar; registre a mudança e a data em `04-estado-do-projeto.md`.
