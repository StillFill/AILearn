/**
 * Escolhe uma `SpeechSynthesisVoice` para português, preferindo nomes que
 * sugiram voz feminina (a API não expõe género; usamos heurísticas no `name`).
 */
const FEMALE_NAME_HINTS = [
  "female",
  "feminina",
  "woman",
  "mulher",
  "maria",
  "heloisa",
  "heloísa",
  "francisca",
  "luciana",
  "fernanda",
  "vitória",
  "vitoria",
  "camila",
  "isabela",
  "raquel",
  "zira",
  "ines",
  "inês",
  "eduarda",
  "letícia",
  "leticia",
  "natalia",
  "patricia",
];

const MALE_NAME_HINTS = [
  "male",
  "masculino",
  "man",
  "homem",
  "daniel",
  "antonio",
  "antônio",
  "joao",
  "joão",
  "paulo",
  "tiago",
  "eduardo",
  "carlos",
  "ricardo",
  "marcos",
  "felipe",
];

function scoreVoice(v: SpeechSynthesisVoice): number {
  const label = `${v.name} ${v.voiceURI}`.toLowerCase();
  const lang = (v.lang || "").toLowerCase().replaceAll("_", "-");

  let score = 0;
  if (lang.startsWith("pt-br")) score += 120;
  else if (lang.startsWith("pt")) score += 70;

  for (const h of FEMALE_NAME_HINTS) {
    if (label.includes(h)) score += 35;
  }
  for (const h of MALE_NAME_HINTS) {
    if (label.includes(h)) score -= 150;
  }
  if (v.localService) score += 8;

  return score;
}

export function pickPreferredPortugueseVoice(
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | undefined {
  if (voices.length === 0) return undefined;

  const pt = voices.filter((v) => {
    const lang = (v.lang || "").toLowerCase().replaceAll("_", "-");
    return lang.startsWith("pt");
  });
  const pool = pt.length > 0 ? pt : voices;

  let best: SpeechSynthesisVoice | undefined;
  let bestScore = -Infinity;
  for (const v of pool) {
    const s = scoreVoice(v);
    if (s > bestScore) {
      bestScore = s;
      best = v;
    }
  }
  return best;
}

/** Velocidade da fala: >1 acelera (máx. prático ~1.35 para ainda soar natural). */
export const SPEECH_SYNTHESIS_RATE = 3;
