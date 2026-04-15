import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ProfileRole } from "@prisma/client";
import { jsonError } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";
import {
  normalizeSelectedSubjects,
  parseLearningGoal,
  validateSubjectSelections,
} from "@/domain/learning-profile";
import { checkRateLimit, getClientIp, rateLimitKey } from "@/server/rate-limit";

function registerLimit(): { max: number; windowMs: number } {
  const max = Number(process.env.RATE_LIMIT_REGISTER_PER_WINDOW ?? 10);
  const windowMs = Number(process.env.RATE_LIMIT_REGISTER_WINDOW_MS ?? 900_000);
  return {
    max: Number.isFinite(max) && max > 0 ? max : 10,
    windowMs: Number.isFinite(windowMs) && windowMs > 0 ? windowMs : 900_000,
  };
}

export async function POST(request: NextRequest) {
  const { max, windowMs } = registerLimit();
  const ip = getClientIp(request);
  if (!checkRateLimit(rateLimitKey("register", ip), max, windowMs)) {
    return jsonError(
      429,
      "rate_limited",
      "Muitas tentativas de registo a partir desta rede. Tenta mais tarde.",
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "invalid_json", "Corpo JSON inválido");
  }

  if (typeof body !== "object" || body === null) {
    return jsonError(400, "validation_error", "Corpo inválido");
  }

  const b = body as Record<string, unknown>;
  const email = typeof b.email === "string" ? b.email.toLowerCase().trim() : "";
  const password = typeof b.password === "string" ? b.password : "";
  const name = typeof b.name === "string" ? b.name.trim() : "";
  const roleRaw = b.role;
  const acceptTerms = b.acceptTerms === true;
  const affinitySubjects = normalizeSelectedSubjects(b.affinitySubjects);
  const difficultySubjects = normalizeSelectedSubjects(b.difficultySubjects);
  const learningGoal = parseLearningGoal(b.learningGoal);

  if (!acceptTerms) {
    return jsonError(400, "terms_required", "É necessário aceitar os termos para criar conta.");
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonError(400, "validation_error", "Email inválido.");
  }

  if (password.length < 8) {
    return jsonError(400, "validation_error", "A senha deve ter pelo menos 8 caracteres.");
  }

  if (name.length < 2 || name.length > 120) {
    return jsonError(400, "validation_error", "Nome deve ter entre 2 e 120 caracteres.");
  }

  const role =
    roleRaw === ProfileRole.STUDENT || roleRaw === ProfileRole.GUARDIAN
      ? roleRaw
      : null;
  if (!role) {
    return jsonError(400, "validation_error", "Perfil inválido (use STUDENT ou GUARDIAN).");
  }

  if (!validateSubjectSelections(affinitySubjects)) {
    return jsonError(
      400,
      "validation_error",
      "Selecione pelo menos 3 matérias diferentes em que você tem afinidade.",
    );
  }

  if (!validateSubjectSelections(difficultySubjects)) {
    return jsonError(
      400,
      "validation_error",
      "Selecione pelo menos 3 matérias diferentes em que você tem dificuldade.",
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return jsonError(409, "email_taken", "Este email já está registado.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const termsAcceptedAt = new Date();

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role,
      affinitySubjects,
      difficultySubjects,
      learningGoal,
      termsAcceptedAt,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      affinitySubjects: true,
      difficultySubjects: true,
      learningGoal: true,
      termsAcceptedAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ user }, { status: 201 });
}
