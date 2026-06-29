/**
 * Lead Source API Client
 *
 * TypeScript client for Lead Source API.
 * Fetches active lead sources dictionary.
 */

import type { ApiResponse, LeadSourceData } from './types'
import { parseJson, parseApiError } from './shared'

const DEFAULT_BASE_URL = '/api'

export async function getLeadSources(): Promise<ApiResponse<LeadSourceData[]>> {
  const response = await fetch(`${DEFAULT_BASE_URL}/lead-sources`, {
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    return parseApiError(response)
  }

  return parseJson<ApiResponse<LeadSourceData[]>>(response)
}
