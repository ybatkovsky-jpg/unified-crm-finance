---
estimated_steps: 6
estimated_files: 4
skills_used: []
---

# T04: Interaction UI components

Why: S04 Contact Detail page will embed interaction form and timeline. S03 must build these reusable components now. Depends on shadcn/ui Dialog and Textarea (not yet installed).

Do:
1. Install missing shadcn/ui components: `npx shadcn@latest add dialog textarea`. This creates src/components/ui/dialog.tsx and src/components/ui/textarea.tsx.
2. Create src/components/crm/interaction-timeline.tsx — "use client" component that accepts contactId prop. Fetches interactions via interactionsApi.getContactInteractions(contactId) on mount. Renders chronological list with: type badge (Phone/Calendar/Mail icons from lucide-react for call/meeting/email), date (Intl.DateTimeFormat), author name, subject, content preview. States: loading spinner, empty ("No interactions yet"), error with retry button. Uses shadcn/ui Card, Badge (already installed).
3. Create src/components/crm/interaction-form.tsx — "use client" component with Dialog trigger button ("Add Interaction") + Dialog content. Form fields: type (Select: call/meeting/email/note/task), direction (Select: inbound/outbound, shown for call/meeting/email), subject (Input), content (Textarea), scheduledAt (Input type=datetime-local), completedAt (Input type=datetime-local). authorId passed as prop or hardcoded lookup. On submit: POST via interactionsApi.createInteraction(), close dialog on success, show error on failure. Uses shadcn/ui Dialog (DialogTrigger, DialogContent, DialogHeader, DialogTitle), Select, Input, Textarea, Button.

Done when: `npx next build` succeeds with both components; `npx next dev` → components render without runtime errors.

## Inputs

- `apps/web/src/components/ui/card.tsx`
- `apps/web/src/components/ui/badge.tsx`
- `apps/web/src/components/ui/button.tsx`
- `apps/web/src/components/ui/input.tsx`
- `apps/web/src/components/ui/select.tsx`
- `apps/web/src/lib/api/interactions.ts`

## Expected Output

- `apps/web/src/components/crm/interaction-form.tsx`
- `apps/web/src/components/crm/interaction-timeline.tsx`

## Verification

npx next build

## Observability Impact

UI error states with retry button visible to user; loading spinner for async data; empty state for zero interactions
