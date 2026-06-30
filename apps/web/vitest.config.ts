import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
    // Старые тесты на node:test (не vitest) — исключены поименно.
    // Мои Phase 10 vitest-тесты: tasks.test.ts остаётся включённым.
    exclude: [
      'src/lib/db/approvals.test.ts',
      'src/lib/db/bom.test.ts',
      'src/lib/db/categories.test.ts',
      'src/lib/db/contacts.test.ts',
      'src/lib/db/contracts.test.ts',
      'src/lib/db/counterparties.test.ts',
      'src/lib/db/deals.test.ts',
      'src/lib/db/deliveries.test.ts',
      'src/lib/db/interactions.test.ts',
      'src/lib/db/invoices.test.ts',
      'src/lib/db/org.test.ts',
      'src/lib/db/production.test.ts',
      'src/lib/db/projects.test.ts',
      'src/lib/db/purchase-requests.test.ts',
      'src/lib/db/task-templates.test.ts',
      'src/lib/db/warehouse.test.ts',
      'src/lib/org/rrule.test.ts',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
