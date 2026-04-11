import { auth } from "@/auth";

/**
 * ID do utilizador autenticado (sessão JWT).
 * Em rotas API, devolver 401 se for `null`.
 */
export async function requireSessionUserId(): Promise<string | null> {
  const session = await auth();
  const id = session?.user?.id;
  return typeof id === "string" && id.length > 0 ? id : null;
}
