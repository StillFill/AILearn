# Negócio e assinaturas

---

## Modelo de receita (MVP)

- **Assinatura recorrente** (mensal como padrão; anual opcional com desconto).
- **Um plano simples** no início reduz complexidade operacional; adicionar tiers depois (ex.: família com múltiplos alunos).

---

## Papéis e quem paga

| Papel | Descrição | Pagador típico |
|-------|-----------|----------------|
| Aluno | Usa o chat, vê histórico próprio | — |
| Responsável | Gerencia pagamento e, se aplicável, perfis de filhos | Cartão / método local |
| Admin interno | Suporte, moderação, métricas | N/A |

Fluxo comum: responsável cria conta ou convida aluno; assinatura fica vinculada à “família” ou ao responsável (modelagem a detalhar na implementação).

---

## Limites por plano (exemplo para custeio de IA)

Definir números reais após benchmark de custo por mensagem/token.

| Plano | Mensagens/mês (indicativo) | Outros limites |
|-------|-----------------------------|----------------|
| Grátis / trial | Baixo (ex.: 20) | Sem histórico longo ou sem certos modelos |
| Estudante | Médio | Histórico N dias |
| Família | Alto | Múltiplos perfis aluno |

**Importante:** comunicar limites claramente na UI antes do usuário bater no teto.

---

## Trial

- Opções: 7 dias com cartão obrigatório vs trial sem cartão com limite baixo — decisão de negócio + fraude.
- Registrar escolha em `04-estado-do-projeto.md` quando definida.

---

## Métricas de produto e negócio

- MRR / churn
- Ativação: % que envia primeira mensagem em D1/D7
- Custo por usuário ativo (LLM + infra)
- Conversão trial → pago

---

## Conformidade fiscal (Brasil)

- Nota fiscal, serviços digitais, PIX, etc.: **definir com contador** antes de lançar cobrança ampla.
- Stripe cobre parte do fluxo internacional; combinar com realidade local.

---

## Roadmap de monetização (alinhado ao técnico)

1. Chat funcional sem pagamento (alpha interno).
2. Stripe test mode + plano único.
3. Produção com termos e privacidade aprovados.
4. Novos planos e upsell (família, escolas B2B).
