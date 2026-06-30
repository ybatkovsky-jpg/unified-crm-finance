#!/usr/bin/env bash
# ERP ПРО Мебель — быстрый запуск dev-окружения (Git Bash / WSL)
set -e

PG_BIN="D:/CLAUDE/tools/pgsql/bin"
PG_DATA="D:/CLAUDE/tools/pgdata"
PG_LOG="D:/CLAUDE/tools/pg.log"
APP_DIR="$(dirname "$0")/apps/web"
PORT="${PORT:-3000}"

echo "============================================"
echo "  ERP ПРО Мебель — запуск dev-окружения"
echo "============================================"
echo ""

cd "$APP_DIR"

# ── 1. PostgreSQL ──────────────────────────────────────
echo "[1/3] PostgreSQL..."
if "$PG_BIN/pg_ctl.exe" -D "$PG_DATA" status >/dev/null 2>&1; then
  echo "  PostgreSQL уже работает."
else
  echo "  Запускаю PostgreSQL..."
  "$PG_BIN/pg_ctl.exe" -D "$PG_DATA" -l "$PG_LOG" -W start
  echo "  PostgreSQL запущен."
fi

# ── 2. Prisma ──────────────────────────────────────────
echo "[2/3] Prisma..."
npx prisma generate >/dev/null 2>&1
echo "  Клиент сгенерирован."

if ! npx prisma migrate status >/dev/null 2>&1; then
  echo "  Применяю миграции..."
  npx prisma migrate deploy >/dev/null 2>&1
  echo "  Миграции применены."
else
  echo "  Схема актуальна."
fi

# ── 3. Next.js ─────────────────────────────────────────
echo "[3/3] Next.js (Turbopack) — порт $PORT..."
echo "  Очистка кэша .next..."
rm -rf "$APP_DIR/.next" 2>/dev/null
echo ""
echo "============================================"
echo "  Готово! Открой http://localhost:$PORT"
echo "  Логин: admin@local / admin123"
echo "  Остановка: Ctrl+C"
echo "============================================"
echo ""

TURBOPACK_WORKERS=1 npx next dev -p "$PORT"
