# S04: Project Detail Page — UAT

**Milestone:** M004
**Written:** 2026-06-22T13:10:43.617Z

# UAT: Project Detail Page (S04)

## Test Scenarios

### 1. View Project Details
1. Navigate to `/projects`
2. Click on any project row
3. **Expected**: Project detail page loads showing project name, status, contract amount, dates, description

### 2. View Stages List
1. On project detail page
2. **Expected**: Stages section displays all project stages with color-coded status indicators (green=completed, blue=active, gray=pending, red=blocked)

### 3. View Team Members
1. On project detail page, look at "Команда" card in sidebar
2. **Expected**: Active team members are listed with names, emails, and roles

### 4. View Related Entities
1. On project detail page, look at "Связанные сущности" section
2. **Expected**: Links to Contact, Manager, Deal (if exists), and Contract (if exists) are displayed

### 5. Edit Project
1. Click "Изменить" button
2. Modify project name or status
3. Click "Сохранить"
4. **Expected**: Changes are saved and reflected on the page

### 6. Edit Cancel
1. Click "Изменить" button
2. Modify some fields
3. Click "Отмена"
4. **Expected**: Form reverts to original values, no changes saved

### 7. Navigation
1. Click back arrow button
2. **Expected**: Returns to projects list page

### 8. Error Handling
1. Navigate to `/projects/invalid-id`
2. **Expected**: Error message displayed with "Go Back" button

## Result
All test scenarios passed. Project Detail Page is fully functional.
