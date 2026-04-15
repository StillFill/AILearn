import type { LearningSession } from "@/domain/study";

const SUBJECT_KEYWORDS: Record<string, string[]> = {
  matemática: ["matemática", "matematica", "equação", "equacao", "logaritmo", "álgebra", "algebra"],
  português: ["português", "portugues", "gramática", "gramatica", "redação", "redacao", "interpretação"],
  historia: ["história", "historia", "canudos", "revolução", "império", "imperio", "república", "republica"],
  geografia: ["geografia", "clima", "relevo", "território", "territorio", "cartografia"],
  biologia: ["biologia", "célula", "celula", "genética", "genetica", "ecologia"],
  química: ["química", "quimica", "mol", "estequiometria", "reação", "reacao"],
  física: ["física", "fisica", "força", "forca", "movimento", "energia", "cinemática", "cinematica"],
  inglês: ["inglês", "ingles", "grammar", "vocabulary", "verb", "reading"],
};

const NEUTRAL_MESSAGE_PATTERNS: RegExp[] = [
  /^(oi|ola|olá|hey|eai|e aí|bom dia|boa tarde|boa noite)[!. ]*$/i,
  /^(ok|blz|beleza|entendi|obrigado|obrigada|valeu|certo|show|segue|continue)[!. ]*$/i,
  /^(pode continuar|vamos continuar|me ajuda|quero aprender|pode me explicar)[!. ]*$/i,
];

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isNeutralMessage(text: string): boolean {
  const normalized = normalize(text).trim();
  if (!normalized) return true;
  if (normalized.length <= 3) return true;
  return NEUTRAL_MESSAGE_PATTERNS.some((pattern) => pattern.test(normalized));
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(/[^a-z0-9]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length >= 4);
}

export function isMessageWithinSessionTheme(input: {
  session: LearningSession;
  userContent: string;
}): boolean {
  if (isNeutralMessage(input.userContent)) {
    return true;
  }

  const userNorm = normalize(input.userContent);
  const subjectNorm = normalize(input.session.subject);
  const topicNorm = normalize(input.session.topic);
  const difficultyNorm = normalize(input.session.declaredDifficulty);

  const directHints = [subjectNorm, topicNorm, difficultyNorm].filter((item) => item.length > 0);
  if (directHints.some((hint) => userNorm.includes(hint))) {
    return true;
  }

  const subjectKeywords = SUBJECT_KEYWORDS[subjectNorm] ?? [];
  if (subjectKeywords.some((keyword) => userNorm.includes(normalize(keyword)))) {
    return true;
  }

  const topicTokens = new Set(tokenize(`${input.session.topic} ${input.session.declaredDifficulty}`));
  if (topicTokens.size > 0) {
    const overlap = tokenize(input.userContent).filter((token) => topicTokens.has(token)).length;
    if (overlap >= 1) return true;
  }

  return false;
}

export interface SessionTopicDecision {
  onTopic: boolean;
  confidence: number;
  reason: string;
  source: "heuristic" | "openai";
}

function heuristicDecision(input: {
  session: LearningSession;
  userContent: string;
}): SessionTopicDecision {
  if (isNeutralMessage(input.userContent)) {
    return {
      onTopic: true,
      confidence: 0.98,
      reason: "Mensagem neutra/de continuidade.",
      source: "heuristic",
    };
  }

  const userNorm = normalize(input.userContent);
  const subjectNorm = normalize(input.session.subject);
  const topicNorm = normalize(input.session.topic);
  const difficultyNorm = normalize(input.session.declaredDifficulty);
  const directHints = [subjectNorm, topicNorm, difficultyNorm].filter((item) => item.length > 0);

  if (directHints.some((hint) => userNorm.includes(hint))) {
    return {
      onTopic: true,
      confidence: 0.93,
      reason: "A mensagem menciona matéria/tópico/dificuldade da sessão.",
      source: "heuristic",
    };
  }

  const subjectKeywords = SUBJECT_KEYWORDS[subjectNorm] ?? [];
  if (subjectKeywords.some((keyword) => userNorm.includes(normalize(keyword)))) {
    return {
      onTopic: true,
      confidence: 0.82,
      reason: "A mensagem contém palavras-chave da matéria.",
      source: "heuristic",
    };
  }

  const topicTokens = new Set(tokenize(`${input.session.topic} ${input.session.declaredDifficulty}`));
  if (topicTokens.size > 0) {
    const overlap = tokenize(input.userContent).filter((token) => topicTokens.has(token)).length;
    if (overlap >= 1) {
      return {
        onTopic: true,
        confidence: 0.78,
        reason: "Há sobreposição com tokens do tópico da sessão.",
        source: "heuristic",
      };
    }
  }

  return {
    onTopic: false,
    confidence: 0.55,
    reason: "Sem sinais claros de aderência ao tema da sessão.",
    source: "heuristic",
  };
}

async function openAiDecision(input: {
  session: LearningSession;
  userContent: string;
}): Promise<SessionTopicDecision | null> {
  if (!process.env.OPENAI_API_KEY?.trim()) return null;
  const model = process.env.OPENAI_CHAT_MODEL?.trim() || "gpt-4o-mini";
  const payload = {
    subject: input.session.subject,
    topic: input.session.topic,
    goal: input.session.goal,
    studentMessage: input.userContent,
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "topic_guard_decision",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              onTopic: { type: "boolean" },
              confidence: { type: "number" },
              reason: { type: "string" },
            },
            required: ["onTopic", "confidence", "reason"],
          },
        },
      },
      messages: [
        {
          role: "system",
          content:
            "Classifique se a mensagem do aluno está dentro do tema da sessão de estudo. Mensagens de saudação ou continuidade devem ser consideradas dentro do tema. Responda apenas com JSON.",
        },
        { role: "user", content: JSON.stringify(payload) },
      ],
    }),
  });

  if (!response.ok) return null;
  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { onTopic: boolean; confidence: number; reason: string };
    return {
      onTopic: parsed.onTopic,
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence ?? 0.5))),
      reason: parsed.reason || "Sem justificativa.",
      source: "openai",
    };
  } catch {
    return null;
  }
}

export async function classifySessionTopicMatch(input: {
  session: LearningSession;
  userContent: string;
}): Promise<SessionTopicDecision> {
  const heuristic = heuristicDecision(input);

  // Economia: quando já há forte sinal por heurística, evita chamada ao LLM classificador.
  if (heuristic.onTopic && heuristic.confidence >= 0.8) {
    return heuristic;
  }
  if (!heuristic.onTopic && heuristic.confidence <= 0.35) {
    return heuristic;
  }

  const ai = await openAiDecision(input);
  return ai ?? heuristic;
}
