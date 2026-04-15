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

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
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
