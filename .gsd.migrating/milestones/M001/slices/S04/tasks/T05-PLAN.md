---
estimated_steps: 5
estimated_files: 2
skills_used: []
---

# T05: Create sidebar and header components

Dashboard needs persistent navigation (sidebar) and user controls (header with theme toggle).

## Steps

1. Create `apps/web/src/components/sidebar.tsx` with navigation links
2. Create `apps/web/src/components/header.tsx` as client component with theme toggle
3. Use lucide-react icons for all elements

## Inputs

- `apps/web/src/components/ui/button.tsx`
- `apps/web/src/components/ui/sheet.tsx`
- `apps/web/src/components/theme-provider.tsx`

## Expected Output

- `apps/web/src/components/sidebar.tsx`
- `apps/web/src/components/header.tsx`

## Verification

test -f apps/web/src/components/sidebar.tsx && test -f apps/web/src/components/header.tsx && grep -q 'useTheme' apps/web/src/components/header.tsx

## Observability Impact

None - these are UI components with no special observability needs.
