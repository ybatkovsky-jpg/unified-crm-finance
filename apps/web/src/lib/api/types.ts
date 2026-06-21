/**
 * API Client Types
 *
 * Request and response types for Contact API client.
 * Matches the API route contracts from /api/contacts and /api/contacts/[id].
 */

import type { Contact, Interaction } from '@prisma/client';

/**
 * Base contact fields without Prisma metadata
 */
export type ContactData = Omit<
  Contact,
  'deletedAt'
>;

/**
 * API error response shape
 */
export interface ApiError {
  error: string;
  message: string;
}

/**
 * Success response wrapper with single item
 */
export interface ApiResponse<T> {
  data: T;
}

/**
 * Success response wrapper with array and count
 */
export interface ApiListResponse<T> {
  data: T[];
  count: number;
}

/**
 * Contact filter options for getContacts
 */
export interface ContactFilters {
  type?: 'person' | 'company';
  status?: string;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  skip?: number;
  take?: number;
}

/**
 * Combined query parameters for listing contacts
 */
export interface ContactListParams extends ContactFilters, PaginationOptions {}

/**
 * Contact creation input
 */
export interface ContactCreateInput {
  type: 'person' | 'company';
  phone: string;
  firstName?: string | null;
  lastName?: string | null;
  middleName?: string | null;
  companyName?: string | null;
  inn?: string | null;
  kpp?: string | null;
  ogrn?: string | null;
  email?: string | null;
  address?: string | null;
  physicalAddress?: string | null;
  position?: string | null;
  notes?: string | null;
  sourceId?: string | null;
  ownerId?: string | null;
  status?: string | null;
  tags?: string[] | null;
  attributes?: Record<string, unknown> | null;
}

/**
 * Contact update input (all fields optional)
 */
export interface ContactUpdateInput {
  type?: 'person' | 'company' | null;
  firstName?: string | null;
  lastName?: string | null;
  middleName?: string | null;
  companyName?: string | null;
  inn?: string | null;
  kpp?: string | null;
  ogrn?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  physicalAddress?: string | null;
  position?: string | null;
  notes?: string | null;
  sourceId?: string | null;
  ownerId?: string | null;
  status?: string | null;
  tags?: string[] | null;
  attributes?: Record<string, unknown> | null;
}

/**
 * Interaction data (mirrors Prisma Interaction model)
 */
export type InteractionData = Interaction;

/**
 * Interaction filter options for getInteractions
 */
export interface InteractionFilters {
  contactId?: string;
  type?: string;
}

/**
 * Interaction creation input
 */
export interface InteractionCreateInput {
  contactId: string;
  type: string;
  direction?: string | null;
  subject?: string | null;
  content?: string | null;
  scheduledAt?: string | null;
  completedAt?: string | null;
  authorId: string;
  eventId?: string | null;
}

/**
 * Interaction update input (all fields optional)
 */
export interface InteractionUpdateInput {
  type?: string | null;
  direction?: string | null;
  subject?: string | null;
  content?: string | null;
  contactId?: string | null;
  authorId?: string | null;
  scheduledAt?: string | null;
  completedAt?: string | null;
  eventId?: string | null;
}

/**
 * API client configuration
 */
export interface ApiClientConfig {
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
  headers?: Record<string, string>;
}
