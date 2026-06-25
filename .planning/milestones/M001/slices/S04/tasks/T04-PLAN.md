---
estimated_steps: 5
estimated_files: 3
skills_used: []
---

# T04: Add initial shadcn/ui components

Adding specific components demonstrates the shadcn/ui system working and provides reusable primitives for the layout.

## Steps

1. Run `npx shadcn@latest add button` from `apps/web/`
2. Run `npx shadcn@latest add card` from `apps/web/`
3. Run `npx shadcn@latest add sheet` from `apps/web/`

## Inputs

- `apps/web/components.json`
- `apps/web/src/lib/utils.ts`

## Expected Output

- `apps/web/src/components/ui/button.tsx`
- `apps/web/src/components/ui/card.tsx`
- `apps/web/src/components/ui/sheet.tsx`

## Verification

test -f apps/web/src/components/ui/button.tsx && test -f apps/web/src/components/ui/card.tsx && test -f apps/web/src/components/ui/sheet.tsx

## Observability Impact

None - this is component installation with no runtime components.
