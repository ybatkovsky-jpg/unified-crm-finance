/**
 * API Client Types
 *
 * Request and response types for Contact API client.
 * Matches the API route contracts from /api/contacts and /api/contacts/[id].
 */

import type { Contact, Counterparty, Interaction, Deal, DealStage, Pipeline, User, Contract, ContractVersion, ContractSigner, ContractTemplate, Project, ProjectStage, ProjectMember, Production, ProductionStage, FileEntity, BOM, BOMItem, PurchaseRequest, PurchaseRequestItem, Invoice, InvoiceItem, ApprovalRequest, WarehouseItem, WarehouseTransaction, Delivery, Budget, Transaction, CashFlowPayment, Category } from '@prisma/client';

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
  companyId?: string;
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
  companyId?: string | null;
  status?: string | null;
  tags?: string[] | null;
  attributes?: Record<string, unknown> | null;
  passportSeries?: string | null;
  passportNumber?: string | null;
  passportIssuedBy?: string | null;
  passportIssuedAt?: string | null;
  passportCode?: string | null;
  registrationAddress?: string | null;
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
  companyId?: string | null;
  status?: string | null;
  tags?: string[] | null;
  attributes?: Record<string, unknown> | null;
  passportSeries?: string | null;
  passportNumber?: string | null;
  passportIssuedBy?: string | null;
  passportIssuedAt?: string | null;
  passportCode?: string | null;
  registrationAddress?: string | null;
}

/**
 * Counterparty data (mirrors Prisma Counterparty model)
 */
export type CounterpartyData = Omit<Counterparty, 'deletedAt'>;

/**
 * Counterparty filter options for getCounterparties
 */
export interface CounterpartyFilters {
  type?: string;
  search?: string;
}

/**
 * Combined query parameters for listing counterparties
 */
export interface CounterpartyListParams extends CounterpartyFilters, PaginationOptions {}

/**
 * Counterparty creation input
 */
export interface CounterpartyCreateInput {
  name: string;
  type: string;
  types?: string[] | null;
  inn?: string | null;
  kpp?: string | null;
  email?: string | null;
  phone?: string | null;
  contactPerson?: string | null;
  address?: string | null;
  bankName?: string | null;
  bankAccount?: string | null;
  korAccount?: string | null;
  bik?: string | null;
  notes?: string | null;
  rating?: number | null;
}

/**
 * Counterparty update input (all fields optional)
 */
export interface CounterpartyUpdateInput {
  name?: string | null;
  type?: string | null;
  types?: string[] | null;
  inn?: string | null;
  kpp?: string | null;
  email?: string | null;
  phone?: string | null;
  contactPerson?: string | null;
  address?: string | null;
  bankName?: string | null;
  bankAccount?: string | null;
  korAccount?: string | null;
  bik?: string | null;
  notes?: string | null;
  rating?: number | null;
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
/**
 * Lead source dictionary entry (from LeadSource model)
 */
export interface LeadSourceData {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

/**
 * Lightweight project data embedded in DealData (for days-to-deadline)
 */
export interface ProjectLiteData {
  id: string;
  endDate: string | null;
  externalNumber: string;
}

export interface DealData extends Omit<Deal, 'deletedAt' | 'amount'> {
  // amount: Prisma.Decimal в БД, но API возвращает number (см. lib/db/decimal-extension.ts)
  amount: number;
  stage: DealStageData;
  pipeline: PipelineData;
  contact?: ContactData | null;
  manager?: UserData | null;
  source?: LeadSourceData | null;
  project?: ProjectLiteData | null;
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
  sourceId?: string | null;
  amount?: number | null;
  currency?: string | null;
  expectedCloseDate?: string | null;
  managerId?: string | null;
  description?: string | null;
  lossReason?: string | null;
  attributes?: Record<string, unknown> | null;
  objectAddress?: string | null;
  drawingFileId?: string | null;
  actFileId?: string | null;
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
  sourceId?: string | null;
  attributes?: Record<string, unknown> | null;
  objectAddress?: string | null;
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
  /** @deprecated Server now derives changedBy from the session. Kept for back-compat. */
  changedBy?: string;
  comment?: string | null;
}

/**
 * Contract data with relations
 */
export interface ContractData extends Omit<Contract, 'deletedAt' | 'amount'> {
  // amount: Prisma.Decimal в БД → number в API (см. lib/db/decimal-extension.ts)
  amount: number;
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
export interface ProjectData extends Omit<Project, 'deletedAt' | 'contractAmount' | 'warrantyStartDate' | 'warrantyEndDate' | 'warrantyNotes'> {
  // contractAmount: Prisma.Decimal в БД → number в API (см. lib/db/decimal-extension.ts)
  contractAmount: number;
  manager?: UserData | null;
  contact?: ContactData | null;
  deal?: DealData | null;
  contract?: ContractData | null;
  specFile?: FileEntityData | null;
  stages?: ProjectStageData[];
  members?: ProjectMemberData[];
  // PROJ-14: гарантия (Date в БД → ISO-строка в API)
  warrantyStartDate?: string | null;
  warrantyEndDate?: string | null;
  warrantyNotes?: string | null;
  // PROJ-12 / PROJ-13
  acceptanceAct?: AcceptanceActData | null;
  designerBonus?: DesignerBonusData | null;
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
  specFileId?: string | null;
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
  Counterparty?: CounterpartyData | null;
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
  partnerId?: string | null;
  status?: string | null;
  materialMode?: string | null;
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
  partnerId?: string | null;
  materialMode?: string | null;
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

// ─── Installation (PROJ-10) ──────────────────────────────────

export type InstallationStatusType = 'planned' | 'advance_paid' | 'started' | 'completed' | 'cancelled';

export interface InstallationWorkerData {
  id: string;
  installationId: string;
  userId: string;
  User?: { id: string; name: string; email: string } | null;
}

export interface InstallationData {
  id: string;
  projectId: string;
  number: number;
  status: string;
  plannedStartDate: string | null;
  actualStartDate: string | null;
  actualEndDate: string | null;
  advancePercent: number;
  advanceAmount: number | null;
  cost: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  InstallationWorker?: InstallationWorkerData[];
}

export interface InstallationCreateInput {
  plannedStartDate?: string | null;
  advancePercent?: number | null;
  advanceAmount?: number | null;
  cost?: number | null;
  notes?: string | null;
}

export interface InstallationUpdateInput {
  plannedStartDate?: string | null;
  advancePercent?: number | null;
  advanceAmount?: number | null;
  cost?: number | null;
  notes?: string | null;
}

// ─── ChangeOrder (PROJ-11) ───────────────────────────────────

export type ChangeOrderStatusType = 'draft' | 'approved' | 'completed' | 'cancelled';

export interface ChangeOrderData {
  id: string;
  projectId: string;
  contractId: string | null;
  number: number;
  title: string;
  description: string | null;
  amount: number;
  status: string;
  approvedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  Contract?: { id: string; number: string; title: string } | null;
  Project?: { id: string; name: string; externalNumber: string } | null;
}

export interface ChangeOrderCreateInput {
  contractId?: string | null;
  title: string;
  description?: string | null;
  amount: number;
  notes?: string | null;
}

export interface ChangeOrderUpdateInput {
  title?: string | null;
  description?: string | null;
  amount?: number | null;
  contractId?: string | null;
  status?: string | null;
  notes?: string | null;
}

// ─── AcceptanceAct (PROJ-12) ─────────────────────────────────

export type AcceptanceActStatusType = 'draft' | 'signed';
export type AcceptanceSignerType = 'individual' | 'legal';
export type AcceptanceSignMethod = 'paper' | 'edo';

export interface AcceptanceActData {
  id: string;
  projectId: string;
  number: number;
  status: string;
  signerType: AcceptanceSignerType | null;
  signedById: string | null;
  signedAt: string | null;
  signMethod: AcceptanceSignMethod | null;
  actFileId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  SignedBy?: { id: string; name: string; email: string } | null;
  ActFile?: FileEntityData | null;
}

export interface AcceptanceActCreateInput {
  signerType?: AcceptanceSignerType;
  signMethod?: AcceptanceSignMethod;
  actFileId?: string;
  notes?: string;
}

export interface AcceptanceActUpdateInput {
  signMethod?: AcceptanceSignMethod | null;
  actFileId?: string | null;
  notes?: string | null;
  status?: AcceptanceActStatusType;
}

export interface SignActInput {
  signedById: string;
  signerType?: AcceptanceSignerType;
  signMethod?: AcceptanceSignMethod;
}

// ─── DesignerBonus (минимальный след, PROJ-13/FIN-06) ─────────

export type DesignerBonusStatusType = 'pending' | 'paid';

export interface DesignerBonusData {
  id: string;
  projectId: string;
  designerId: string | null;
  percent: number;
  amount: number;
  status: string;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  Designer?: { id: string; name: string; email: string } | null;
}

export interface DesignerBonusUpsertInput {
  designerId?: string | null;
  percent?: number;
  amount?: number;
  notes?: string | null;
}

// ─── Closure readiness (PROJ-13) ─────────────────────────────

export interface ClosureCondition {
  key: 'act_signed' | 'client_paid' | 'supplier_invoices_paid' | 'designer_bonus_paid';
  label: string;
  met: boolean;
  detail: string;
}

export interface ClosureReadiness {
  ready: boolean;
  conditions: ClosureCondition[];
}

// ─── ProjectPayment (FIN-01: 70/30) ──────────────────────────

export type ProjectPaymentType = 'prepayment' | 'final' | 'other';
export type ProjectPaymentStatus = 'planned' | 'partial' | 'paid';
export type PaymentMethod = 'cash' | 'bank' | 'card';

export interface ProjectPaymentData {
  id: string;
  projectId: string;
  paymentType: ProjectPaymentType;
  plannedPercent: number;
  plannedAmount: number;
  receivedAmount: number;
  paymentMethod: PaymentMethod | null;
  transactionId: string | null;
  status: ProjectPaymentStatus;
  dueDate: string | null;
  receivedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  Transaction?: { id: string; amount: number; date: string; paymentMethod: PaymentMethod | null } | null;
}

export interface ProjectPaymentCreateInput {
  paymentType: ProjectPaymentType;
  plannedPercent?: number;
  dueDate?: string | null;
  notes?: string;
}

export interface RecordPaymentInput {
  amount: number;
  paymentMethod?: PaymentMethod;
  transactionDate?: string;
  description?: string;
}

export interface PaymentCoverage {
  total: number;
  received: number;
  percent: number;
  prepaymentMet: boolean;
  fullyPaid: boolean;
}

/**
 * BOM data with relations
 */
export interface BOMData extends Omit<BOM, 'BOMItem'> {
  items?: BOMItemData[];
  sourceFile?: FileEntityData | null;
  project?: ProjectData;
}

/**
 * BOM item data (mirrors Prisma BOMItem model without heavy relations)
 */
export type BOMItemData = Omit<
  BOMItem,
  'BOM' | 'InvoiceItem' | 'PurchaseRequestItem' | 'WarehouseTransaction' | 'price'
> & {
  // price: Prisma.Decimal в БД → number в API (см. lib/db/decimal-extension.ts)
  price: number;
  supplier?: CounterpartyData | null;
};

/**
 * BOM filter options
 */
export interface BOMFilters {
  projectId?: string;
}

/**
 * BOM list params
 */
export interface BOMListParams extends BOMFilters, PaginationOptions {}

/**
 * BOM creation input
 */
export interface BOMCreateInput {
  projectId: string;
  sourceFileId?: string | null;
  items?: BOMItemCreateInput[];
}

/**
 * BOM update input
 */
export interface BOMUpdateInput {
  status?: string | null;
  sourceFileId?: string | null;
}

/**
 * BOM item creation input
 */
export interface BOMItemCreateInput {
  rowNumber: number;
  name: string;
  article?: string | null;
  category?: string | null;
  material?: string | null;
  quantity: number;
  unit?: string | null;
  price?: number | null;
  supplierId?: string | null;
  notes?: string | null;
}

/**
 * BOM item update input (all fields optional)
 */
export interface BOMItemUpdateInput {
  rowNumber?: number | null;
  name?: string | null;
  article?: string | null;
  category?: string | null;
  material?: string | null;
  quantity?: number | null;
  unit?: string | null;
  price?: number | null;
  supplierId?: string | null;
  status?: string | null;
  isFromWarehouse?: boolean | null;
  notes?: string | null;
}

// ─── Purchase Request ─────────────────────────────────────

/** Status machine (PROC-17): draft → sent → responded → partial / closed / cancelled */
export type PurchaseRequestStatus =
  | 'draft'
  | 'sent'
  | 'responded'
  | 'partial'
  | 'closed'
  | 'cancelled';

/**
 * PurchaseRequest data with optional relations (mirrors Prisma model)
 */
export interface PurchaseRequestData extends Omit<PurchaseRequest, 'PurchaseRequestItem'> {
  supplier?: CounterpartyData | null;
  project?: ProjectData | null;
  items?: PurchaseRequestItemData[];
}

/**
 * PurchaseRequest item data (mirrors Prisma PurchaseRequestItem without heavy relations)
 */
export type PurchaseRequestItemData = Omit<
  PurchaseRequestItem,
  'BOMItem' | 'PurchaseRequest' | 'price'
> & {
  // price: Prisma.Decimal в БД → number в API (см. lib/db/decimal-extension.ts)
  price: number;
  bomItem?: BOMItemData | null;
};

/**
 * A supplier group produced by grouping a locked BOM (PROC-07/11)
 */
export interface SupplierGroupData {
  supplierId: string;
  supplier: CounterpartyData;
  items: BOMItemData[];
}

/**
 * PurchaseRequest list params
 */
export interface PurchaseRequestListParams {
  projectId?: string;
  supplierId?: string;
  status?: PurchaseRequestStatus;
}

/**
 * PurchaseRequest creation input
 */
export interface PurchaseRequestCreateInput {
  projectId: string;
  supplierId: string;
  number?: string;
  emailTo?: string | null;
  emailSubject?: string | null;
  emailBody?: string | null;
  notes?: string | null;
  items?: PurchaseRequestItemCreateInput[];
}

/**
 * PurchaseRequest item creation input
 */
export interface PurchaseRequestItemCreateInput {
  bomItemId: string;
  quantity: number;
  price?: number;
  available?: boolean;
  availableQty?: number;
  deliveryDays?: number;
  notes?: string | null;
}

/**
 * PurchaseRequest update input (metadata only — status via dedicated endpoints)
 */
export interface PurchaseRequestUpdateInput {
  emailTo?: string | null;
  emailSubject?: string | null;
  emailBody?: string | null;
  notes?: string | null;
}

// ─── Invoice ───────────────────────────────────────────────

/** Status machine (PROC-23/25): received → verified | discrepancy → approved */
export type InvoiceStatus = 'received' | 'verified' | 'discrepancy' | 'approved';

/** Invoice data with optional relations */
export interface InvoiceData extends Omit<Invoice, 'InvoiceItem' | 'totalAmount'> {
  // totalAmount: Prisma.Decimal в БД → number в API (см. lib/db/decimal-extension.ts)
  totalAmount: number;
  supplier?: CounterpartyData | null;
  project?: ProjectData | null;
  items?: InvoiceItemData[];
}

/** Invoice line data (mirrors Prisma InvoiceItem without heavy relations) */
export type InvoiceItemData = Omit<InvoiceItem, 'BOMItem' | 'Invoice' | 'price' | 'totalPrice'> & {
  // price/totalPrice: Prisma.Decimal в БД → number в API (см. lib/db/decimal-extension.ts)
  price: number;
  totalPrice: number | null;
  bomItem?: BOMItemData | null;
};

/** Invoice list params */
export interface InvoiceListParams {
  projectId?: string;
  supplierId?: string;
  purchaseRequestId?: string;
  status?: InvoiceStatus;
}

/** Invoice creation input */
export interface InvoiceCreateInput {
  projectId: string;
  supplierId: string;
  number?: string;
  invoiceNumber?: string | null;
  totalAmount?: number;
  dueDate?: string | null;
  notes?: string | null;
  sourceFileId?: string;
  items?: InvoiceItemCreateInput[];
}

/** Invoice item creation input */
export interface InvoiceItemCreateInput {
  bomItemId?: string | null;
  name: string;
  quantity: number;
  price?: number;
  isMatch?: boolean;
  mismatchReason?: string | null;
}

/** Invoice item update input */
export interface InvoiceItemUpdateInput {
  name?: string;
  quantity?: number;
  price?: number;
}

// ─── Approval Request ──────────────────────────────────────

/** Decision / status */
export type ApprovalDecision = 'approved' | 'rejected';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

/** Minimal user shape for approval relations */
export interface ApprovalUserData {
  id: string;
  name: string;
  email: string;
}

/** ApprovalRequest data with resolved requester/decider users */
export interface ApprovalRequestData extends Omit<ApprovalRequest, 'amount'> {
  // amount: Prisma.Decimal? в БД → number | null в API (см. lib/db/decimal-extension.ts)
  amount: number | null;
  requester?: ApprovalUserData | null;
  decider?: ApprovalUserData | null;
}

/** Approval list params */
export interface ApprovalListParams {
  status?: ApprovalStatus;
  type?: string;
}

/** Approval creation input (PROC-28 — type='payment' from an approved invoice) */
export interface ApprovalCreateInput {
  type: string;
  entityId: string;
  amount?: number;
  requestedBy: string;
  comment?: string;
  notifyUserId?: string;
}

/** Approval decision input (PROC-30) */
export interface ApprovalDecisionInput {
  decision: ApprovalDecision;
  decidedBy: string;
  comment?: string;
}

// ─── Warehouse ─────────────────────────────────────────────

export type WarehouseTransactionType = 'in' | 'out' | 'reserve' | 'release';

/** Warehouse item data (mirrors Prisma WarehouseItem without relation list) */
export type WarehouseItemData = Omit<WarehouseItem, 'WarehouseTransaction'>;

/** Transaction data (mirrors Prisma WarehouseTransaction without relations) */
export type WarehouseTransactionData = Omit<WarehouseTransaction, 'BOMItem' | 'WarehouseItem'>;

/** Warehouse item with transaction history */
export interface WarehouseItemDetail extends WarehouseItemData {
  transactions?: WarehouseTransactionData[];
}

/** Warehouse list params */
export interface WarehouseListParams {
  search?: string;
  lowStockOnly?: boolean;
}

/** Warehouse item creation input */
export interface WarehouseItemCreateInput {
  name: string;
  article?: string | null;
  category?: string | null;
  quantity?: number;
  reservedQty?: number;
  minQuantity?: number;
  unit?: string;
  location?: string | null;
}

/** Warehouse item update input */
export interface WarehouseItemUpdateInput {
  name?: string;
  article?: string | null;
  category?: string | null;
  minQuantity?: number;
  unit?: string;
  location?: string | null;
}

/** Stock transaction input */
export interface WarehouseTransactionInput {
  type: WarehouseTransactionType;
  quantity: number;
  bomItemId?: string;
  notes?: string;
}

// ─── Delivery ──────────────────────────────────────────────

/** Status machine: pending → shipped → in_transit → delivered (+ cancelled) */
export type DeliveryStatus = 'pending' | 'shipped' | 'in_transit' | 'delivered' | 'cancelled';

/** Delivery data with optional relations */
export interface DeliveryData extends Omit<Delivery, never> {
  supplier?: CounterpartyData | null;
  project?: ProjectData | null;
  invoice?: InvoiceData | null;
}

/** Delivery list params */
export interface DeliveryListParams {
  projectId?: string;
  supplierId?: string;
  status?: DeliveryStatus;
}

/** Delivery creation input */
export interface DeliveryCreateInput {
  projectId: string;
  supplierId: string;
  invoiceId?: string;
  deliveryType?: string;
  trackingNumber?: string;
  carrier?: string;
  fromLocation?: string;
  toLocation?: string;
  cost?: number;
  estimatedDate?: string | null;
  notes?: string | null;
}

/** Delivery update input */
export interface DeliveryUpdateInput {
  deliveryType?: string | null;
  trackingNumber?: string | null;
  carrier?: string | null;
  fromLocation?: string | null;
  toLocation?: string | null;
  cost?: number | null;
  estimatedDate?: string | null;
  notes?: string | null;
}

// ─── Category ──────────────────────────────────────────────

/**
 * Category data (mirrors Prisma Category model)
 */
export type CategoryData = Category;

/**
 * Category list filter params
 */
export interface CategoryListParams {
  type?: string;
  isActive?: boolean;
  includeInactive?: boolean;
}

/**
 * Category creation input
 */
export interface CategoryCreateInput {
  name: string;
  type: 'income' | 'expense';
  parentId?: string | null;
  order?: number;
  isActive?: boolean;
}

/**
 * Category update input (all fields optional, PATCH semantics)
 */
export interface CategoryUpdateInput {
  name?: string | null;
  type?: string | null;
  parentId?: string | null;
  order?: number | null;
  isActive?: boolean | null;
}

// ─── Budget ─────────────────────────────────────────────────

/**
 * Budget data (mirrors Prisma Budget model with optional relations)
 */
export type BudgetData = Omit<Budget, 'amount'> & {
  // amount: Prisma.Decimal в БД → number в API (см. lib/db/decimal-extension.ts)
  amount: number;
  Category?: { id: string; name: string; type: string } | null;
  Project?: { id: string; name: string } | null;
};

/**
 * Budget list filter params
 */
export interface BudgetListParams {
  projectId?: string;
  categoryId?: string;
  period?: string;
}

/**
 * Budget creation input
 */
export interface BudgetCreateInput {
  projectId: string;
  categoryId: string;
  amount: number;
  period: string;
  note?: string | null;
}

/**
 * Budget update input (all fields optional, PATCH semantics)
 */
export interface BudgetUpdateInput {
  projectId?: string | null;
  categoryId?: string | null;
  amount?: number | null;
  period?: string | null;
  note?: string | null;
}

// ─── Transaction ────────────────────────────────────────────

/**
 * Transaction data with optional relation includes
 */
export type TransactionData = Omit<Transaction, 'amount'> & {
  // amount: Prisma.Decimal в БД → number в API (см. lib/db/decimal-extension.ts)
  amount: number;
  Category?: { id: string; name: string; type: string } | null;
  Project?: { id: string; name: string } | null;
  Counterparty?: { id: string; name: string } | null;
  Invoice?: { id: string; number: string } | null;
};

/**
 * Transaction list filter params
 */
export interface TransactionListParams {
  projectId?: string;
  categoryId?: string;
  counterpartyId?: string;
  invoiceId?: string;
  type?: string;
  status?: string;
  source?: string;
  paymentMethod?: string;
  dateFrom?: string;
  dateTo?: string;
  includeDeleted?: boolean;
  skip?: number;
  take?: number;
}

/**
 * Transaction creation input
 */
export interface TransactionCreateInput {
  categoryId: string;
  date: string;
  amount: number;
  type: 'income' | 'expense';
  projectId?: string | null;
  counterpartyId?: string | null;
  invoiceId?: string | null;
  description?: string | null;
  source?: string;
  status?: string;
  paymentMethod?: PaymentMethod;
  paymentType?: ProjectPaymentType;
}

/**
 * Transaction update input (all fields optional, PATCH semantics)
 */
export interface TransactionUpdateInput {
  categoryId?: string | null;
  projectId?: string | null;
  counterpartyId?: string | null;
  invoiceId?: string | null;
  date?: string | null;
  amount?: number | null;
  type?: string | null;
  description?: string | null;
  status?: string | null;
  source?: string | null;
}

// ─── CashFlowPayment ────────────────────────────────────────

export type CashFlowPaymentData = Omit<CashFlowPayment, 'amount'> & {
  // amount: Prisma.Decimal в БД → number в API (см. lib/db/decimal-extension.ts)
  amount: number;
  Project?: { id: string; name: string } | null;
  Counterparty?: { id: string; name: string } | null;
};

export interface CashFlowPaymentListParams {
  projectId?: string;
  counterpartyId?: string;
  status?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  dueBefore?: string;
  skip?: number;
  take?: number;
}

export interface CashFlowPaymentCreateInput {
  date: string;
  amount: number;
  type: string;
  projectId?: string | null;
  counterpartyId?: string | null;
  invoiceId?: string | null;
  description?: string | null;
  status?: string;
  dueDate?: string | null;
}

export interface CashFlowPaymentUpdateInput {
  date?: string | null;
  amount?: number | null;
  type?: string | null;
  projectId?: string | null;
  counterpartyId?: string | null;
  description?: string | null;
  status?: string | null;
  dueDate?: string | null;
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
