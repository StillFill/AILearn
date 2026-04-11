import type { NextRequest } from "next/server";

/**
 * Extrai o "usuário atual" para o BFF.
 * TODO (P2): substituir por sessão real (cookie/JWT).
 */
const DEV_USER_HEADER = "x-smartlearn-user";
export const DEFAULT_DEV_USER_ID = "dev-user";

export function getOwnerUserId(request: NextRequest): string {
  const fromHeader = request.headers.get(DEV_USER_HEADER)?.trim();
  if (fromHeader) return fromHeader;
  return DEFAULT_DEV_USER_ID;
}
