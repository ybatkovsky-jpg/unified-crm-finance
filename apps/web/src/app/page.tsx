import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      <div className="text-center space-y-4 max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight">
          Unified CRM Finance
        </h1>
        <p className="text-lg text-slate-600">
          Единая CRM-система: контакты, сделки, договоры, проекты, закупки и
          управленческий учёт.
        </p>
        <p className="text-sm text-slate-500">
          Статус: S1 — Архитектура и модель данных (скелет монорепо)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
        <Card
          title="Спецификация"
          description="19 разделов + 2 ADR + roadmap на 6 месяцев"
          href="https://github.com/ybatkovsky-jpg/unified-crm-finance/tree/main/docs"
        />
        <Card
          title="Health check"
          description="Проверка доступности API"
          href="/api/health"
        />
        <Card
          title="Prisma Studio"
          description="GUI для БД (запуск: npm run db:studio)"
          href="#"
        />
        <Card
          title="API Docs (S2+)"
          description="OpenAPI спецификация будет здесь"
          href="#"
        />
      </div>

      <footer className="text-xs text-slate-400 mt-8">
        v0.1.0 · Build {new Date().toISOString().slice(0, 10)}
      </footer>
    </main>
  );
}

function Card({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block p-6 rounded-lg border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all"
    >
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-sm text-slate-600">{description}</p>
    </Link>
  );
}
