# Visão e objetivos

## Problema

Crianças e adolescentes frequentemente precisam de **apoio fora da sala de aula**: tirar dúvidas pontuais, revisar conteúdo e ganhar **confiança** em matérias escolares. Nem sempre há um adulto disponível com tempo e didática adequados. Uma experiência web acessível, com conversa natural e foco pedagógico, pode complementar o estudo — sem substituir escola, família ou professores humanos.

## Público-alvo

- **Primário:** estudantes (aprox. 8–17 anos), com linguagem e UX adaptáveis à faixa etária.
- **Secundário (pagadores / responsáveis):** pais, tutores ou instituições que contratam assinaturas.

## Proposta de valor

1. **Chat com “voz de professor”:** explicações passo a passo, exemplos, analogias adequadas à idade, encorajamento e checagem de entendimento.
2. **Reforço sob demanda:** o aluno escolhe o tema ou matéria (dentro do que o produto oferecer no MVP).
3. **Assinatura:** acesso contínuo, histórico e (futuro) recursos premium.
4. **Extensão futura:** cursinho, cursos específicos, trilhas — mantendo a **IA conversacional** como núcleo da experiência de aprendizado.

## Escopo do MVP (mínimo viável)

Incluir no primeiro produto utilizável:

- Autenticação de usuário (conta do aluno; vínculo com responsável quando aplicável).
- Interface de chat responsiva (web).
- Integração com um provedor de modelo de linguagem (LLM), com **system prompt** e políticas pedagógicas e de segurança definidas.
- Limite de uso coerente com custo (por plano).
- Registro básico de conversas para continuidade da sessão e suporte (com retenção e consentimento alinhados à lei).

Fora do MVP inicial (planejar, não implementar de uma vez):

- Marketplace de “cursos” completos.
- Tutoria humana em tempo real.
- Apps nativos (priorizar web primeiro, salvo decisão contrária documentada em `04-estado-do-projeto.md`).

## Princípios de produto

- **Pedagogia primeiro:** a IA orienta o raciocínio; evita “só a resposta final” em exercícios quando o objetivo é aprender o método.
- **Transparência:** deixar claro que a resposta vem de uma IA e pode errar; incentivar verificação com material escolar e professores.
- **Segurança e bem-estar:** moderação de conteúdo, bloqueio de temas inadequados, canal para denúncia (futuro) e conformidade com proteção de dados de menores.

## Mensuração de sucesso (indicativos)

- Retenção de assinantes e uso semanal de chat.
- Satisfação declarada (NPS ou pesquisa simples) de responsáveis e alunos.
- Redução de incidentes de segurança / conteúdo inadequado (meta operacional).

## Glossário

- **MVP:** primeira versão paga ou beta fechado com valor claro e limites definidos.
- **LLM:** modelo de linguagem grande usado na conversa.
- **System prompt:** instruções fixas ao modelo que definem persona, limites e estilo pedagógico.
