import type { LearningSession } from "@/domain/study";

/**
 * Mensagens em que não devemos registar “dificuldade”: entendimento explícito, pedido neutro de exemplo,
 * ou raciocínio correto sobre o tema (ex.: logaritmos) sem negação.
 * Se o aluno mistura entendimento com dúvida explícita (“ainda não sei”), não suprimir.
 */
function messageLooksLikeUnderstandingOrNeutralRequest(userContent: string): boolean {
  const u = userContent.trim().toLowerCase();
  if (u.length === 0) return true;

  const explicitDifficulty = new RegExp(
    [
      "não entendo",
      "nao entendo",
      "não sei",
      "nao sei",
      "ainda não",
      "ainda nao",
      "não consigo",
      "nao consigo",
      "travad",
      "me confundo",
      "estou confuso",
      "está errado",
      "esta errado",
      "errei",
      "não bate",
      "nao bate",
      "não faz sentido",
      "nao faz sentido",
      "difícil demais",
      "dificil demais",
      "não entendi",
      "nao entendi",
    ].join("|"),
    "i",
  );
  const explicitButStillStuck = /(mas|porém|porem)\s+(não|nao|ainda)/i;
  if (explicitDifficulty.test(u) || explicitButStillStuck.test(u)) {
    return false;
  }

  const understood =
    /\b(ah )?entendi\b|compreendi|faz sentido|agora sim|agora ficou|era isso|claro[, ]|perfeito|show[, ]|obrigad|valeu/i;
  const wantMoreExamples = new RegExp(
    [
      "mais um exemplo",
      "outro exemplo",
      "mais exemplo",
      "quero (um |outro )?exemplo",
      "pode (dar |mostrar )?(mais |outro )?exemplo",
      "tem (mais |outro )?exemplo",
    ].join("|"),
    "i",
  );

  /** Aluno explica o raciocínio (ex.: potências de 10 e log) sem pedir socorro. */
  const logOrPowerReasoning =
    /(log|logaritm)/i.test(u) &&
    /(\d+\s*vezes|multiplic|vezes o 10|vezes o 10|\b10\b\s*[\*x×]\s*\b10\b|1000|\^3|\b10\b.*\b3\b)/i.test(u);

  const arithmeticSelfExplanation =
    u.length >= 20 &&
    /(então|porque|pois|daí|dai|logo|multiplic|vezes|\*|1000|\b100\b)/i.test(u) &&
    /\b(10|100|1000|2|3)\b/.test(u);

  if (understood.test(u)) return true;
  if (wantMoreExamples.test(u)) return true;
  if (logOrPowerReasoning) return true;
  if (arithmeticSelfExplanation && /(entendi|log|10|100|multiplic)/i.test(u)) return true;

  return false;
}

/** Rejeita sinais da IA que descrevem “falta de compreensão” quando a mensagem mostra o contrário. */
function aiPainPointContradictsMessage(painPoint: string, userContent: string): boolean {
  const p = painPoint.toLowerCase();
  const u = userContent.toLowerCase();
  const claimsGap =
    /(não compreende|nao compreende|não demonstra|nao demonstra|falta.*compreensão|lacuna|sem compreensão|incompleta|não sabe aplicar|nao sabe aplicar|confusão sobre a definição)/i.test(
      p,
    );
  if (!claimsGap) return false;
  if (messageLooksLikeUnderstandingOrNeutralRequest(userContent)) return true;
  if (/(entendi|multiplic|vezes|1000|100\b|log|10\s*\*)/i.test(u) && u.length > 15) return true;
  return false;
}

/** Só a mensagem do aluno conta: explicações do tutor não devem gerar “dificuldade”. */
function evidenceGroundedInUser(evidence: string, userContent: string): boolean {
  const e = evidence.trim().toLowerCase();
  const u = userContent.trim().toLowerCase();
  if (u.length < 2 || e.length < 2) return false;
  if (u.includes(e.slice(0, Math.min(48, e.length))) || e.includes(u.slice(0, Math.min(48, u.length)))) {
    return true;
  }
  const tokenize = (s: string) =>
    s
      .split(/[^a-z0-9à-ú]+/i)
      .map((t) => t.normalize("NFD").replace(/\p{M}/gu, ""))
      .filter((t) => t.length >= 3);
  const userToks = new Set(tokenize(u));
  if (userToks.size === 0) return false;
  const evToks = tokenize(e);
  const hits = evToks.filter((t) => userToks.has(t)).length;
  return hits >= 2 || (hits >= 1 && userToks.size <= 8);
}

const PAIN_PATTERNS: Array<{ pattern: RegExp; painPoint: string; hint: string }> = [
  {
    pattern: /(não entendo|nao entendo|confuso|me confundo)/i,
    painPoint: "Compreensão de conceito base",
    hint: "Rever definição principal com exemplos simples.",
  },
  {
    pattern: /(erro|errando|errei|sempre erro)/i,
    painPoint: "Erros recorrentes na execução",
    hint: "Treinar exercícios curtos com correção imediata.",
  },
];

export function extractSignalsFromMessage(input: {
  session: LearningSession | null;
  userContent: string;
  assistantContent: string;
}): Array<{
  sessionId?: string | null;
  subject: string;
  topic?: string | null;
  painPoint: string;
  confidence: number;
  evidence?: string | null;
  planHint?: string | null;
}> {
  const session = input.session;
  if (!session) return [];

  const text = input.userContent.trim();
  if (messageLooksLikeUnderstandingOrNeutralRequest(text)) {
    return [];
  }
  const detected: Array<{
    sessionId?: string | null;
    subject: string;
    topic?: string | null;
    painPoint: string;
    confidence: number;
    evidence?: string | null;
    planHint?: string | null;
  }> = [];

  for (const candidate of PAIN_PATTERNS) {
    if (!candidate.pattern.test(text)) continue;
    detected.push({
      sessionId: session.id,
      subject: session.subject,
      topic: session.topic,
      painPoint: candidate.painPoint,
      confidence: 0.72,
      evidence: input.userContent.slice(0, 240),
      planHint: candidate.hint,
    });
  }

  return detected;
}

type AiSignal = {
  painPoint: string;
  topic?: string;
  confidence?: number;
  evidence?: string;
  planHint?: string;
};

async function extractSignalsWithOpenAi(input: {
  session: LearningSession;
  userContent: string;
  assistantContent: string;
}): Promise<AiSignal[]> {
  if (!process.env.OPENAI_API_KEY?.trim()) return [];

  const model = process.env.OPENAI_CHAT_MODEL?.trim() || "gpt-4o-mini";
  const prompt = [
    "Você é um analista pedagógico interno.",
    "Extraia sinais de dificuldade do ALUNO em JSON (campo signals), úteis para um plano de estudo.",
    "Use APENAS a mensagem do aluno (studentMessage) como evidência de dificuldade.",
    "A mensagem do tutor (tutorMessage) é só contexto do tema: NÃO infira lacunas do aluno só porque o tutor explicou definições, deu exemplos longos ou fez perguntas pedagógicas.",
    "Cada painPoint deve estar claramente sustentado pelo que o aluno escreveu; o campo evidence deve citar ou parafrasear de perto trechos da mensagem do aluno.",
    "NÃO registre dificuldade quando: o aluno explica corretamente o raciocínio (mesmo informal); diz que entendeu (“entendi”, “faz sentido”); pede só mais um exemplo ou exercício para fixar; repete a ideia certa com números (ex.: potências de 10 e log).",
    "NÃO use painPoints genéricos do tipo “não demonstra compreensão completa” ou “não compreende o conceito” se a mensagem mostrar que ele acertou o raciocínio ou pediu continuidade sem dizer que não sabe.",
    "Só sinalize dificuldade quando houver confusão explícita, erro persistente, “não sei / não entendo”, ou crença incorreta afirmada pelo aluno.",
    "Se o aluno só pediu uma explicação inicial, respondeu 'ok', confirmou entendimento ou não há dificuldade explícita, devolva signals: [].",
    "Evite frases genéricas. Se não houver sinais claros na mensagem do aluno, devolva lista vazia.",
  ].join(" ");

  const userPayload = {
    subject: input.session.subject,
    topic: input.session.topic,
    declaredDifficulty: input.session.declaredDifficulty,
    goal: input.session.goal,
    studentMessage: input.userContent,
    tutorMessage: input.assistantContent,
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "learning_signals",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              signals: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                    properties: {
                    painPoint: { type: "string" },
                    topic: { type: "string" },
                    confidence: { type: "number" },
                    evidence: { type: "string" },
                    planHint: { type: "string" },
                  },
                  required: ["painPoint", "confidence", "evidence", "planHint"],
                },
              },
            },
            required: ["signals"],
          },
        },
      },
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: JSON.stringify(userPayload) },
      ],
    }),
  });

  if (!response.ok) return [];
  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as { signals?: AiSignal[] };
    return Array.isArray(parsed.signals) ? parsed.signals : [];
  } catch {
    return [];
  }
}

export async function extractSignalsFromMessageEnhanced(input: {
  session: LearningSession | null;
  userContent: string;
  assistantContent: string;
}): Promise<
  Array<{
    sessionId?: string | null;
    subject: string;
    topic?: string | null;
    painPoint: string;
    confidence: number;
    evidence?: string | null;
    planHint?: string | null;
  }>
> {
  const session = input.session;
  if (!session) return [];

  if (messageLooksLikeUnderstandingOrNeutralRequest(input.userContent)) {
    return [];
  }

  const aiSignals = await extractSignalsWithOpenAi({
    session,
    userContent: input.userContent,
    assistantContent: input.assistantContent,
  });

  if (aiSignals.length > 0) {
    const dedup = new Set<string>();
    const normalized = aiSignals
      .map((signal) => {
        const raw = Number(signal.confidence);
        const confidence = Number.isFinite(raw)
          ? Math.min(0.95, Math.max(0.4, raw))
          : 0.55;
        const evidence = signal.evidence?.trim() ?? "";
        return {
          sessionId: session.id,
          subject: session.subject,
          topic: signal.topic?.trim() || session.topic,
          painPoint: signal.painPoint.trim(),
          confidence,
          evidence: evidence.length > 0 ? evidence : null,
          planHint: signal.planHint?.trim() || `Reforçar ${session.topic} em passos curtos.`,
        };
      })
      .filter((signal) => signal.painPoint.length > 0)
      .filter((signal) => !aiPainPointContradictsMessage(signal.painPoint, input.userContent))
      .filter((signal) => signal.evidence !== null && evidenceGroundedInUser(signal.evidence, input.userContent))
      .filter((signal) => signal.confidence >= 0.58)
      .filter((signal) => {
        const key = `${signal.subject}|${signal.topic}|${signal.painPoint}`.toLowerCase();
        if (dedup.has(key)) return false;
        dedup.add(key);
        return true;
      });
    if (normalized.length > 0) return normalized;
  }

  return extractSignalsFromMessage(input);
}
