import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const startedAt = new Date();
  const checks: Record<string, { ok: boolean; latencyMs?: number; error?: string }> = {};

  // Check database
  try {
    const dbStart = Date.now();
    await db.$queryRaw`SELECT 1`;
    checks.database = { ok: true, latencyMs: Date.now() - dbStart };
  } catch (err) {
    checks.database = {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }

  // Check RabbitMQ (опционально — недоступно на web-уровне, оставлено для воркера)
  checks.rabbitmq = { ok: !!process.env.RABBITMQ_URL };

  // Check S3 (опционально)
  checks.s3 = { ok: !!process.env.S3_ENDPOINT };

  const allOk = Object.values(checks).every((c) => c.ok);
  const status = allOk ? 'ok' : 'degraded';

  return NextResponse.json(
    {
      status,
      timestamp: startedAt.toISOString(),
      version: process.env.APP_VERSION || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      checks,
    },
    { status: allOk ? 200 : 503 }
  );
}
