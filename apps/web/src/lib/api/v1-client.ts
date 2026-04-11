/**
 * Cliente HTTP do browser para o BFF `/api/v1`.
 * Centraliza prefixo e headers de desenvolvimento.
 */

const JSON_HEADERS = { "Content-Type": "application/json" } as const;

function apiUrl(path: string) {
  if (path.startsWith("/")) return `/api/v1${path}`;
  return `/api/v1/${path}`;
}

export async function fetchConversations(init?: RequestInit) {
  const res = await fetch(apiUrl("/conversations"), {
    ...init,
    headers: { ...init?.headers },
  });
  return res;
}

export async function createConversation(body?: { title?: string | null }, init?: RequestInit) {
  return fetch(apiUrl("/conversations"), {
    method: "POST",
    headers: { ...JSON_HEADERS, ...init?.headers },
    body: JSON.stringify(body ?? {}),
    ...init,
  });
}

export async function fetchMessages(conversationId: string, init?: RequestInit) {
  return fetch(apiUrl(`/conversations/${conversationId}/messages`), {
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
    method: "POST",
    headers: { ...JSON_HEADERS, ...init?.headers },
    body: JSON.stringify({ content }),
    ...init,
  });
}
