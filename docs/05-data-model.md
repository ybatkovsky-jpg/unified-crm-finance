# 05. Модель данных

## 5.1. Принципы проектирования

1. **Единая схема в PostgreSQL** — все таблицы в схеме `public`, аудиторские — в `audit`.
2. **Первичные ключи** — UUID (PostgreSQL `uuid` type, генерация через `gen_random_uuid()` по умолчанию).
3. **Временные метки** — `createdAt`, `updatedAt` на всех таблицах; `deletedAt` для soft-deleteable сущностей.
4. **Иерархии** — через `parentId` self-reference с защитой от циклов на уровне приложения.
5. **Перечисления** — PostgreSQL `enum` для стабильных наборов (DealStage, ProjectStatus, PaymentStatus); строковые поля с комментарием для расширяемых.
6. **JSONB** — для динамических атрибутов (настройки автоматизации, конфиги правил, дополнительные поля контакта).
7. **Мягкие ссылки между bounded contexts** — через `*Id` поля (например, `Project.dealId`), без FK-ограничений на уровне БД (но с проверкой на уровне приложения).
8. **Аудит** — отдельная таблица `AuditLog` с типом сущности, ID, действием, diff JSON.

## 5.2. Список сущностей

Всего в целевой модели — 32 сущности, распределённые по 6 bounded contexts:

| # | Сущность | Контекст | Назначение |
|---|----------|----------|------------|
| 1 | `User` | Identity | Пользователь системы |
| 2 | `Role` | Identity | Роль (owner, sales, manager, accountant, storekeeper) |
| 3 | `UserRole` | Identity | Связь пользователь-роль (many-to-many) |
| 4 | `RefreshToken` | Identity | Refresh-токен сессии |
| 5 | `AuditLog` | Identity | Журнал аудита всех действий |
| 6 | `FileEntity` | Shared | Метаданные файла (содержимое в S3) |
| 7 | `Setting` | Shared | Настройки системы (ключ-значение) |
| 8 | `Contact` | CRM | Контакт (физлицо или юрлицо) |
| 9 | `LeadSource` | CRM | Источник лида (звонок, офис, сайт, email, Telegram, другое) |
| 10 | `Interaction` | CRM | Взаимодействие с контактом (звонок, встреча, email, заметка) |
| 11 | `Pipeline` | Sales | Воронка продаж (стадии) |
| 12 | `DealStage` | Sales | Стадия сделки в воронке |
| 13 | `Deal` | Sales | Сделка |
| 14 | `DealHistory` | Sales | История изменений сделки |
| 15 | `ContractTemplate` | Contracts | Шаблон договора |
| 16 | `Contract` | Contracts | Договор |
| 17 | `ContractVersion` | Contracts | Версия договора (история изменений) |
| 18 | `ContractSigner` | Contracts | Подписант договора |
| 19 | `Project` | Projects | Проект (после подписания договора) |
| 20 | `ProjectStage` | Projects | Этап проекта (с датами и ответственными) |
| 21 | `ProjectMember` | Projects | Участник команды проекта |
| 22 | `Counterparty` | Procurement/Finance | Контрагент (поставщик/клиент/подрядчик) |
| 23 | `BOM` | Procurement | Спецификация проекта (Bill of Materials) |
| 24 | `BOMItem` | Procurement | Позиция спецификации |
| 25 | `PurchaseRequest` | Procurement | Запрос поставщику |
| 26 | `PurchaseRequestItem` | Procurement | Позиция запроса |
| 27 | `Invoice` | Procurement | Счёт от поставщика |
| 28 | `InvoiceItem` | Procurement | Позиция счёта |
| 29 | `WarehouseItem` | Procurement | Складская позиция |
| 30 | `WarehouseTransaction` | Procurement | Движение по складу |
| 31 | `Delivery` | Procurement | Поставка |
| 32 | `ApprovalRequest` | Procurement/Finance | Заявка на согласование (закупки/платежа) |
| 33 | `Category` | Finance | Категория доходов/расходов (иерархия) |
| 34 | `Transaction` | Finance | Транзакция (доход/расход) |
| 35 | `Budget` | Finance | Бюджет (план по проекту × категории × периоду) |
| 36 | `CashFlowPayment` | Finance | Плановый/фактический платёж |
| 37 | `ClassificationRule` | Finance | Правило автоклассификации транзакций |
| 38 | `PeriodClose` | Finance | Закрытие периода |
| 39 | `Notification` | Shared | Уведомление пользователю |
| 40 | `SyncLog` | Shared | Журнал синхронизаций с внешними системами |
| 41 | `EmailLog` | Procurement | Журнал email-переписки |
| 42 | `AutomationRule` | Shared | Правило автоматизации |

## 5.3. ER-описание ключевых сущностей

Ниже приведены описания в псевдо-Prisma синтаксе. Полная схема будет в `apps/web/prisma/schema.prisma`.

### 5.3.1. Identity

```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  name         String
  passwordHash String
  phone        String?
  telegramId   String?
  avatarUrl    String?
  isActive     Boolean  @default(true)
  lastLoginAt  DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  deletedAt    DateTime?

  userRoles       UserRole[]
  refreshTokens   RefreshToken[]
  auditLogs       AuditLog[]
  notifications   Notification[]
  contacts        Contact[]      @relation("ContactOwner")
  deals           Deal[]         @relation("DealManager")
  projects        Project[]      @relation("ProjectManager")
  approvals       ApprovalRequest[] @relation("ApprovalRequester")
  approvalDecisions ApprovalRequest[] @relation("ApprovalDecider")
  interactions    Interaction[]  @relation("InteractionAuthor")
}

model Role {
  id          String @id @default(uuid())
  code        String @unique  // owner | sales | manager | accountant | storekeeper
  name        String
  description String?
  permissions Json   // массив строк: "deal:read", "contract:sign", etc.

  users UserRole[]
}

model UserRole {
  userId String
  roleId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  role   Role   @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@id([userId, roleId])
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  userAgent String?
  ip        String?
  expiresAt DateTime
  createdAt DateTime @default(now())
  revokedAt DateTime?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model AuditLog {
  id         String   @id @default(uuid())
  userId     String?
  entityType String   // contact | deal | contract | project | transaction | ...
  entityId   String
  action     String   // create | update | delete | restore | login | logout | sync
  changes    Json?    // { before: {...}, after: {...} }
  metadata   Json?    // { ip, userAgent, source }
  createdAt  DateTime @default(now())

  user User? @relation(fields: [userId], references: [id])

  @@index([entityType, entityId])
  @@index([userId, createdAt])
  @@index([createdAt])
}
```

### 5.3.2. CRM (Contacts, LeadSource, Interaction)

```prisma
model Contact {
  id          String   @id @default(uuid())
  type        String   // person | company
  // Для person
  firstName   String?
  lastName    String?
  middleName  String?
  // Для company
  companyName String?
  inn         String?
  kpp         String?
  ogrn        String?
  // Общие
  email       String?
  phone       String?
  address     String?
  // Адрес фактический (может отличаться от юридического для компании)
  physicalAddress String?
  // Метаданные
  sourceId    String?  // LeadSource.id — откуда пришёл
  ownerId     String?  // User.id — ответственный менеджер
  status      String   @default("active") // active | blacklisted | archived
  tags        String[] @default([])
  attributes  Json?    // дополнительные поля
  notes       String?
  // Взаимосвязи
  deals           Deal[]
  interactions    Interaction[]
  contracts       Contract[]    @relation("ContractClient")
  projects        Project[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  deletedAt       DateTime?

  source    LeadSource?  @relation(fields: [sourceId], references: [id])
  owner     User?        @relation("ContactOwner", fields: [ownerId], references: [id])

  @@index([inn])
  @@index([phone])
  @@index([email])
  @@index([ownerId])
  @@index([status])
}

model LeadSource {
  id          String  @id @default(uuid())
  code        String  @unique  // call | office | website | email | telegram | referral | other
  name        String
  description String?
  isActive    Boolean @default(true)
  createdAt   DateTime @default(now())

  contacts Contact[]
}

model Interaction {
  id          String   @id @default(uuid())
  contactId   String
  type        String   // call | meeting | email | telegram | note | visit
  direction   String?  // incoming | outgoing (для звонков и email)
  subject     String?
  content     String?
  scheduledAt DateTime?  // для запланированных
  completedAt DateTime?
  authorId    String
  contact     Contact @relation(fields: [contactId], references: [id], onDelete: Cascade)
  author      User    @relation("InteractionAuthor", fields: [authorId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([contactId, completedAt])
  @@index([authorId])
}
```

### 5.3.3. Sales (Pipeline, DealStage, Deal, DealHistory)

```prisma
model Pipeline {
  id          String  @id @default(uuid())
  code        String  @unique  // default | b2b | retail
  name        String
  description String?
  isActive    Boolean @default(true)
  stages      DealStage[]
  deals       Deal[]
  createdAt   DateTime @default(now())
}

model DealStage {
  id          String  @id @default(uuid())
  pipelineId  String
  code        String  // new | qualified | meeting | proposal | negotiation | contract | won | lost
  name        String
  order       Int     // позиция в воронке
  probability Float   @default(0)  // вероятность выигрыша в %
  isWonStage  Boolean @default(false)
  isLostStage Boolean @default(false)
  color       String? // hex-цвет для UI

  pipeline    Pipeline @relation(fields: [pipelineId], references: [id], onDelete: Cascade)
  deals       Deal[]

  @@unique([pipelineId, code])
  @@index([pipelineId, order])
}

model Deal {
  id            String    @id @default(uuid())
  number        String    @unique  // С-2026-00001
  title         String
  pipelineId    String
  stageId       String
  contactId     String?   // основной контакт
  amount        Float     @default(0)  // планируемая сумма
  currency      String    @default("RUB")
  expectedCloseDate DateTime?
  actualCloseDate    DateTime?
  managerId     String?
  description   String?
  lossReason    String?
  attributes    Json?
  // Связи
  contractId    String?  @unique  // если договор создан
  projectId     String?  @unique  // если проект создан
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  closedAt      DateTime?
  deletedAt     DateTime?

  pipeline    Pipeline   @relation(fields: [pipelineId], references: [id])
  stage       DealStage  @relation(fields: [stageId], references: [id])
  contact     Contact?   @relation(fields: [contactId], references: [id])
  manager     User?      @relation("DealManager", fields: [managerId], references: [id])
  contract    Contract?  @relation(fields: [contractId], references: [id])
  project     Project?   @relation(fields: [projectId], references: [id])
  history     DealHistory[]

  @@index([stageId])
  @@index([managerId])
  @@index([expectedCloseDate])
}

model DealHistory {
  id        String   @id @default(uuid())
  dealId    String
  fromStageId String?
  toStageId   String?
  comment   String?
  changedBy String
  changedAt DateTime @default(now())

  deal      Deal       @relation(fields: [dealId], references: [id], onDelete: Cascade)

  @@index([dealId, changedAt])
}
```

### 5.3.4. Contracts (ContractTemplate, Contract, ContractVersion, ContractSigner)

```prisma
model ContractTemplate {
  id          String   @id @default(uuid())
  code        String   @unique  // standard_supply | service | nda
  name        String
  description String?
  contentMd   String   // шаблон в Markdown с плейсхолдерами {{clientName}}, {{amount}}, ...
  variables   Json     // список ожидаемых переменных с типами
  isActive    Boolean  @default(true)
  version     Int      @default(1)
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  contracts Contract[]
}

model Contract {
  id           String   @id @default(uuid())
  number       String   @unique  // Д-2026-00001
  dealId       String?  @unique
  contactId    String   // клиент
  templateId   String?
  title        String
  amount       Float    @default(0)
  currency     String   @default("RUB")
  startDate    DateTime?
  endDate      DateTime?
  signedAt     DateTime?
  status       String   @default("draft") // draft | sent | signed | active | completed | cancelled | expired
  signedFileId String?  // FileEntity.id — скан подписанного
  notes        String?
  attributes   Json?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  deletedAt    DateTime?

  deal        Deal?               @relation(fields: [dealId], references: [id])
  contact     Contact             @relation("ContractClient", fields: [contactId], references: [id])
  template    ContractTemplate?   @relation(fields: [templateId], references: [id])
  signedFile  FileEntity?         @relation(fields: [signedFileId], references: [id])
  versions    ContractVersion[]
  signers     ContractSigner[]
  project     Project?            @relation(fields: [contractId], references: [id])

  @@index([contactId])
  @@index([status])
}

model ContractVersion {
  id          String   @id @default(uuid())
  contractId  String
  version     Int
  contentMd   String
  generatedPdfFileId String?
  createdBy   String
  createdAt   DateTime @default(now())

  contract     Contract   @relation(fields: [contractId], references: [id], onDelete: Cascade)
  generatedPdf FileEntity? @relation(fields: [generatedPdfFileId], references: [id])

  @@unique([contractId, version])
}

model ContractSigner {
  id          String  @id @default(uuid())
  contractId  String
  name        String
  position    String?
  signedAt    DateTime?
  signatureFileId String?

  contract Contract @relation(fields: [contractId], references: [id], onDelete: Cascade)

  @@index([contractId])
}
```

### 5.3.5. Projects (Project, ProjectStage, ProjectMember)

```prisma
model Project {
  id              String    @id @default(uuid())
  externalNumber  String    @unique  // ПМ-2026-00001 (читаемый номер)
  name            String
  description     String?
  dealId          String?   @unique
  contractId      String?   @unique
  contactId       String?
  status          String    @default("lead") // lead | active | on_hold | completed | cancelled
  contractAmount  Float     @default(0)
  currency        String    @default("RUB")
  startDate       DateTime?
  endDate         DateTime?
  completedAt     DateTime?
  marginTarget    Float     @default(0.25)
  qualityRating   String?   // good | acceptable | poor
  deadlineStatus  String    @default("on_track") // on_track | at_risk | overdue
  managerId       String?
  attributes      Json?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?

  deal        Deal?       @relation(fields: [dealId], references: [id])
  contract    Contract?   @relation(fields: [contractId], references: [id])
  contact     Contact?    @relation(fields: [contactId], references: [id])
  manager     User?       @relation("ProjectManager", fields: [managerId], references: [id])
  stages      ProjectStage[]
  members     ProjectMember[]
  bom         BOM?
  purchaseRequests PurchaseRequest[]
  invoices    Invoice[]
  transactions Transaction[]
  budgets     Budget[]
  cashFlowPayments CashFlowPayment[]

  @@index([status])
  @@index([managerId])
}

model ProjectStage {
  id          String   @id @default(uuid())
  projectId   String
  code        String   // design | procurement | production | installation | handover
  name        String
  order       Int
  status      String   @default("pending") // pending | in_progress | completed | skipped
  startDate   DateTime?
  endDate     DateTime?
  completedAt DateTime?
  assigneeId  String?
  notes       String?

  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@unique([projectId, code])
  @@index([projectId, order])
}

model ProjectMember {
  id        String @id @default(uuid())
  projectId String
  userId    String
  role      String // manager | buyer | accountant | storekeeper | worker
  joinedAt  DateTime @default(now())
  leftAt    DateTime?

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@unique([projectId, userId])
  @@index([userId])
}
```

### 5.3.6. Procurement (Counterparty, BOM, BOMItem, PurchaseRequest, Invoice, WarehouseItem, Delivery, ApprovalRequest)

```prisma
model Counterparty {
  id           String   @id @default(uuid())
  name         String
  type         String   // supplier | customer | contractor | other (может быть несколько через массив)
  types        String[] @default([])
  inn          String?
  kpp          String?
  email        String?
  phone        String?
  contactPerson String?
  address      String?
  bankName     String?
  bankAccount  String?
  korAccount   String?
  bik          String?
  notes        String?
  rating       Int?     // 1-5, средняя оценка по проектам
  attributes   Json?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  deletedAt    DateTime?

  purchaseRequests  PurchaseRequest[]
  invoices          Invoice[]
  transactions      Transaction[]
  cashFlowPayments  CashFlowPayment[]
  deliveries        Delivery[]
  emailLogs         EmailLog[]

  @@index([inn])
  @@index([type])
}

model BOM {
  id         String   @id @default(uuid())
  projectId  String   @unique
  sourceFileId String?  // исходный Excel
  status     String   @default("draft") // draft | parsed | verified | locked
  version    Int      @default(1)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  project    Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  sourceFile FileEntity? @relation(fields: [sourceFileId], references: [id])
  items      BOMItem[]
}

model BOMItem {
  id           String  @id @default(uuid())
  bomId        String
  rowNumber    Int
  name         String
  article      String?
  category     String?
  quantity     Float
  unit         String  @default("шт")
  price        Float   @default(0)
  supplierId   String?
  status       String  @default("pending") // pending | requested | invoiced | partial | available | ordered | delivered | completed
  isFromWarehouse Boolean @default(false)
  notes        String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  bom       BOM     @relation(fields: [bomId], references: [id], onDelete: Cascade)
  supplier  Counterparty? @relation(fields: [supplierId], references: [id])
  requestItems    PurchaseRequestItem[]
  invoiceItems    InvoiceItem[]
  warehouseTransactions WarehouseTransaction[]

  @@index([bomId])
  @@index([supplierId])
  @@index([status])
}

model PurchaseRequest {
  id           String   @id @default(uuid())
  number       String   @unique  // ЗП-2026-00001
  projectId    String
  supplierId   String
  status       String   @default("draft") // draft | sent | responded | partial | cancelled | closed
  emailTo      String?
  emailSubject String?
  emailBody    String?
  sentAt       DateTime?
  responseAt   DateTime?
  notes        String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  project    Project       @relation(fields: [projectId], references: [id], onDelete: Cascade)
  supplier   Counterparty  @relation(fields: [supplierId], references: [id])
  items      PurchaseRequestItem[]
  approval   ApprovalRequest?

  @@index([projectId])
  @@index([supplierId])
  @@index([status])
}

model PurchaseRequestItem {
  id             String  @id @default(uuid())
  requestId      String
  bomItemId      String
  quantity       Float
  price          Float   @default(0)
  available      Boolean @default(false)
  availableQty   Float   @default(0)
  deliveryDays   Int     @default(0)
  notes          String?

  request    PurchaseRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)
  bomItem    BOMItem         @relation(fields: [bomItemId], references: [id])

  @@index([requestId])
}

model Invoice {
  id            String   @id @default(uuid())
  number        String   @unique  // СЧ-2026-00001
  projectId     String
  supplierId    String
  invoiceNumber String?  // номер от поставщика
  totalAmount   Float    @default(0)
  status        String   @default("received") // received | verified | discrepancy | approved | paid | cancelled
  receivedAt    DateTime @default(now())
  paidAt        DateTime?
  dueDate       DateTime?
  notes         String?
  sourceFileId  String?  // исходный PDF/Excel от поставщика
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  project     Project       @relation(fields: [projectId], references: [id], onDelete: Cascade)
  supplier    Counterparty  @relation(fields: [supplierId], references: [id])
  sourceFile  FileEntity?   @relation(fields: [sourceFileId], references: [id])
  items       InvoiceItem[]
  delivery    Delivery?
  approval    ApprovalRequest?
  transactions Transaction[]  @relation("InvoicePayments")

  @@index([projectId])
  @@index([supplierId])
  @@index([status])
}

model InvoiceItem {
  id             String  @id @default(uuid())
  invoiceId      String
  bomItemId      String?
  name           String
  quantity       Float
  price          Float   @default(0)
  isMatch        Boolean @default(false)
  mismatchReason String?

  invoice    Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  bomItem    BOMItem? @relation(fields: [bomItemId], references: [id])

  @@index([invoiceId])
}

model WarehouseItem {
  id          String   @id @default(uuid())
  name        String
  article     String?
  category    String?
  quantity    Float    @default(0)
  reservedQty Float    @default(0)
  availableQty Float   @default(0)  // = quantity - reservedQty (вычисляется)
  minQuantity Float    @default(0)
  unit        String   @default("шт")
  location    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  transactions WarehouseTransaction[]

  @@index([article])
  @@index([name])
}

model WarehouseTransaction {
  id              String   @id @default(uuid())
  warehouseItemId String
  bomItemId       String?
  type            String   // in | out | reserve | release
  quantity        Float
  notes           String?
  createdAt       DateTime @default(now())

  warehouseItem WarehouseItem @relation(fields: [warehouseItemId], references: [id], onDelete: Cascade)
  bomItem       BOMItem?       @relation(fields: [bomItemId], references: [id])

  @@index([warehouseItemId])
}

model Delivery {
  id             String   @id @default(uuid())
  projectId      String
  supplierId     String
  invoiceId      String?  @unique
  status         String   @default("pending") // pending | shipped | in_transit | delivered | cancelled
  trackingNumber String?
  carrier        String?
  estimatedDate  DateTime?
  actualDate     DateTime?
  notes          String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  project  Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  supplier Counterparty @relation(fields: [supplierId], references: [id])
  invoice  Invoice?     @relation(fields: [invoiceId], references: [id])

  @@index([projectId])
}

model ApprovalRequest {
  id          String   @id @default(uuid())
  type        String   // purchase | payment | writeoff
  entityId    String   // ID связанной сущности (PurchaseRequest/Invoice/etc.)
  status      String   @default("pending") // pending | approved | rejected | cancelled
  amount      Float?
  requestedBy String
  requestedAt DateTime @default(now())
  decidedBy   String?
  decidedAt   DateTime?
  comment     String?

  requester User? @relation("ApprovalRequester", fields: [requestedBy], references: [id])
  decider   User? @relation("ApprovalDecider", fields: [decidedBy], references: [id])

  // Связь с одной из сущностей (полиморфная через тип + ID)
  purchaseRequest PurchaseRequest? @relation(fields: [entityId], references: [id])
  invoice         Invoice?         @relation(fields: [entityId], references: [id])

  @@index([status])
  @@index([requestedBy])
}
```

### 5.3.7. Finance (Category, Transaction, Budget, CashFlowPayment, ClassificationRule, PeriodClose)

```prisma
model Category {
  id        String   @id @default(uuid())
  name      String
  type      String   // income | expense
  parentId  String?
  order     Int      @default(0)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  parent              Category?             @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children            Category[]            @relation("CategoryHierarchy")
  transactions        Transaction[]
  budgets             Budget[]
  classificationRules ClassificationRule[]

  @@index([type])
  @@index([parentId])
}

model Transaction {
  id              String   @id @default(uuid())
  projectId       String?
  categoryId      String
  counterpartyId  String?
  invoiceId       String?  // связка со счётом закупок
  createdBy       String
  date            DateTime
  amount          Float
  type            String   // income | expense
  description     String?
  source          String   @default("manual") // manual | 1c_clientbank | zakuppro | cash
  externalId      String?  // для дедупликации
  status          String   @default("confirmed") // pending | confirmed | classified
  fileIds         String[] @default([])
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  deletedAt       DateTime?

  project     Project?      @relation(fields: [projectId], references: [id], onDelete: SetNull)
  category    Category      @relation(fields: [categoryId], references: [id])
  counterparty Counterparty? @relation(fields: [counterpartyId], references: [id])
  invoice     Invoice?      @relation("InvoicePayments", fields: [invoiceId], references: [id])

  @@unique([externalId, source, date])
  @@index([projectId, date])
  @@index([categoryId])
  @@index([type, date])
  @@index([source])
}

model Budget {
  id          String   @id @default(uuid())
  projectId   String
  categoryId  String
  amount      Float
  period      String   // 2026-01 | 2026-Q1 | 2026
  note        String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  project  Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  category Category @relation(fields: [categoryId], references: [id])

  @@unique([projectId, categoryId, period])
}

model CashFlowPayment {
  id             String   @id @default(uuid())
  date           DateTime
  amount         Float
  type           String   // inflow | outflow | planned_inflow | planned_outflow
  counterpartyId String?
  projectId      String?
  invoiceId      String?
  description    String?
  status         String   @default("planned") // planned | confirmed | cancelled
  dueDate        DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  counterparty Counterparty? @relation(fields: [counterpartyId], references: [id], onDelete: SetNull)
  project      Project?      @relation(fields: [projectId], references: [id])

  @@index([projectId, date])
  @@index([status, date])
}

model ClassificationRule {
  id                   String   @id @default(uuid())
  keyword              String
  categoryId           String
  counterpartyKeyword  String?
  projectId            String?
  priority             Int      @default(0)
  isActive             Boolean  @default(true)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  category Category @relation(fields: [categoryId], references: [id])
}

model PeriodClose {
  id         String   @id @default(uuid())
  period     String   @unique  // 2026-01 | 2026-Q1 | 2026
  closedBy   String
  closedAt   DateTime @default(now())
  note       String?
  isReopened Boolean  @default(false)
}
```

### 5.3.8. Shared (FileEntity, Setting, Notification, SyncLog, EmailLog, AutomationRule)

```prisma
model FileEntity {
  id           String   @id @default(uuid())
  filename     String
  mimeType     String
  size         Int
  storageKey   String   // ключ в S3/MinIO
  bucket       String   @default("default")
  uploadedBy   String?
  createdAt    DateTime @default(now())

  // Полиморфные связи — через отдельные поля
  bomSource             BOM?                @relation(fields: [id], references: [sourceFileId])
  invoiceSource         Invoice?            @relation(fields: [id], references: [sourceFileId])
  contractSigned        Contract?           @relation(fields: [id], references: [signedFileId])
  contractVersionPdf    ContractVersion?    @relation(fields: [id], references: [generatedPdfFileId])

  @@index([uploadedBy])
}

model Setting {
  id    String @id @default(uuid())
  key   String @unique
  value String
  type  String @default("string") // string | number | boolean | json
}

model Notification {
  id        String   @id @default(uuid())
  userId    String
  type      String   // deal_stage_changed | project_deadline | budget_overrun | cash_gap | invoice_received | approval_request | sync_error | system
  title     String
  message   String
  level     String   @default("info") // info | success | warning | error
  link      String?
  isRead    Boolean  @default(false)
  readAt    DateTime?
  metadata  Json?
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isRead])
  @@index([createdAt])
}

model SyncLog {
  id           String   @id @default(uuid())
  source       String   // 1c_clientbank | zakuppro | csv | email | telegram
  status       String   // success | partial | failed
  recordsTotal Int      @default(0)
  recordsSynced Int     @default(0)
  errors       String?
  startedAt    DateTime @default(now())
  completedAt  DateTime?
}

model EmailLog {
  id          String   @id @default(uuid())
  projectId   String?
  supplierId  String?
  direction   String   // outgoing | incoming
  subject     String
  body        String
  from        String
  to          String
  attachments Json?
  sentAt      DateTime @default(now())
  createdAt   DateTime @default(now())

  project    Project?      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  supplier   Counterparty? @relation(fields: [supplierId], references: [id])
}

model AutomationRule {
  id         String   @id @default(uuid())
  name       String
  type       String   // auto_create_requests | auto_status_transition | auto_budget_alert | ...
  enabled    Boolean  @default(false)
  config     Json
  lastRunAt  DateTime?
  runCount   Int      @default(0)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

## 5.4. Индексы и производительность

На тяжёлых таблицах (`Transaction`, `AuditLog`, `EmailLog`, `WarehouseTransaction`) создаются дополнительные индексы:

- `Transaction(projectId, date)` — для P&L по проекту за период.
- `Transaction(type, date)` — для общих отчётов.
- `AuditLog(entityType, entityId)` — для истории сущности.
- `AuditLog(userId, createdAt)` — для активности пользователя.
- `EmailLog(projectId, sentAt)` — для переписки по проекту.

Для аналитики (P&L, кассовый календарь) — материализованные представления, обновляемые раз в час:

- `mv_project_pnl` — прибыль/убыток по проекту с начала.
- `mv_cashflow_calendar` — кассовый календарь на 30/60/90 дней.
- `mv_deal_funnel` — конверсия воронки по стадиям.

## 5.5. Миграция с исходных моделей

| Источник (zakuppro/finpro) | Целевая сущность | Примечание |
|----------------------------|------------------|------------|
| zakuppro.`Supplier` + finpro.`Counterparty` | `Counterparty` | Слияние: тип определяется через `types[]` |
| finpro.`Client` | `Contact` (type=company) | Расширение полей |
| finpro.`Project` + zakuppro.`Project` | `Project` | Единая модель с расширенными полями |
| zakuppro.`ProjectItem` | `BOMItem` (через `BOM`) | Добавлен уровень `BOM` для версионности |
| zakuppro.`PurchaseRequest`/`Item` | `PurchaseRequest`/`PurchaseRequestItem` | Идентично |
| zakuppro.`Invoice`/`Item` | `Invoice`/`InvoiceItem` | Идентично |
| zakuppro.`WarehouseItem`/`Transaction` | `WarehouseItem`/`WarehouseTransaction` | Добавлено `reservedQty`, `availableQty` |
| finpro.`Transaction` | `Transaction` | Добавлен `invoiceId` для связи со счетом |
| finpro.`Category` | `Category` | Идентично |
| finpro.`Budget` | `Budget` | Идентично |
| finpro.`CashFlowPayment` | `CashFlowPayment` | Добавлен `invoiceId` |
| finpro.`ClassificationRule` | `ClassificationRule` | Идентично |
| finpro.`PeriodClose` | `PeriodClose` | Идентично |
| finpro.`Notification` | `Notification` | Расширено `level`, `metadata` |
| finpro.`SyncLog` | `SyncLog` | Идентично |
| finpro.`User` | `User` | Роли через `Role`+`UserRole` (many-to-many) |
| zakuppro.`CompanyDetails` | `Setting` (как JSON) | Упрощение |
| zakuppro.`EmailSettings`/`AiSettings`/`TelegramSettings` | `Setting` (как JSON) | Упрощение |
| zakuppro.`AutomationRule` | `AutomationRule` | Идентично |
| zakuppro.`EmailLog` | `EmailLog` | Идентично |
| zakuppro.`Delivery` | `Delivery` | Идентично |
| zakuppro.`ProjectStatusHistory` | `AuditLog` | Консолидация в единый журнал |
| — | `Contact`, `LeadSource`, `Interaction` | Новые (CRM) |
| — | `Pipeline`, `DealStage`, `Deal`, `DealHistory` | Новые (Sales) |
| — | `ContractTemplate`, `Contract`, `ContractVersion`, `ContractSigner` | Новые (Contracts) |
| — | `ProjectStage`, `ProjectMember` | Новые (Projects) |
| — | `ApprovalRequest` | Новый (согласования) |
| — | `FileEntity` | Новый (общий файловый реестр) |
| — | `Role`, `UserRole` | Новые (гибкий RBAC) |
