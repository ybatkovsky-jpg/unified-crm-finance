# Python-воркер — Dockerfile
FROM python:3.12-slim

WORKDIR /app

# Системные зависимости для psycopg2, pdfplumber, imapflow
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    libxml2 \
    libxslt1.1 \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Сначала копируем только requirements.txt для кеширования слоя
COPY apps/worker/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Копируем исходники
COPY apps/worker ./apps/worker

WORKDIR /app/apps/worker

# Python path
ENV PYTHONPATH=/app/apps/worker

# Непривилегированный пользователь
RUN useradd -m -u 1001 worker && chown -R worker:worker /app
USER worker

EXPOSE 8000

# По умолчанию запускаем FastAPI
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
