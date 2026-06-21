"""
Celery приложение — брокер RabbitMQ, сериализация JSON.

Очереди (см. docs/03-target-architecture.md):
- ai_parse_bom      — парсинг Excel-спецификаций (S7)
- ai_verify_invoice — сверка счетов (S8)
- email_send        — отправка email (S7+)
- email_poll        — опрос IMAP (S8+)
- bank_import       — импорт 1С-выписки (S9+)
- notification_send — отправка уведомлений (S11)

DLQ: см. task_routes + настройку queue_arguments в RabbitMQ.
"""
import os

from celery import Celery
from celery.schedules import crontab

RABBITMQ_URL = os.getenv('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672/')

celery_app = Celery(
    'unified_worker',
    broker=RABBITMQ_URL,
    backend=RABBITMQ_URL,
)

celery_app.conf.update(
    # Сериализация
    task_serializer='json',
    result_serializer='json',
    accept_content=['json'],
    # Часовой пояс
    timezone='Europe/Moscow',
    enable_utc=True,
    # Ретраи
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    task_default_retry_delay=60,  # 1 минута
    task_max_retries=3,
    # DLQ
    task_routes={
        'app.tasks.ai_parse_bom.*': {'queue': 'ai_parse_bom'},
        'app.tasks.ai_verify_invoice.*': {'queue': 'ai_verify_invoice'},
        'app.tasks.email_send.*': {'queue': 'email_send'},
        'app.tasks.email_poll.*': {'queue': 'email_poll'},
        'app.tasks.bank_import.*': {'queue': 'bank_import'},
        'app.tasks.notification_send.*': {'queue': 'notification_send'},
    },
    task_default_queue='default',
    # Расписание (Celery beat)
    beat_schedule={
        # Опрос IMAP каждые 15 минут (S8+)
        'email-poll': {
            'task': 'app.tasks.email_poll.poll_mailbox',
            'schedule': crontab(minute='*/15'),
        },
        # Импорт 1С-выписки ежедневно в 6:00 MSK (S9+)
        'bank-import': {
            'task': 'app.tasks.bank_import.import_statements',
            'schedule': crontab(hour=6, minute=0),
        },
    },
)


if __name__ == '__main__':
    celery_app.start()
