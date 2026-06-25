# S02: S02: BOM — Excel upload, editing, supplier assignment, lock — UAT

**Milestone:** M005
**Written:** 2026-06-23T22:53:05.534Z

## UAT: BOM Section

### 1. Create BOM from Excel
1. Navigate to project detail page
2. Find "Спецификация (BOM)" section (after Production, before File Attachments)
3. Click "Create BOM" button
4. Upload Excel file with columns: name/наименование, quantity/количество, unit/ед.изм, price/цена, article/артикул, category/категория
5. Preview table shows parsed rows
6. Click "Create BOM" to confirm

### 2. Edit BOM Items
1. In BOM section, click any editable cell (Name, Qty, Unit, Price)
2. Modify value
3. Press Enter or click away to save
4. Total updates automatically

### 3. Assign Supplier
1. Click supplier dropdown cell
2. Select supplier from list (shows Name + INN)
3. Selection saves to BOM item

### 4. Lock/Unlock BOM
1. Click "Lock BOM" button
2. All inputs become disabled
3. Button changes to "Unlock BOM"
4. Click to unlock for editing

### 5. Manual Add Row
1. Click "Add Row" button
2. New empty row appears
3. Fill in required fields
4. Row saves on blur
