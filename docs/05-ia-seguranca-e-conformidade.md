# IA, segurança e conformidade

Produto voltado a **menores** exige cuidado redobrado: conteúdo, privacidade e expectativas pedagógicas. Este documento orienta implementação e revisão contínua. **Não substitui assessoria jurídica.**

---

## 1. Persona pedagógica da IA (diretrizes)

Objetivo: soar como **professor participativo**, não como substituto absoluto da escola.

**Comportamentos desejados:**

- Perguntar o que o aluno já tentou e qual série/módulo está estudando (quando relevante).
- Explicar em passos; usar exemplos e analogias adequadas à idade quando o perfil indicar faixa etária.
- Para exercícios: priorizar **orientar o raciocínio**; se o aluno insistir só na resposta final, ainda assim reforçar o método brevemente.
- Encerrar com uma pergunta de verificação (“Consegue resolver um parecido?”) quando couber.

**Comportamentos a evitar:**

- Tom condescendente excessivo ou infantilização de adolescentes mais velhos.
- Garantir nota ou aprovação (“vai tirar 10”).
- Inventar citações, páginas de livro ou políticas escolares específicas sem fonte.

**Texto curto sugerido na UI (adaptar com jurídico):**

> Esta conversa usa inteligência artificial. As respostas podem conter erros. Sempre confira com seu material de aula e com seus professores.

---

## 2. Versionamento de prompts

- Armazenar identificador `prompt_version` por conversa.
- Alterações de prompt devem passar por checklist: regressão de segurança + amostra de qualidade pedagógica.
- Manter changelog interno de prompts (pode ser seção no final deste arquivo ou repositório privado).

---

## 3. Moderação e políticas de conteúdo

**Camadas recomendadas:**

1. **Lista e heurísticas:** bloquear pedidos claros de violência, autolesão, conteúdo sexual envolvendo menores, ilegalidades, etc.
2. **Classificador / API de moderação** do provedor de LLM quando disponível.
3. **Revisão humana amostral** em fases iniciais do produto.

**Saída do modelo:**

- Rodar moderação na resposta antes de exibir (ou em paralelo com streaming truncado — decisão técnica com trade-off de UX).

**Registro:**

- Guardar apenas o necessário para auditoria (códigos de violação, timestamp), evitando duplicar conteúdo sensível.

---

## 4. Privacidade e menores (LGPD — visão de produto)

Princípios:

- **Minimização:** não pedir dados que não servem ao produto.
- **Transparência:** política de privacidade clara, em linguagem acessível; versão para responsáveis.
- **Bases legais e consentimento:** definir com jurídico quem consente (responsável) e como.
- **Direitos do titular:** acesso, correção, exclusão — fluxos na conta ou por canal de suporte.

**Retenção:**

- Definir prazo de retenção de conversas; anonimizar ou apagar após o prazo, salvo obrigação legal.

**Transferência internacional:**

- Se o LLM processar dados fora do Brasil, documentar e refletir na política (cláusulas contratuais padrão, DPA com provedor, etc.).

**Perfil declarado e inferências (roadmap):** quando existir **cadastro pedagógico** (dificuldades, objectivos, interesses), tratar como dado pessoal com finalidade explícita na política. **Scores ou níveis de progresso** calculados a partir dos chats são **inferências**; a experiência deve **não apresentar** o score como avaliação escolar oficial, permitir **correção ou contextualização** pelo aluno/responsável, e evitar decisões automáticas de alto impacto (ex.: exclusão de funcionalidades) só com base no modelo sem revisão humana ou regra de produto clara.

---

## 5. Segurança da aplicação

- Autenticação forte; sessões com expiração; proteção CSRF conforme stack.
- Rate limit por usuário e IP na rota de chat.
- Sanitização de HTML se rich text for permitido no futuro.
- Dependências atualizadas; varredura de vulnerabilidades na CI.

---

## 6. Testes recomendados (exemplos de cenários)

Criar conjunto interno (não publicar dados reais de crianças):

- Aluno pede ajuda em frações — resposta pedagógica adequada.
- Aluno pede “só a resposta” de problema — modelo ainda ensina o caminho.
- Pedidos de conteúdo proibido — bloqueio + mensagem segura.
- Perguntas de saúde mental grave — resposta com recursos de ajuda humanizada (texto validado por especialista).

---

## 7. Changelog de prompts (template)

| Versão | Data | Autor | Mudança resumida |
|--------|------|-------|------------------|
| *ex.: v0.1* | — | — | Prompt inicial professor participativo |

*(Preencher quando existir código.)*
