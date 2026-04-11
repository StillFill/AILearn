import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import { requireSessionUserId } from "@/server/auth-context";
import { createConversation, listConversations } from "@/server/conversation-store";

export async function GET() {
  const ownerUserId = await requireSessionUserId();
  if (!ownerUserId) {
    return jsonError(401, "unauthorized", "Sessão necessária.");
  }
  const items = await listConversations(ownerUserId);
  return NextResponse.json({ conversations: items });
}

export async function POST(request: NextRequest) {
  const ownerUserId = await requireSessionUserId();
  if (!ownerUserId) {
    return jsonError(401, "unauthorized", "Sessão necessária.");
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "invalid_json", "Corpo JSON inválido");
  }
  const title =
    typeof body === "object" &&
    body !== null &&
    "title" in body &&
    typeof (body as { title: unknown }).title === "string"
      ? (body as { title: string }).title
      : null;

  const conversation = await createConversation(ownerUserId, title);
  return NextResponse.json({ conversation }, { status: 201 });
}
