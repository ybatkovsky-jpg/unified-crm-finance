-- Инициализация БД PostgreSQL
-- Создание пользователей с разными правами (см. ADR-02)

-- Основной пользователь для Next.js (полные права на схему public)
-- Этот пользователь создаётся через POSTGRES_USER/POSTGRES_PASSWORD в docker-compose,
-- здесь — только дополнительный с ограниченными правами для Python-воркера.

-- Worker user с ограниченными правами на чтение/запись только нужных таблиц
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'worker') THEN
    CREATE ROLE worker WITH LOGIN PASSWORD 'worker_password';
  END IF;
END$$;

-- Права: worker может читать все таблицы в public и писать только в указанные
GRANT USAGE ON SCHEMA public TO worker;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO worker;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO worker;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO worker;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO worker;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT INSERT, UPDATE, DELETE ON TABLES TO worker;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO worker;

\echo 'Database initialized: roles unified (full), worker (limited)'
