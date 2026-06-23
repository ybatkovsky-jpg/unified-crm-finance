/**
 * PurchaseRequest Grouping API
 *
 * - GET /api/purchase-requests/group?bomId=X
 *   Previews how a *locked* BOM's items group by supplier (PROC-07/11).
 *   Items without a supplier are skipped. 400 if BOM not locked, 404 if no BOM.
 */

import { NextRequest, NextResponse } from 'next/server'
import { purchaseRequests } from '../../../../lib/db/purchase-requests'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const bomId = request.nextUrl.searchParams.get('bomId')
    if (!bomId) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'bomId query parameter is required' },
        { status: 400 }
      )
    }
    const groups = await purchaseRequests.groupBOMBySupplier(bomId)
    return NextResponse.json({ data: groups, count: groups.length })
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (status === 400 || status === 404) {
      return NextResponse.json(
        { error: status === 404 ? 'Not found' : 'Validation failed', message },
        { status }
      )
    }
    console.error('Failed to group BOM by supplier:', error)
    return NextResponse.json(
      { error: 'Failed to group BOM', message },
      { status: 500 }
    )
  }
}
