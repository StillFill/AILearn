import Link from "next/link";

/** Rascunho informativo (P2). Revisão jurídica obrigatória antes de produção com menores — ver `docs/04-estado-do-projeto.md`. */
export default function TermsDraftPage() {
  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-6 text-sm leading-relaxed text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
      <h1 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Termos e privacidade (rascunho)
      </h1>
      <p className="mb-3">
        Este texto é <strong>provisório</strong>. O SmartLearn usa inteligência artificial; as respostas podem
        conter erros. Não substitui professores, escola ou acompanhamento de adultos.
      </p>
      <p className="mb-3">
        Ao criar conta, tratamos os dados necessários para autenticação e melhoria do serviço, conforme evolução
        do produto e legislação aplicável (incl. LGPD no Brasil). Menores devem usar o serviço com envolvimento de
        um responsável, conforme políticas finais aprovadas juridicamente.
      </p>
      <p>
        <Link href="/register" className="font-medium text-zinc-900 underline dark:text-zinc-100">
          ← Voltar ao registo
        </Link>
      </p>
    </article>
  );
}
