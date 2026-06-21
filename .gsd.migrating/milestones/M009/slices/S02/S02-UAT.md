# S02: Deals UI — UAT

**Milestone:** M009
**Written:** 2026-06-21T09:32:35.066Z

## UAT: Deals UI

### 1. Open /deals
- Kanban board рендерится с 8 колонками этапов
- Карточки сделок отображаются в соответствующих колонках
- Каждая карточка показывает: title, number, amount, contact, manager, expectedCloseDate

### 2. Drag-and-drop
- Перетащить карточку между колонками
- POST /api/deals/[id]/move вызывается
- Карточка перемещается в новой колонке
- DealHistory запись создана

### 3. Create Deal
- Кликнуть "Создать сделку"
- Заполнить форму (title required)
- После создания карточка появляется в первой колонке

### 4. Filter
- Выбрать "Открытые" - только открытые сделки
- Выбрать "Закрытые" - только закрытые сделки

### 5. Deal Detail
- Кликнуть на карточку - переход на /deals/[id]
- Детали отображаются: stage, amount, dates, description
- Related: контакт ссылается на /crm/contacts/[id]
- Edit mode сохраняет изменения
