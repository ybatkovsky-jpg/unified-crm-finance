/**
 * API Client Types
 *
 * Request and response types for Contact API client.
 * Matches the API route contracts from /api/contacts and /api/contacts/[id].
 */

import type { Contact, Interaction, Deal, DealStage, Pipeline, User, Contract, ContractVersion, ContractSigner, ContractTemplate, Project, ProjectStage, ProjectMember, Production, ProductionStage, FileEntity } from '@prisma/client';

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

/**
 * Deal history data with stage relations
 */
export interface DealHistoryData {
  id: string;
  dealId: string;
  fromStageId: string | null;
  toStageId: string | null;
  comment: string | null;
  changedBy: string;
  changedAt: Date;
  fromStage?: DealStageData | null;
  toStage?: DealStageData | null;
  changedByUser?: UserData | null;
}

/**
 * Deal data with relations
 */
export interface DealData extends Omit<Deal, 'deletedAt'> {
  stage: DealStageData;
  pipeline: PipelineData;
  contact?: ContactData | null;
  manager?: UserData | null;
  drawingFile?: FileEntityData | null;
  actFile?: FileEntityData | null;
  history?: DealHistoryData[];
}

/**
 * Deal stage data
 */
export interface DealStageData extends Omit<DealStage, 'pipelineId'> {}

/**
 * Pipeline data
 */
export interface PipelineData extends Omit<Pipeline, 'createdAt'> {}

/**
 * User data
 */
export interface UserData extends Omit<User, 'passwordHash' | 'deletedAt'> {}

/**
 * File entity data
 */
export interface FileEntityData extends Omit<FileEntity, 'deletedAt'> {}

/**
 * File data with download URL
 */
export interface FileUploadResponse {
  file: FileEntityData;
  downloadUrl?: string;
  expiresIn?: number;
}

/**
 * Deal filter options
 */
export interface DealFilters {
  pipelineId?: string;
  stageId?: string;
  managerId?: string;
  contactId?: string;
  status?: 'open' | 'closed';
}

/**
 * Deal list params
 */
export interface DealListParams extends DealFilters, PaginationOptions {}

/**
 * Deal creation input
 */
export interface DealCreateInput {
  title: string;
  pipelineId: string;
  stageId: string;
  contactId?: string | null;
  amount?: number | null;
  currency?: string | null;
  expectedCloseDate?: string | null;
  managerId?: string | null;
  description?: string | null;
  lossReason?: string | null;
  attributes?: Record<string, unknown> | null;
}

/**
 * Deal update input
 */
export interface DealUpdateInput {
  title?: string | null;
  amount?: number | null;
  currency?: string | null;
  expectedCloseDate?: string | null;
  description?: string | null;
  lossReason?: string | null;
  attributes?: Record<string, unknown> | null;
  contactId?: string | null;
  managerId?: string | null;
  drawingFileId?: string | null;
  actFileId?: string | null;
}

/**
 * Deal move stage input
 */
export interface DealMoveInput {
  stageId: string;
  changedBy: string;
  comment?: string | null;
}

/**
 * Contract data with relations
 */
export interface ContractData extends Omit<Contract, 'deletedAt'> {
  contact?: ContactData | null;
  deal?: DealData | null;
  template?: ContractTemplateData | null;
  versions?: ContractVersionData[];
  signers?: ContractSignerData[];
}

/**
 * Contract version data
 */
export interface ContractVersionData extends Omit<ContractVersion, 'contractId'> {}

/**
 * Contract signer data
 */
export interface ContractSignerData extends Omit<ContractSigner, 'contractId'> {}

/**
 * Contract template data
 */
export interface ContractTemplateData extends Omit<ContractTemplate, 'createdBy'> {}

/**
 * Contract filter options
 */
export interface ContractFilters {
  status?: string;
  contactId?: string;
  dealId?: string;
}

/**
 * Contract list params
 */
export interface ContractListParams extends ContractFilters, PaginationOptions {}

/**
 * Contract creation input
 */
export interface ContractCreateInput {
  title: string;
  contactId: string;
  dealId?: string | null;
  templateId?: string | null;
  amount?: number | null;
  currency?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: string | null;
  notes?: string | null;
  attributes?: Record<string, unknown> | null;
}

/**
 * Contract update input
 */
export interface ContractUpdateInput {
  title?: string | null;
  amount?: number | null;
  currency?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: string | null;
  notes?: string | null;
  attributes?: Record<string, unknown> | null;
  signedAt?: string | null;
}

/**
 * Contract version creation input
 */
export interface ContractVersionCreateInput {
  contentMd: string;
  createdBy: string;
  generatedPdfFileId?: string | null;
}

/**
 * Contract signer creation input
 */
export interface ContractSignerCreateInput {
  name: string;
  position?: string | null;
  signatureFileId?: string | null;
}

/**
 * Deal convert to contract input
 */
export interface DealConvertInput {
  title?: string | null;
  amount?: number | null;
  currency?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  notes?: string | null;
}

/**
 * Project data with relations
 */
export interface ProjectData extends Omit<Project, 'deletedAt'> {
  manager?: UserData | null;
  contact?: ContactData | null;
  deal?: DealData | null;
  contract?: ContractData | null;
  specFile?: FileEntityData | null;
  stages?: ProjectStageData[];
  members?: ProjectMemberData[];
}

/**
 * Project stage data
 */
export interface ProjectStageData extends Omit<ProjectStage, 'projectId'> {}

/**
 * Project member data with User relation
 */
export interface ProjectMemberData extends Omit<ProjectMember, 'projectId'> {
  User?: UserData | null;
}

/**
 * Project filter options
 */
export interface ProjectFilters {
  status?: string;
  managerId?: string;
  contactId?: string;
  dealId?: string;
}

/**
 * Project list params
 */
export interface ProjectListParams extends ProjectFilters, PaginationOptions {}

/**
 * Project creation input
 */
export interface ProjectCreateInput {
  externalNumber: string;
  name: string;
  description?: string | null;
  dealId?: string | null;
  contractId?: string | null;
  contactId?: string | null;
  status?: string | null;
  contractAmount?: number | null;
  currency?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  marginTarget?: number | null;
  managerId?: string | null;
  attributes?: Record<string, unknown> | null;
}

/**
 * Project update input
 */
export interface ProjectUpdateInput {
  name?: string | null;
  externalNumber?: string | null;
  description?: string | null;
  dealId?: string | null;
  contractId?: string | null;
  contactId?: string | null;
  status?: string | null;
  contractAmount?: number | null;
  currency?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  completedAt?: string | null;
  marginTarget?: number | null;
  qualityRating?: string | null;
  deadlineStatus?: string | null;
  managerId?: string | null;
  specFileId?: string | null;
  attributes?: Record<string, unknown> | null;
}

/**
 * Project stage creation input
 */
export interface ProjectStageCreateInput {
  code: string;
  name: string;
  order: number;
  status?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  assigneeId?: string | null;
  notes?: string | null;
}

/**
 * Project stage update input
 */
export interface ProjectStageUpdateInput {
  code?: string | null;
  name?: string | null;
  order?: number | null;
  status?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  completedAt?: string | null;
  assigneeId?: string | null;
  notes?: string | null;
}

/**
 * Project member creation input
 */
export interface ProjectMemberCreateInput {
  userId: string;
  role: string;
}

/**
 * Production data with relations
 */
export interface ProductionData extends Omit<Production, 'deletedAt'> {
  ProductionStage?: ProductionStageData[];
}

/**
 * Production stage data
 */
export interface ProductionStageData extends Omit<ProductionStage, 'productionId'> {}

/**
 * Production filter options
 */
export interface ProductionFilters {
  status?: string;
}

/**
 * Production list params
 */
export interface ProductionListParams extends ProductionFilters, PaginationOptions {}

/**
 * Production creation input
 */
export interface ProductionCreateInput {
  projectId: string;
  status?: string | null;
  plannedStartDate?: string | null;
  plannedEndDate?: string | null;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  progress?: number | null;
  notes?: string | null;
  attributes?: Record<string, unknown> | null;
}

/**
 * Production update input
 */
export interface ProductionUpdateInput {
  status?: string | null;
  plannedStartDate?: string | null;
  plannedEndDate?: string | null;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  progress?: number | null;
  notes?: string | null;
  attributes?: Record<string, unknown> | null;
}

/**
 * Production stage creation input
 */
export interface ProductionStageCreateInput {
  productionId: string;
  code: string;
  name: string;
  order: number;
  status?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  completedAt?: string | null;
  assigneeId?: string | null;
  notes?: string | null;
}

/**
 * Production stage update input
 */
export interface ProductionStageUpdateInput {
  name?: string | null;
  order?: number | null;
  status?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  completedAt?: string | null;
  assigneeId?: string | null;
  notes?: string | null;
}

/**
 * Production stage move status input
 */
export interface ProductionStageMoveInput {
  status: string;
  completedAt?: string | null;
}

/**
 * File upload file state (mirrors FileUpload component)
 */
export interface FileUploadFile {
  id: string;
  file: File;
  preview?: string;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}
