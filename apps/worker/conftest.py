"""Конфигурация pytest для apps/worker."""
import pytest
import sys
from pathlib import Path

# Добавляем apps/worker в sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))


def pytest_collection_modifyitems(items):
    """Принудительно标记 async тесты."""
    for item in items:
        if 'asyncio' in item.keywords:
            item.add_marker(pytest.mark.asyncio)
