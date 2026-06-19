"""
Заглушки Celery-задач — реальные реализации в соответствующих спринтах.

Структура:
- app/tasks/ai_parse_bom.py     (S7)
- app/tasks/ai_verify_invoice.py (S8)
- app/tasks/email_send.py       (S7)
- app/tasks/email_poll.py       (S8)
- app/tasks/bank_import.py      (S9)
- app/tasks/notification_send.py (S11)

Сейчас созданы заглушки, чтобы Celery beat не падал при старте.
"""
import logging

from app.celery_app import celery_app

log = logging.getLogger(__name__)


@celery_app.task(name='app.tasks.email_poll.poll_mailbox', bind=True)
def poll_mailbox(self):
    """Опрос IMAP-ящика (S8)."""
    log.info('email_poll.poll_mailbox: stub called (will be implemented in S8)')
    return {'status': 'stub', 'message': 'Will be implemented in S8'}


@celery_app.task(name='app.tasks.bank_import.import_statements', bind=True)
def import_statements(self):
    """Импорт 1С-клиент-банк выписки (S9)."""
    log.info('bank_import.import_statements: stub called (will be implemented in S9)')
    return {'status': 'stub', 'message': 'Will be implemented in S9'}
