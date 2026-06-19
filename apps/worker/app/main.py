"""
FastAPI приложение — точка входа для Python-воркера.

Эндпоинты:
- GET  /internal/health        — health check
- POST /internal/ai/parse-bom  — запуск AI-парсинга BOM (S7)
- POST /internal/ai/verify-invoice — запуск AI-сверки счёта (S8)
- POST /internal/notify        — отправка уведомления (S11)

Все эндпоинты требуют заголовок X-Internal-Secret (см. ADR-02).
Доступ извне /internal/* — только через reverse proxy из docker-сети.
"""
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic_settings import BaseSettings
from pydantic import BaseModel
import os

from app.celery_app import celery_app


class Settings(BaseSettings):
    """Настройки приложения из переменных окружения."""

    internal_secret: str = 'dev_internal_secret'
    database_url_sync: str = ''
    database_url_async: str = ''
    rabbitmq_url: str = ''
    s3_endpoint: str = ''
    s3_access_key: str = ''
    s3_secret_key: str = ''
    s3_bucket: str = 'unified-crm'
    s3_region: str = 'us-east-1'
    s3_force_path_style: bool = True
    app_url: str = 'http://localhost:3000'
    llm_default_model: str = 'deepseek-chat'
    deepseek_api_key: str = ''
    openai_api_key: str = ''
    anthropic_api_key: str = ''

    class Config:
        env_file = '.env'
        # Загружать переменные с lowercase-именами
        case_sensitive = False


settings = Settings()

app = FastAPI(
    title='Unified CRM Finance — Worker',
    description='Python-воркер для AI, email, Telegram и фоновых задач',
    version='0.1.0',
    docs_url='/docs',  # только из docker-сети
    openapi_url='/openapi.json',
)

# CORS: только для web-приложения
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.app_url],
    allow_credentials=True,
    allow_methods=['GET', 'POST'],
    allow_headers=['*'],
)


async def verify_internal_secret(
    x_internal_secret: str = Header(..., alias='X-Internal-Secret'),
):
    """Проверка общего секрета между Next.js и Python (см. ADR-02)."""
    if x_internal_secret != settings.internal_secret:
        raise HTTPException(status_code=401, detail='Invalid internal secret')


@app.get('/internal/health')
async def health():
    """
    Health check — без auth, для Docker healthcheck и мониторинга.
    Проверяет БД, RabbitMQ, S3 (опционально).
    """
    checks = {
        'rabbitmq': bool(settings.rabbitmq_url),
        'database': bool(settings.database_url_async),
        's3': bool(settings.s3_endpoint),
    }
    all_ok = all(checks.values())
    return {
        'status': 'ok' if all_ok else 'degraded',
        'version': '0.1.0',
        'checks': checks,
    }


# === AI-задачи (заглушки — реальная реализация в S7-S8) ===


class ParseBomRequest(BaseModel):
    fileId: str
    projectId: str


@app.post('/internal/ai/parse-bom', dependencies=[Depends(verify_internal_secret)])
async def parse_bom(req: ParseBomRequest):
    """Запуск AI-парсинга Excel-спецификации. Реализация в S7."""
    # TODO(S7): from app.tasks.ai_parse_bom import parse_bom_task
    # task = parse_bom_task.delay(req.fileId, req.projectId)
    return {
        'status': 'not_implemented',
        'message': 'AI BOM parsing will be implemented in S7',
        'fileId': req.fileId,
        'projectId': req.projectId,
    }


class VerifyInvoiceRequest(BaseModel):
    invoiceId: str


@app.post(
    '/internal/ai/verify-invoice',
    dependencies=[Depends(verify_internal_secret)],
)
async def verify_invoice(req: VerifyInvoiceRequest):
    """Запуск AI-сверки счёта. Реализация в S8."""
    # TODO(S8): from app.tasks.ai_verify_invoice import verify_invoice_task
    return {
        'status': 'not_implemented',
        'message': 'AI invoice verification will be implemented in S8',
        'invoiceId': req.invoiceId,
    }


class NotifyRequest(BaseModel):
    notificationId: str


@app.post('/internal/notify', dependencies=[Depends(verify_internal_secret)])
async def notify(req: NotifyRequest):
    """Отправка уведомления через email/Telegram. Реализация в S11."""
    # TODO(S11): from app.tasks.notification_send import send_notification
    return {
        'status': 'not_implemented',
        'message': 'Notifications will be implemented in S11',
        'notificationId': req.notificationId,
    }


# === Celery: список активных задач (для дебага) ===


@app.get('/internal/celery/inspect', dependencies=[Depends(verify_internal_secret)])
async def celery_inspect():
    """Инспекция Celery-воркеров (для админки)."""
    inspect = celery_app.control.inspect()
    return {
        'active': inspect.active() or {},
        'registered': inspect.registered() or {},
        'stats': inspect.stats() or {},
    }


if __name__ == '__main__':
    import uvicorn

    uvicorn.run(
        'app.main:app',
        host='0.0.0.0',
        port=8000,
        reload=True,
    )
