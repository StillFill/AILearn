export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 px-4 py-8 dark:bg-zinc-950 md:px-6 md:py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-1 items-start justify-center lg:items-center">
        <div className="w-full max-w-3xl">{children}</div>
      </div>
    </div>
  );
}
