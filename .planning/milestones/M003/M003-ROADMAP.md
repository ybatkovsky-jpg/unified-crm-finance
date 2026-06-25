# M003: Сделки и контракты

**Vision:** CRM модуль для управления сделками от лида до подписанного договора: kanban-доска с drag-and-drop по этапам, аудит перемещений через DealHistory, конвертация выигранной сделки в контракт, версионность контрактов, подписанты.

## Success Criteria

- Создание сделки через API с автонумерацией С-YYYY-NNNNN и привязкой к контакту
- Drag-and-drop на kanban обновляет stage в БД и пишет DealHistory
- Конвертация сделки создаёт Contract с bidirectional link (deal.contractId + contract.dealId)
- Детальная страница сделки показывает DealHistoryTimeline с переходами между этапами
- Детальная страница контракта показывает версии и подписантов
- API routes протестированы, UI компоненты рендерятся без ошибок

## Slices

- [x] **S01: S01** `risk:low` `depends:[]`
  > After this: curl POST /api/deals создаёт сделку с автонумерацией С-YYYY-NNNNN; PUT /api/deals/[id]/move меняет stage и пишет DealHistory; GET /api/deals возвращает сделки с фильтрами

- [x] **S02: S02** `risk:medium` `depends:[]`
  > After this: Страница /deals показывает колонки по stage order; drag-and-drop карточки между колонками вызывает API move; FilterBar фильтрует по статусу; CreateDealModal создаёт сделку

- [x] **S03: S03** `risk:low` `depends:[]`
  > After this: Страница /deals/[id] показывает карточку сделки с контактом, этапом, суммой; DealHistoryTimeline показывает историю переходов fromStage→toStage с датами и комментариями

- [x] **S04: S04** `risk:medium` `depends:[]`
  > After this: POST /api/deals/[id]/convert создаёт Contract из Deal, устанавливает bidirectional link; ContractRepository.addVersion инкрементирует номер версии; ContractRepository.addSigner добавляет подписанта

- [x] **S05: Contract List and Detail Pages** `risk:low` `depends:[S04]`
  > After this: Страница /contracts показывает список контрактов с поиском по контакту и фильтром по статусу; /contracts/[id] показывает tabs: Details, Versions, Signers, Related

## Boundary Map

Not provided.
