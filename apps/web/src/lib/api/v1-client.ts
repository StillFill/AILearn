/**
 * Cliente HTTP do browser para o BFF `/api/v1`.
 * Centraliza prefixo e headers de desenvolvimento.
 */

const JSON_HEADERS = { "Content-Type": "application/json" } as const;

function apiUrl(path: string) {
  if (path.startsWith("/")) return `/api/v1${path}`;
  return `/api/v1/${path}`;
}

const defaultInit: RequestInit = { credentials: "include" };

export async function fetchConversations(init?: RequestInit) {
  const res = await fetch(apiUrl("/conversations"), {
    ...defaultInit,
    ...init,
    headers: { ...init?.headers },
  });
  return res;
}

export async function createConversation(
  body?: { title?: string | null; learningSessionId?: string | null },
  init?: RequestInit,
) {
  return fetch(apiUrl("/conversations"), {
    ...defaultInit,
    method: "POST",
    headers: { ...JSON_HEADERS, ...init?.headers },
    body: JSON.stringify(body ?? {}),
    ...init,
  });
}

export async function fetchMessages(conversationId: string, init?: RequestInit) {
  return fetch(apiUrl(`/conversations/${conversationId}/messages`), {
    ...defaultInit,
    ...init,
    headers: { ...init?.headers },
  });
}

export async function sendUserMessage(
  conversationId: string,
  content: string,
  init?: RequestInit,
) {
  return fetch(apiUrl(`/conversations/${conversationId}/messages`), {
    ...defaultInit,
    method: "POST",
    headers: { ...JSON_HEADERS, ...init?.headers },
    body: JSON.stringify({ content }),
    ...init,
  });
}

/** Estado do TTS OpenAI no BFF (requer sessão). */
export async function fetchTtsStatus(init?: RequestInit) {
  return fetch(apiUrl("/tts/status"), {
    ...defaultInit,
    ...init,
    headers: { ...init?.headers },
  });
}

/** Áudio MP3; só funciona quando `openaiTtsEnabled` no status é true. */
export async function postTtsSpeech(text: string, init?: RequestInit) {
  return fetch(apiUrl("/tts"), {
    ...defaultInit,
    method: "POST",
    headers: { ...JSON_HEADERS, ...init?.headers },
    body: JSON.stringify({ text }),
    ...init,
  });
}

export async function fetchStudySessionState(init?: RequestInit) {
  return fetch(apiUrl("/study-sessions"), {
    ...defaultInit,
    ...init,
    headers: { ...init?.headers },
  });
}

export async function startStudySession(
  body: {
    subject: string;
    topic: string;
    declaredDifficulty: string;
    goal: string;
  },
  init?: RequestInit,
) {
  return fetch(apiUrl("/study-sessions"), {
    ...defaultInit,
    method: "POST",
    headers: { ...JSON_HEADERS, ...init?.headers },
    body: JSON.stringify(body),
    ...init,
  });
}
