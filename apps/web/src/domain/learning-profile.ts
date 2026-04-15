export const SUBJECT_OPTIONS = [
  "Matemática",
  "Português",
  "História",
  "Geografia",
  "Biologia",
  "Química",
  "Física",
  "Inglês",
  "Espanhol",
  "Artes",
  "Filosofia",
  "Sociologia",
  "Programação",
] as const;

export const LEARNING_GOAL_OPTIONS = [
  "Melhorar notas da escola",
  "Reforçar base para provas",
  "Aprender de forma mais leve",
  "Preparar vestibular/ENEM",
  "Explorar novas áreas",
] as const;

export const MIN_SUBJECTS_PER_GROUP = 3;

export type SubjectOption = (typeof SUBJECT_OPTIONS)[number];
export type LearningGoalOption = (typeof LEARNING_GOAL_OPTIONS)[number];

export function normalizeSelectedSubjects(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseLearningGoal(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const goal = value.trim();
  if (!goal) return null;
  return LEARNING_GOAL_OPTIONS.includes(goal as LearningGoalOption) ? goal : null;
}

export function validateSubjectSelections(subjects: string[]): boolean {
  if (subjects.length < MIN_SUBJECTS_PER_GROUP) return false;
  const uniqueCount = new Set(subjects).size;
  if (uniqueCount !== subjects.length) return false;
  return subjects.every((subject) => SUBJECT_OPTIONS.includes(subject as SubjectOption));
}
