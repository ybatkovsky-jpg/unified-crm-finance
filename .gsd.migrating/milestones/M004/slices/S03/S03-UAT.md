# S03: Project List + Create UI — UAT

**Milestone:** M004
**Written:** 2026-06-22T11:15:01.480Z

# S03 UAT: Projects List and Create Project

**UAT Type:** Manual Testing (Dev Environment)

## Preconditions
1. Dev server running at `localhost:3000`
2. User logged in with dashboard access
3. At least one contact exists (for project linking)

## Test Cases

### TC1: View Projects List
**Steps:**
1. Navigate to `/projects`
2. Verify page loads with "Проекты" header
3. Verify "Create Project" button visible in top-right

**Expected:**
- Page title "Проекты" displayed
- "Создать проект" button visible
- If no projects exist: "No projects found" message
- If projects exist: table with columns (Номер, Название, Статус, Менеджер, Клиент, Даты, Сумма)

### TC2: Filter by Status
**Steps:**
1. On projects page, click Status dropdown
2. Select "Активный"
3. Verify list updates

**Expected:**
- Only projects with status="active" displayed
- Table updates immediately

### TC3: Filter by Manager
**Steps:**
1. On projects page, click Manager dropdown
2. Select a manager (if projects have managers)
3. Verify list updates

**Expected:**
- Only projects with selected manager displayed
- Dropdown populated from actual project managers

### TC4: Create Project - Minimal Form
**Steps:**
1. Click "Создать проект" button
2. Enter "ПМ-2026-001" in Номер проекта
3. Enter "Test Project" in Название
4. Click "Создать"

**Expected:**
- Modal closes
- New project appears in list
- Success feedback (project visible in table)

### TC5: Create Project - With Contact Link
**Steps:**
1. Open "Создать проект" modal
2. Fill required fields (Номер, Название)
3. Click in "Контракт / Контрагент" search box
4. Type to search contacts
5. Select a contact
6. Click "Создать"

**Expected:**
- Contact selection displayed with icon
- Project created with contactId linked
- Contact name visible in project table row

### TC6: Create Project - With Deal Link
**Steps:**
1. Open modal, fill required fields
2. In "Сделка" section, search and select a deal
3. Click "Создать"

**Expected:**
- Deal selection displayed with Briefcase icon
- Deal amount badge shown if present
- Project created with dealId linked

### TC7: Create Project - Full Form
**Steps:**
1. Open modal
2. Fill all fields:
   - Номер: "ПМ-2026-FULL"
   - Название: "Full Test Project"
   - Описание: "Testing all fields"
   - Статус: "Активный"
   - Менеджер: "Admin"
   - Валюта: "USD"
   - Сумма контракта: "10000"
   - Дата начала: today's date
   - Дата окончания: date 30 days from now
   - Целевая маржа: "0.30"
   - Link a contact and deal
3. Click "Создать"

**Expected:**
- All fields submitted correctly
- Project displays in list with all values formatted
- Status badge shows "Активный"
- Dates formatted in ru-RU locale
- Currency amount formatted as USD

### TC8: Form Validation
**Steps:**
1. Open modal
2. Leave all fields empty
3. Click "Создать" button (should be disabled)

**Expected:**
- Submit button disabled when required fields empty
- HTML5 validation prevents submission

### TC9: Searchable Dropdowns - Contact Filter
**Steps:**
1. Open modal with 10+ contacts in system
2. In contact search, type a partial name
3. Verify list filters

**Expected:**
- List filters in real-time as you type
- Case-insensitive search
- Shows "Контакты не найдены" if no matches

### TC10: Modal Close and Reset
**Steps:**
1. Open modal
2. Fill some fields
3. Click "Отмена" or close dialog

**Expected:**
- Modal closes
- All form fields reset to defaults
- No project created

### TC11: Create Refreshes List
**Steps:**
1. Note current project count
2. Create new project via modal
3. Verify project appears

**Expected:**
- New project visible immediately in table
- No page refresh required
- Current filter state preserved

## Edge Cases

### EC1: No Projects Exist
**Expected:** "No projects found" empty state message, not a broken table

### EC2: No Managers Available
**Expected:** Manager dropdown shows only "Все менеджеры", no error

### EC3: No Contacts/Deals/Contracts
**Expected:** Searchable dropdowns show "Загрузка..." then appropriate empty message

### EC4: External Number with Special Chars
**Expected:** Accepts and displays values like "ПМ-2026-001/А"

## Not Proven By This UAT
- Actual API responses (requires backend running)
- Concurrent project creation by multiple users
- Large list performance (1000+ projects)
