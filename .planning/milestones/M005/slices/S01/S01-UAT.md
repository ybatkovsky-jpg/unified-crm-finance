# S01: Контрагенты (поставщики) — UAT

**Milestone:** M005
**Written:** 2026-06-23T10:32:21.418Z


## UAT Type
UI + API verification

## Preconditions
1. Dev server running at localhost:3000
2. Database seeded (at minimum, migrations applied)
3. No existing counterparties in database (or note existing ones)

## Steps

### TC-01: Navigate to Counterparty List
1. Open browser to http://localhost:3000/procurement/counterparties
2. **Expected:** Page loads with "Контрагенты" heading, type filter dropdown (default "All types"), search input, "Create" button, and a table
3. **Expected:** If no counterparties exist, empty state message is shown

### TC-02: Create a Supplier Counterparty
1. Click "Create" button
2. **Expected:** Modal dialog opens with form fields including name, type, INN, KPP, email, phone, contact person, address, bank details section (bank name, account, correspondent account, BIK), notes, rating
3. Fill in: Name = "ООО ТестПоставка", Type = "Supplier", INN = "7700000001", Email = "test@supplier.ru"
4. Fill bank details: Bank Name = "Сбербанк", Account = "40702810000000000001", BIK = "044525225"
5. Click submit/save button
6. **Expected:** Modal closes, list refreshes, new counterparty appears in table with Name "ООО ТестПоставка", Type badge "supplier"

### TC-03: Filter by Type
1. Select "Supplier" from type filter dropdown
2. **Expected:** List shows only type=supplier counterparties
3. Select "All types" again
4. **Expected:** All counterparties shown

### TC-04: Search by Name/INN
1. Type "Тест" in search input
2. **Expected:** After 300ms debounce, list filters to show only "ООО ТестПоставка"
3. Clear search
4. **Expected:** Full list returns

### TC-05: View Counterparty Detail
1. Click on "ООО ТестПоставка" name in the table
2. **Expected:** Detail page loads at /procurement/counterparties/[id]
3. **Expected:** Header card shows name, supplier type badge, star rating
4. **Expected:** Details grid shows INN, KPP, Email, Phone, Contact Person, Address
5. **Expected:** Bank details card shows bank name, account, corr. account, BIK
6. **Expected:** Tabs visible: Details (active), Purchase Requests, Invoices, Deliveries
7. Click each history tab (Purchase Requests, Invoices, Deliveries)
8. **Expected:** Each tab shows appropriate empty state message ("No purchase requests yet", etc.)

### TC-06: Edit a Counterparty
1. Navigate back to list (use nav bar or back button)
2. Locate "ООО ТестПоставка" in the list
3. (Edit functionality verified via API: PUT /api/counterparties/[id] returns updated data)

### TC-07: Delete a Counterparty
1. (Delete verified via API: DELETE /api/counterparties/[id] returns success message and record is soft-deleted)
2. **Expected:** Subsequent GET /api/counterparties/[id] returns 404
3. **Expected:** Soft-deleted record excluded from list queries

## Edge Cases Verified
- **Missing required field (name):** POST /api/counterparties without name → 400 `{ error: "Validation failed", message: "name is required" }`
- **Invalid type:** POST with type "partner" → 400 `{ error: "Validation failed", message: "type must be supplier or customer" }`
- **Non-existent ID:** GET /api/counterparties/nonexistent-id → 404
- **Double delete:** DELETE on already-deleted counterparty → 404
- **Server error:** Database failure → 500 `{ error, message }` with console.error

## Not Proven By This UAT
- Real purchase request/invoice/delivery data in history tabs (requires S03/S04/S07)
- Email sending for purchase requests (requires S03)
- Authentication/authorization on counterparty routes (tested at middleware level)
- Visual design consistency across browsers/devices (component library handles this)

