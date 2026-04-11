import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import { getOwnerUserId } from "@/server/auth-context";
import { createConversation, listConversations } from "@/server/conversation-store";

export async function GET(request: NextRequest) {
  const ownerUserId = getOwnerUserId(request);
  const items = listConversations(ownerUserId);
  return NextResponse.json({ conversations: items });
}

export async function POST(request: NextRequest) {
  const ownerUserId = getOwnerUserId(request);
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

  const conversation = createConversation(ownerUserId, title);
  return NextResponse.json({ conversation }, { status: 201 });
}
