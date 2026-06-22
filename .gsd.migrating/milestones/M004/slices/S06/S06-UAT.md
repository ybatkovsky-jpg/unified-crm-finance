# S06: Production Management — UAT

**Milestone:** M004
**Written:** 2026-06-22T13:58:04.731Z

# UAT: Production Management (S06)

## Test Scenario 1: Create Production
1. Navigate to a project detail page
2. Click "Добавить производство" button
3. Select type: "Плитные материалы" or "Столешницы"
4. Set planned dates (optional)
5. Add notes (optional)
6. Click "Создать"
7. **Verify**: Production appears in list with correct type badge, status "Планирование", and 8 stages shown as dots

## Test Scenario 2: View Production Details
1. On project detail page, expand a production card
2. **Verify**: Type badge, status, progress bar, stage indicators visible
3. **Verify**: Expanded view shows dates, notes, stages list with status colors

## Test Scenario 3: Start Production
1. Click "Начать" button on production card (when status is "Планирование")
2. **Verify**: Status changes to "В работе", actualStartDate set to today

## Test Scenario 4: Complete Production
1. Click "Завершить" button (when status is "В работе")
2. **Verify**: Status changes to "Завершено", progress = 100%, actualEndDate set

## Test Scenario 5: Delete Production
1. Click trash icon on production card
2. **Verify**: Confirmation dialog appears
3. Confirm deletion
4. **Verify**: Production removed from list

## Test Scenario 6: Status Change
1. Expand production card
2. Use status dropdown to change status
3. **Verify**: Status badge updates immediately

## Test Scenario 7: Edit Production Details
1. Expand production card
2. Click "Изменить"
3. Update planned dates or notes
4. Click "Сохранить"
5. **Verify**: Changes saved and displayed

## Expected Results
- All API calls succeed without console errors
- Loading states visible during operations
- Error messages display on failures
- Production list auto-refreshes after create/update/delete
