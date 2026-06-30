@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title ERP PRO Mebel — Dev Server

echo ============================================
echo   ERP ПРО Мебель — запуск dev-окружения
echo ============================================
echo.

:: ── Параметры ──────────────────────────────────────────
set PG_BIN=D:\CLAUDE\tools\pgsql\bin
set PG_DATA=D:\CLAUDE\tools\pgdata
set PG_LOG=D:\CLAUDE\tools\pg.log
set APP_DIR=%~dp0apps\web
set PORT=3000

cd /d "%APP_DIR%"

:: ── 1. PostgreSQL ──────────────────────────────────────
echo [1/3] PostgreSQL...
"%PG_BIN%\pg_ctl.exe" -D "%PG_DATA%" status >nul 2>&1
if %errorlevel% neq 0 (
    echo   Запускаю PostgreSQL...
    "%PG_BIN%\pg_ctl.exe" -D "%PG_DATA%" -l "%PG_LOG%" -W start
    if %errorlevel% neq 0 (
        echo   [ОШИБКА] Не удалось запустить PostgreSQL
        pause
        exit /b 1
    )
    echo   PostgreSQL запущен.
) else (
    echo   PostgreSQL уже работает.
)

:: ── 2. Prisma (генерация + миграции) ──────────────────
echo [2/3] Prisma...
echo   Генерация клиента...
call npx prisma generate >nul 2>&1
if %errorlevel% neq 0 (
    echo   [ОШИБКА] prisma generate failed
    pause
    exit /b 1
)
echo   Проверка миграций...
call npx prisma migrate status >nul 2>&1
if %errorlevel% neq 0 (
    echo   Применяю миграции...
    call npx prisma migrate deploy >nul 2>&1
    if %errorlevel% neq 0 (
        echo   [ОШИБКА] migrate deploy failed
        pause
        exit /b 1
    )
    echo   Миграции применены.
) else (
    echo   Схема актуальна.
)

:: ── 3. Next.js dev server ──────────────────────────────
echo [3/3] Next.js (webpack) — порт %PORT%...
echo   Очистка кэша .next...
if exist "%APP_DIR%\.next" rmdir /s /q "%APP_DIR%\.next" >nul 2>&1
echo.
echo ============================================
echo   Готово! Открой http://localhost:%PORT%
echo   Логин: admin@local / admin123
echo   Остановка: Ctrl+C
echo ============================================
echo.
call npx next dev --webpack -p %PORT%
