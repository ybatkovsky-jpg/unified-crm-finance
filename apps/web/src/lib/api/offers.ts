/**
 * CommercialOffer (КП) API Client
 */

import type { ApiResponse, CommercialOfferData } from './types'
import { parseJson, parseApiError } from './shared'

const BASE = '/api'

export interface OfferInput {
  title?: string
  amount?: number
  status?: string
  validUntil?: string | null
  notes?: string | null
}

export async function getDealOffers(dealId: string): Promise<CommercialOfferData[]> {
  const response = await fetch(`${BASE}/deals/${dealId}/offers`, {
    headers: { 'Content-Type': 'application/json' },
  })
  if (!response.ok) return parseApiError(response)
  const json = await parseJson<ApiResponse<CommercialOfferData[]>>(response)
  return json.data
}

export async function getOffer(id: string): Promise<CommercialOfferData> {
  const response = await fetch(`${BASE}/offers/${id}`, {
    headers: { 'Content-Type': 'application/json' },
  })
  if (!response.ok) return parseApiError(response)
  const json = await parseJson<ApiResponse<CommercialOfferData>>(response)
  return json.data
}

export async function createOffer(dealId: string, input: OfferInput): Promise<CommercialOfferData> {
  const response = await fetch(`${BASE}/deals/${dealId}/offers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok) return parseApiError(response)
  const json = await parseJson<ApiResponse<CommercialOfferData>>(response)
  return json.data
}

export async function updateOffer(id: string, input: OfferInput): Promise<CommercialOfferData> {
  const response = await fetch(`${BASE}/offers/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok) return parseApiError(response)
  const json = await parseJson<ApiResponse<CommercialOfferData>>(response)
  return json.data
}

export async function deleteOffer(id: string): Promise<void> {
  const response = await fetch(`${BASE}/offers/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!response.ok) return parseApiError(response)
}
