/**
 * Project Closure Readiness API (PROJ-13)
 *
 * GET /api/projects/[id]/closure-readiness — чек-лист готовности к закрытию.
 *
 * Возвращает { ready, conditions: [{ key, label, met, detail }] }:
 *  1. Акт приёмки подписан
 *  2. Все деньги клиента получены
 *  3. Все счета поставщикам оплачены
 *  4. Бонус дизайнеру выплачен
 */

import { NextRequest, NextResponse } from 'next/server';
import { projects } from '@/lib/db/projects';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const readiness = await projects.getClosureReadiness(id);
    return NextResponse.json({ data: readiness });
  } catch (error) {
    console.error('Failed to get closure readiness:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message.includes('not found') ? 404 : 500;
    return NextResponse.json(
      { error: 'Failed to get closure readiness', message },
      { status }
    );
  }
}
