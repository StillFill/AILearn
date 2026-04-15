"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  LEARNING_GOAL_OPTIONS,
  MIN_SUBJECTS_PER_GROUP,
  SUBJECT_OPTIONS,
  type LearningGoalOption,
  type SubjectOption,
} from "@/domain/learning-profile";

type Role = "STUDENT" | "GUARDIAN";

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("STUDENT");
  const [affinitySubjects, setAffinitySubjects] = useState<SubjectOption[]>([]);
  const [difficultySubjects, setDifficultySubjects] = useState<SubjectOption[]>([]);
  const [learningGoal, setLearningGoal] = useState<LearningGoalOption | "">("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function toggleSubject(
    subject: SubjectOption,
    selected: SubjectOption[],
    setter: (subjects: SubjectOption[]) => void,
  ) {
    if (selected.includes(subject)) {
      setter(selected.filter((item) => item !== subject));
      return;
    }
    setter([...selected, subject]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!acceptTerms) {
      setError("Tem de aceitar os termos para continuar.");
      return;
    }
    if (affinitySubjects.length < MIN_SUBJECTS_PER_GROUP) {
      setError(`Selecione pelo menos ${MIN_SUBJECTS_PER_GROUP} matérias em que você tem afinidade.`);
      return;
    }
    if (difficultySubjects.length < MIN_SUBJECTS_PER_GROUP) {
      setError(`Selecione pelo menos ${MIN_SUBJECTS_PER_GROUP} matérias em que você tem dificuldade.`);
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          name: name.trim(),
          role,
          affinitySubjects,
          difficultySubjects,
          learningGoal: learningGoal || null,
          acceptTerms: true,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      if (!res.ok) {
        setError(data?.error?.message ?? `Erro ${res.status}`);
        return;
      }
      const sign = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });
      if (sign?.error) {
        setError("Conta criada, mas o login automático falhou. Tente entrar manualmente.");
        return;
      }
      router.push("/chat");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={(ev) => void onSubmit(ev)}
      className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Criar conta</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-zinc-900 underline dark:text-zinc-100">
          Entrar
        </Link>
      </p>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-col gap-1">
        <label htmlFor="reg-name" className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Nome ou alcunha
        </label>
        <input
          id="reg-name"
          name="name"
          type="text"
          autoComplete="name"
          required
          minLength={2}
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="reg-email" className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Email
        </label>
        <input
          id="reg-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="reg-password" className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Senha (mín. 8 caracteres)
        </label>
        <input
          id="reg-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Perfil</span>
        <select
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
        >
          <option value="STUDENT">Estudante (criança / adolescente)</option>
          <option value="GUARDIAN">Responsável / educador</option>
        </select>
      </div>
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Vamos personalizar seu estudo
        </p>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
          Selecione ao menos {MIN_SUBJECTS_PER_GROUP} matérias em cada grupo.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Matérias com mais afinidade ({affinitySubjects.length}/{MIN_SUBJECTS_PER_GROUP}+)
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SUBJECT_OPTIONS.map((subject) => {
            const selected = affinitySubjects.includes(subject);
            return (
              <button
                key={`affinity-${subject}`}
                type="button"
                onClick={() => toggleSubject(subject, affinitySubjects, setAffinitySubjects)}
                className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                  selected
                    ? "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
                    : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                }`}
                aria-pressed={selected}
              >
                {subject}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Matérias com mais dificuldade ({difficultySubjects.length}/{MIN_SUBJECTS_PER_GROUP}+)
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SUBJECT_OPTIONS.map((subject) => {
            const selected = difficultySubjects.includes(subject);
            return (
              <button
                key={`difficulty-${subject}`}
                type="button"
                onClick={() => toggleSubject(subject, difficultySubjects, setDifficultySubjects)}
                className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                  selected
                    ? "border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200"
                    : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                }`}
                aria-pressed={selected}
              >
                {subject}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="learning-goal" className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Objetivo principal (opcional)
        </label>
        <select
          id="learning-goal"
          value={learningGoal}
          onChange={(e) => setLearningGoal(e.target.value as LearningGoalOption | "")}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
        >
          <option value="">Selecione um objetivo</option>
          {LEARNING_GOAL_OPTIONS.map((goal) => (
            <option key={goal} value={goal}>
              {goal}
            </option>
          ))}
        </select>
      </div>
      <label className="flex cursor-pointer items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          checked={acceptTerms}
          onChange={(e) => setAcceptTerms(e.target.checked)}
          className="mt-1"
        />
        <span>
          Li e aceito os{" "}
          <Link href="/terms" className="underline">
            termos e avisos de privacidade (rascunho)
          </Link>
          . Se for menor, o responsável deve aceitar em nome seu.
        </span>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-md bg-zinc-900 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "A criar…" : "Criar conta"}
      </button>
    </form>
  );
}
