/**
 * PATCH /api/projects/[id]/stages/[stageId]
 *
 * Update a project stage's dates via drag-drop in Gantt chart.
 * Validates that endDate >= startDate.
 */

import { NextRequest, NextResponse } from 'next/server';
import { projects } from '@/lib/db/projects';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  try {
    const { id, stageId } = await params;

    // Parse request body
    const body = await request.json();
    const { startDate, endDate } = body;

    // Validate dates
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (end < start) {
        return NextResponse.json(
          {
            error: 'Validation Error',
            message: 'endDate must be greater than or equal to startDate',
          },
          { status: 400 }
        );
      }
    }

    // Update the stage
    const updatedStage = await projects.updateStage(stageId, {
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
    });

    console.log(`[API] Stage ${stageId} updated for project ${id}`, {
      startDate: updatedStage.startDate,
      endDate: updatedStage.endDate,
    });

    return NextResponse.json({ data: updatedStage });
  } catch (error) {
    console.error('[API] Error updating stage:', error);

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to update stage',
      },
      { status: 500 }
    );
  }
}
